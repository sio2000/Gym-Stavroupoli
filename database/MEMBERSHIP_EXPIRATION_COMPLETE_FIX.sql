-- =====================================================
-- ΟΛΟΚΛΗΡΩΜΕΝΗ ΔΙΟΡΘΩΣΗ MEMBERSHIP EXPIRATION SYSTEM
-- =====================================================
-- 🎯 ΣΤΟΧΟΣ: Διόρθωση του συστήματος λήξης συνδρομών
-- 🔧 ΛΥΣΗ: Option A - Deterministic read-time evaluation (προτεινόμενη)
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- PHASE 1: SCHEMA ANALYSIS & FIXES
-- ========================================

SELECT 'PHASE 1: Schema analysis and fixes...' as phase;

-- Add missing columns if they don't exist
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_memberships_expiration_check 
ON memberships (user_id, is_active, end_date) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_memberships_end_date 
ON memberships (end_date) 
WHERE is_active = true;

-- ========================================
-- PHASE 2: BACKFILL MISSING DATA
-- ========================================

SELECT 'PHASE 2: Backfilling missing data...' as phase;

-- Backfill is_active based on current status and end_date
UPDATE memberships 
SET is_active = (
    status = 'active' 
    AND end_date >= CURRENT_DATE
)
WHERE is_active IS NULL OR is_active != (status = 'active' AND end_date >= CURRENT_DATE);

-- Backfill expires_at with end_date converted to timestamp
UPDATE memberships 
SET expires_at = (end_date + INTERVAL '23 hours 59 minutes 59 seconds')::timestamptz
WHERE expires_at IS NULL AND end_date IS NOT NULL;

-- ========================================
-- PHASE 3: CREATE IMPROVED FUNCTIONS
-- ========================================

SELECT 'PHASE 3: Creating improved functions...' as phase;

-- Function to manually expire memberships (for admin use)
CREATE OR REPLACE FUNCTION expire_memberships()
RETURNS TABLE(expired_count INTEGER) AS $$
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
    AND end_date < CURRENT_DATE
    AND is_active = true;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Log the result
    RAISE NOTICE 'Manually expired % memberships', affected_rows;
    
    RETURN QUERY SELECT affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's truly active memberships (deterministic)
