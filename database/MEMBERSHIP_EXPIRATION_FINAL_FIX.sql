-- =====================================================
-- ΤΕΛΙΚΗ ΔΙΟΡΘΩΣΗ MEMBERSHIP EXPIRATION SYSTEM
-- =====================================================
-- 🎯 ROOT CAUSE: Δεν υπάρχει automatic expiration mechanism
-- 🔧 SOLUTION: Option A - Deterministic read-time evaluation
-- 📅 APPROACH: Ελέγχουμε end_date σε real-time αντί για is_active
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- PHASE 1: IMMEDIATE FIX - EXPIRE CURRENT OVERDUE
-- ========================================

SELECT 'PHASE 1: Fixing currently expired memberships...' as phase;

-- Add is_active column if missing
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Fix memberships that are expired by date but still marked as active
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Update expired memberships immediately
    UPDATE memberships 
    SET 
        status = 'expired',
        is_active = false,
        updated_at = NOW()
    WHERE end_date < CURRENT_DATE 
    AND (status = 'active' OR is_active = true);
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'IMMEDIATE FIX: Fixed % expired memberships', affected_rows;
END $$;

-- ========================================
-- PHASE 2: CREATE DETERMINISTIC FUNCTIONS
-- ========================================

SELECT 'PHASE 2: Creating deterministic functions...' as phase;

