-- EXTEND GROUP ASSIGNMENTS EXPIRATION TO MATCH 30-DAY SUBSCRIPTIONS
-- This script ensures Group assignments expire when their associated subscription expires
-- Execute in Supabase SQL Editor

-- ========================================
-- PHASE 1: ANALYZE CURRENT GROUP ASSIGNMENT STRUCTURE
-- ========================================

SELECT 'PHASE 1: Analyzing current Group assignment structure...' as phase;

-- Check current group_assignments table structure
SELECT 'Group assignments table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'group_assignments'
ORDER BY ordinal_position;

-- Check if there are any existing group assignments
SELECT 'Current group assignments count:' as info;
SELECT COUNT(*) as total_assignments FROM group_assignments WHERE is_active = true;

-- ========================================
-- PHASE 2: CREATE GROUP ASSIGNMENT EXPIRATION FUNCTION
-- ========================================

SELECT 'PHASE 2: Creating Group assignment expiration function...' as phase;

-- Function to expire group assignments when their associated subscription expires
CREATE OR REPLACE FUNCTION expire_group_assignments_with_subscriptions()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER := 0;
    assignment_record RECORD;
BEGIN
    -- Find group assignments whose associated subscriptions have expired
    FOR assignment_record IN 
        SELECT DISTINCT
            ga.id as assignment_id,
            ga.user_id,
            ga.program_id,
            pts.id as schedule_id,
            m.end_date as subscription_end_date,
            m.status as subscription_status
        FROM group_assignments ga
        JOIN personal_training_schedules pts ON ga.program_id = pts.id
        JOIN memberships m ON pts.user_id = m.user_id
        JOIN membership_packages mp ON m.package_id = mp.id
        WHERE mp.package_type = 'personal' -- Group subscriptions use Personal Training package
        AND ga.is_active = true
        AND m.status = 'active'
        AND m.end_date < CURRENT_DATE -- Subscription has expired
    LOOP
        -- Deactivate the group assignment
        UPDATE group_assignments 
        SET 
            is_active = false,
            updated_at = NOW()
        WHERE id = assignment_record.assignment_id;
        
        expired_count := expired_count + 1;
        
        RAISE NOTICE 'Expired group assignment % for user % (subscription expired on %)', 
            assignment_record.assignment_id, assignment_record.user_id, assignment_record.subscription_end_date;
    END LOOP;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PHASE 3: CREATE COMPREHENSIVE GROUP EXPIRATION FUNCTION
-- ========================================

SELECT 'PHASE 3: Creating comprehensive Group expiration function...' as phase;

-- Function to handle all Group-related expiration (subscriptions + assignments)
CREATE OR REPLACE FUNCTION expire_group_subscriptions_and_assignments()
RETURNS TEXT AS $$
DECLARE
    expired_assignments INTEGER;
    result_text TEXT;
BEGIN
    -- Expire group assignments whose subscriptions have expired
    SELECT expire_group_assignments_with_subscriptions() INTO expired_assignments;
    
    -- Build result summary
    result_text := 'Group expiration check completed. Expired ' || expired_assignments || ' group assignments.';
    
    RAISE NOTICE '%', result_text;
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PHASE 4: EXTEND EXISTING EXPIRATION FUNCTIONS
-- ========================================

SELECT 'PHASE 4: Extending existing expiration functions...' as phase;

-- Update the main expiration function to include group assignments
CREATE OR REPLACE FUNCTION check_and_expire_all_subscriptions()
RETURNS TEXT AS $$
DECLARE
    membership_result TEXT;
    group_result TEXT;
    paspartu_result TEXT;
    final_result TEXT;