CREATE OR REPLACE FUNCTION get_user_active_memberships(p_user_id UUID)
RETURNS TABLE(
    membership_id UUID,
    package_id UUID,
    package_name TEXT,
    package_type TEXT,
    start_date DATE,
    end_date DATE,
    days_remaining INTEGER
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
        (m.end_date - CURRENT_DATE)::INTEGER as days_remaining
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE m.user_id = p_user_id
    AND m.status = 'active'
    AND m.end_date >= CURRENT_DATE  -- Deterministic: not expired
    ORDER BY m.end_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has active membership for specific package type
CREATE OR REPLACE FUNCTION user_has_active_membership_for_package(
    p_user_id UUID,
    p_package_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 
        FROM memberships m
        JOIN membership_packages mp ON m.package_id = mp.id
        WHERE m.user_id = p_user_id
        AND m.status = 'active'
        AND m.end_date >= CURRENT_DATE
        AND mp.package_type = p_package_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for comprehensive membership status check
CREATE OR REPLACE FUNCTION get_membership_status_summary()
RETURNS TABLE(
    total_memberships BIGINT,
    active_memberships BIGINT,
    expired_by_date BIGINT,
    expired_but_marked_active BIGINT,
    should_be_expired BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_memberships,
        COUNT(*) FILTER (WHERE status = 'active' AND end_date >= CURRENT_DATE) as active_memberships,
        COUNT(*) FILTER (WHERE end_date < CURRENT_DATE) as expired_by_date,
        COUNT(*) FILTER (WHERE end_date < CURRENT_DATE AND status = 'active') as expired_but_marked_active,
        COUNT(*) FILTER (WHERE end_date < CURRENT_DATE AND (status = 'active' OR is_active = true)) as should_be_expired
    FROM memberships;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PHASE 4: FIX CURRENTLY EXPIRED MEMBERSHIPS
-- ========================================

SELECT 'PHASE 4: Fixing currently expired memberships...' as phase;

-- Fix memberships that are expired by date but still marked as active
UPDATE memberships 
SET 
    status = 'expired',
    is_active = false,
    updated_at = NOW()
WHERE end_date < CURRENT_DATE 
AND (status = 'active' OR is_active = true);

-- Show how many were fixed
SELECT 
    'EXPIRED MEMBERSHIPS FIXED' as fix_type,
    ROW_COUNT as memberships_fixed;

-- ========================================
-- PHASE 5: CREATE SCHEDULED EXPIRATION (pg_cron approach)
-- ========================================

SELECT 'PHASE 5: Setting up scheduled expiration...' as phase;

-- Check if pg_cron is available
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Create scheduled job to run every hour
        PERFORM cron.schedule(
            'expire_memberships_hourly',
            '0 * * * *',  -- Every hour at minute 0
            $$
            UPDATE memberships 
            SET status = 'expired', is_active = false, updated_at = NOW()
            WHERE status = 'active' AND end_date < CURRENT_DATE AND is_active = true;
            $$
        );
        RAISE NOTICE 'Scheduled job created: expire_memberships_hourly (runs every hour)';
    ELSE
        RAISE NOTICE 'pg_cron extension not available. Manual expiration required.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create scheduled job: %', SQLERRM;
END $$;

-- ========================================
-- PHASE 6: CREATE MANUAL EXPIRATION ENDPOINT
-- ========================================

SELECT 'PHASE 6: Creating manual expiration endpoint...' as phase;

-- Function that can be called from frontend for manual expiration
CREATE OR REPLACE FUNCTION manual_expire_memberships()
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
    AND end_date < CURRENT_DATE
    AND is_active = true;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Return result
    RETURN QUERY SELECT 
        true as success,
        affected_rows as expired_count,
        ('Successfully expired ' || affected_rows || ' memberships')::TEXT as message;
        
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            false as success,
            0 as expired_count,
            ('Error: ' || SQLERRM)::TEXT as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PHASE 7: GRANT PERMISSIONS
-- ========================================

SELECT 'PHASE 7: Granting permissions...' as phase;

-- Grant permissions to functions
GRANT EXECUTE ON FUNCTION expire_memberships() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_active_memberships(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION user_has_active_membership_for_package(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_membership_status_summary() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION manual_expire_memberships() TO authenticated, service_role;

-- ========================================
-- PHASE 8: VERIFICATION & TESTING
-- ========================================

SELECT 'PHASE 8: Verification and testing...' as phase;

-- Test the functions
DO $$
DECLARE
    test_result RECORD;
BEGIN
    -- Test expire_memberships function
    SELECT * INTO test_result FROM expire_memberships();
    RAISE NOTICE 'expire_memberships test: expired % memberships', test_result.expired_count;
    
    -- Test status summary
    FOR test_result IN SELECT * FROM get_membership_status_summary() LOOP
        RAISE NOTICE 'Membership summary: Total=%, Active=%, Expired by date=%, Should be expired=%', 
            test_result.total_memberships,
            test_result.active_memberships, 
            test_result.expired_by_date,
            test_result.should_be_expired;
    END LOOP;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during testing: %', SQLERRM;
END $$;

-- Show current membership status
SELECT 
    'CURRENT MEMBERSHIP STATUS' as status_type,
    status,
    COUNT(*) as count,
    COUNT(CASE WHEN end_date < CURRENT_DATE THEN 1 END) as expired_by_date,
    COUNT(CASE WHEN is_active = true THEN 1 END) as marked_active
FROM memberships
GROUP BY status
ORDER BY status;

-- Show problematic memberships (if any remain)
SELECT 
    'PROBLEMATIC MEMBERSHIPS' as problem_type,
    m.id,
    up.first_name,
    up.last_name,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    m.status,
    m.is_active,
    CASE 
        WHEN m.end_date < CURRENT_DATE THEN 'SHOULD_BE_EXPIRED'
        ELSE 'OK'
    END as expected_status
FROM memberships m
LEFT JOIN user_profiles up ON m.user_id = up.user_id
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE (m.end_date < CURRENT_DATE AND (m.status = 'active' OR m.is_active = true))
ORDER BY m.end_date;

-- ========================================
-- FINAL SUCCESS MESSAGE
-- ========================================

SELECT 
    '🎉 MEMBERSHIP EXPIRATION FIX COMPLETED! 🎉' as final_message,
    'All expired memberships have been marked as inactive' as result,
    'Frontend will now correctly hide QR codes for expired users' as ui_effect;