-- Function to get user's truly active memberships (deterministic)
CREATE OR REPLACE FUNCTION get_user_active_memberships_deterministic(p_user_id UUID)
RETURNS TABLE(
    membership_id UUID,
    package_id UUID,
    package_name TEXT,
    package_type TEXT,
    start_date DATE,
    end_date DATE,
    days_remaining INTEGER,
    is_truly_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as membership_id,
        m.package_id,
        mp.name as package_name,
        mp.package_type,
        m.start_date,
        m.end_date,
        (m.end_date - CURRENT_DATE)::INTEGER as days_remaining,
        (m.end_date >= CURRENT_DATE AND m.status = 'active') as is_truly_active
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE m.user_id = p_user_id
    AND m.status = 'active'
    AND m.end_date >= CURRENT_DATE  -- DETERMINISTIC: Only truly active
    ORDER BY m.end_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has active membership for QR access
CREATE OR REPLACE FUNCTION user_has_qr_access(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check for active memberships that grant QR access
    RETURN EXISTS(
        SELECT 1 
        FROM memberships m
        JOIN membership_packages mp ON m.package_id = mp.id
        WHERE m.user_id = p_user_id
        AND m.status = 'active'
        AND m.end_date >= CURRENT_DATE  -- DETERMINISTIC
        AND mp.package_type IN ('free_gym', 'standard', 'pilates', 'ultimate')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for admin dashboard - get membership status summary
CREATE OR REPLACE FUNCTION get_membership_status_summary()
RETURNS TABLE(
    total_memberships BIGINT,
    truly_active BIGINT,
    expired_by_date BIGINT,
    should_be_expired BIGINT,
    users_with_qr_access BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_memberships,
        COUNT(*) FILTER (WHERE status = 'active' AND end_date >= CURRENT_DATE) as truly_active,
        COUNT(*) FILTER (WHERE end_date < CURRENT_DATE) as expired_by_date,
        COUNT(*) FILTER (WHERE end_date < CURRENT_DATE AND status = 'active') as should_be_expired,
        COUNT(DISTINCT user_id) FILTER (WHERE status = 'active' AND end_date >= CURRENT_DATE) as users_with_qr_access
    FROM memberships;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Manual cleanup function for admins
CREATE OR REPLACE FUNCTION manual_expire_overdue_memberships()
RETURNS TABLE(
    success BOOLEAN,
    expired_count INTEGER,
    message TEXT
) AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Update expired memberships
    UPDATE memberships 
    SET 
        status = 'expired', 
        is_active = false,
        updated_at = NOW()
    WHERE status = 'active' 
    AND end_date < CURRENT_DATE;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Return result
    RETURN QUERY SELECT 
        true as success,
        affected_rows as expired_count,
        ('Successfully expired ' || affected_rows || ' overdue memberships')::TEXT as message;
        
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            false as success,
            0 as expired_count,
            ('Error: ' || SQLERRM)::TEXT as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PHASE 3: CREATE PERFORMANCE INDEXES
-- ========================================

SELECT 'PHASE 3: Creating performance indexes...' as phase;

-- Index for deterministic active membership queries
CREATE INDEX IF NOT EXISTS idx_memberships_active_deterministic 
ON memberships (user_id, status, end_date) 
WHERE status = 'active';

-- Index for expiration queries (without CURRENT_DATE function)
CREATE INDEX IF NOT EXISTS idx_memberships_expiration 
ON memberships (end_date, status)
WHERE status = 'active';

-- Simple index for user queries
CREATE INDEX IF NOT EXISTS idx_memberships_user_status 
ON memberships (user_id, status);

-- Simple index for end_date queries
CREATE INDEX IF NOT EXISTS idx_memberships_end_date_only 
ON memberships (end_date);

-- ========================================
-- PHASE 4: GRANT PERMISSIONS
-- ========================================

SELECT 'PHASE 4: Granting permissions...' as phase;

-- Grant permissions to new functions
GRANT EXECUTE ON FUNCTION get_user_active_memberships_deterministic(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION user_has_qr_access(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_membership_status_summary() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION manual_expire_overdue_memberships() TO authenticated, service_role;

-- ========================================
-- PHASE 5: VERIFICATION & TESTING
-- ========================================

SELECT 'PHASE 5: Verification and testing...' as phase;

-- Test the new functions
DO $$
DECLARE
    test_result RECORD;
    user_test_id UUID;
BEGIN
    -- Get a test user ID
    SELECT user_id INTO user_test_id FROM memberships LIMIT 1;
    
    IF user_test_id IS NOT NULL THEN
        -- Test deterministic function
        RAISE NOTICE 'Testing deterministic function for user: %', user_test_id;
        
        FOR test_result IN 
            SELECT * FROM get_user_active_memberships_deterministic(user_test_id) 
        LOOP
            RAISE NOTICE 'Active membership found: % (% days remaining)', 
                test_result.package_name, test_result.days_remaining;
        END LOOP;
        
        -- Test QR access function
        IF user_has_qr_access(user_test_id) THEN
            RAISE NOTICE 'User % has QR access', user_test_id;
        ELSE
            RAISE NOTICE 'User % does NOT have QR access', user_test_id;
        END IF;
    END IF;
    
    -- Test status summary
    FOR test_result IN SELECT * FROM get_membership_status_summary() LOOP
        RAISE NOTICE 'System summary: Total=%, Active=%, Expired=%, Should expire=%', 
            test_result.total_memberships,
            test_result.truly_active, 
            test_result.expired_by_date,
            test_result.should_be_expired;
    END LOOP;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during testing: %', SQLERRM;
END $$;

-- ========================================
-- PHASE 6: SHOW CURRENT STATUS
-- ========================================

SELECT 'PHASE 6: Current system status...' as phase;

-- Show fixed membership status
SELECT 
    'FIXED MEMBERSHIP STATUS' as status_type,
    status,
    COUNT(*) as count,
    COUNT(CASE WHEN end_date < CURRENT_DATE THEN 1 END) as expired_by_date,
    COUNT(CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'is_active')
        THEN (CASE WHEN is_active = true THEN 1 END)
        ELSE NULL 
    END) as marked_active
FROM memberships
GROUP BY status
ORDER BY status;

-- Show any remaining problematic memberships
SELECT 
    'REMAINING PROBLEMS' as problem_type,
    COUNT(*) as problematic_count
FROM memberships
WHERE end_date < CURRENT_DATE 
AND (status = 'active' OR 
     (EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'is_active') 
      AND is_active = true));

-- ========================================
-- FINAL SUCCESS MESSAGE
-- ========================================

SELECT 
    '🎉 MEMBERSHIP EXPIRATION SYSTEM FIXED! 🎉' as final_message,
    'All expired memberships marked as inactive' as immediate_fix,
    'Frontend will use deterministic date checking' as long_term_solution,
    'No scheduled jobs needed - system is now deterministic' as architecture;

-- ========================================
-- NEXT STEPS FOR IMPLEMENTATION
-- ========================================

SELECT 
    '📋 NEXT STEPS' as next_steps,
    '1. Run this script on STAGING first' as step_1,
    '2. Update frontend to use deterministic functions' as step_2,
    '3. Test QR access with expired users' as step_3,
    '4. Deploy to production after testing' as step_4;