BEGIN
    -- Expire regular memberships
    PERFORM check_and_expire_memberships();
    membership_result := 'Memberships checked and expired.';
    
    -- Expire group assignments
    SELECT expire_group_subscriptions_and_assignments() INTO group_result;
    
    -- Expire paspartu lessons
    SELECT check_and_expire_paspartu_lessons() INTO paspartu_result;
    
    -- Combine results
    final_result := membership_result || ' ' || group_result || ' ' || paspartu_result;
    
    RAISE NOTICE 'Complete expiration check: %', final_result;
    
    RETURN final_result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PHASE 5: CREATE GROUP EXPIRATION MONITORING VIEW
-- ========================================

SELECT 'PHASE 5: Creating Group expiration monitoring view...' as phase;

-- View to monitor Group subscription and assignment expiration
CREATE OR REPLACE VIEW group_subscription_expiration_status AS
SELECT 
    pts.user_id,
    up.first_name,
    up.last_name,
    up.email,
    pts.id as program_id,
    pts.training_type,
    pts.group_room_size,
    pts.weekly_frequency,
    m.start_date as subscription_start,
    m.end_date as subscription_end,
    m.status as subscription_status,
    COUNT(ga.id) as total_assignments,
    COUNT(CASE WHEN ga.is_active THEN 1 END) as active_assignments,
    CASE 
        WHEN m.end_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN m.end_date < CURRENT_DATE + INTERVAL '7 days' THEN 'EXPIRING SOON'
        ELSE 'ACTIVE'
    END as expiration_status,
    CASE 
        WHEN m.end_date IS NOT NULL THEN 
            (m.end_date - CURRENT_DATE)::INTEGER
        ELSE NULL
    END as days_until_expiration
FROM personal_training_schedules pts
JOIN user_profiles up ON pts.user_id = up.user_id
LEFT JOIN memberships m ON pts.user_id = m.user_id
LEFT JOIN membership_packages mp ON m.package_id = mp.id
LEFT JOIN group_assignments ga ON pts.id = ga.program_id
WHERE pts.training_type = 'group'
AND (mp.package_type = 'personal' OR mp.package_type IS NULL)
GROUP BY 
    pts.user_id, up.first_name, up.last_name, up.email,
    pts.id, pts.training_type, pts.group_room_size, pts.weekly_frequency,
    m.start_date, m.end_date, m.status
ORDER BY m.end_date ASC NULLS LAST;

-- ========================================
-- PHASE 6: TEST THE GROUP EXPIRATION SYSTEM
-- ========================================

SELECT 'PHASE 6: Testing the Group expiration system...' as phase;

-- Test the expire function (should not expire anything active)
DO $$
DECLARE
    test_result INTEGER;
BEGIN
    SELECT expire_group_assignments_with_subscriptions() INTO test_result;
    RAISE NOTICE 'Test Group expiration result: % expired assignments', test_result;
END $$;

-- Show current Group expiration status
SELECT 'Current Group subscription expiration status:' as info;
SELECT * FROM group_subscription_expiration_status LIMIT 10;

-- ========================================
-- PHASE 7: VERIFICATION
-- ========================================

SELECT 'PHASE 7: Verification of Group expiration system...' as phase;

-- Verify functions were created
SELECT 'Created Group expiration functions:' as info;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN (
    'expire_group_assignments_with_subscriptions',
    'expire_group_subscriptions_and_assignments',
    'check_and_expire_all_subscriptions'
)
ORDER BY routine_name;

-- Verify view was created
SELECT 'Created Group expiration view:' as info;
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_name = 'group_subscription_expiration_status';

-- Check for any Group subscriptions that might need attention
SELECT 'Group subscriptions summary:' as info;
SELECT 
    COUNT(*) as total_group_programs,
    COUNT(CASE WHEN expiration_status = 'ACTIVE' THEN 1 END) as active,
    COUNT(CASE WHEN expiration_status = 'EXPIRING SOON' THEN 1 END) as expiring_soon,
    COUNT(CASE WHEN expiration_status = 'EXPIRED' THEN 1 END) as expired
FROM group_subscription_expiration_status;

SELECT 'GROUP ASSIGNMENTS EXPIRATION SYSTEM EXTENDED!' as completion_status;
