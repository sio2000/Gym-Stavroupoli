-- ============================================================================
-- AUTOMATIC EXPIRATION FIX
-- ============================================================================
-- Δημιουργεί trigger που αυτόματα deactivate τις ληξιπρόθεσμες συνδρομές
-- και function που ενημερώνει όλες τις ληξιπρόθεσμες συνδρομές
-- Date: 2026-01-31
-- ============================================================================

-- ============================================================================
-- PHASE 1: FIX ALL EXISTING EXPIRED MEMBERSHIPS
-- ============================================================================
SELECT 'PHASE 1: Fixing all existing expired memberships...' as phase;

-- Find all memberships that should be expired
SELECT 
    COUNT(*) as expired_count,
    'Memberships with expired end_date but still active' as description
FROM memberships
WHERE (is_active = true OR status = 'active')
  AND end_date < CURRENT_DATE;

-- Fix them all at once
UPDATE memberships
SET 
    is_active = false,
    status = 'expired',
    updated_at = NOW()
WHERE (is_active = true OR status = 'active')
  AND end_date < CURRENT_DATE;

SELECT 'PHASE 1 Complete: Fixed' || (SELECT COUNT(*) FROM memberships WHERE status = 'expired') || 'expired memberships' as result;

-- ============================================================================
-- PHASE 2: CREATE IMMUTABLE FUNCTION TO GET ACTIVE MEMBERSHIPS
-- ============================================================================
SELECT 'PHASE 2: Creating immutable function for active memberships...' as phase;

CREATE OR REPLACE FUNCTION get_user_active_memberships_v2(p_user_id UUID)
RETURNS TABLE (
    membership_id UUID,
    package_id UUID,
    package_name TEXT,
    package_type TEXT,
    status TEXT,
    is_active BOOLEAN,
    start_date DATE,
    end_date DATE,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id::UUID,
        m.package_id::UUID,
        mp.name::TEXT,
        mp.package_type::TEXT,
        m.status::TEXT,
        m.is_active::BOOLEAN,
        m.start_date::DATE,
        m.end_date::DATE,
        (m.end_date - CURRENT_DATE)::INTEGER
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE m.user_id = p_user_id
      AND m.deleted_at IS NULL
      -- CRITICAL: Check BOTH status AND end_date
      AND m.status = 'active'
      AND m.is_active = true
      AND m.end_date >= CURRENT_DATE  -- This is the KEY guard
    ORDER BY m.end_date DESC;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_user_active_memberships_v2(UUID) IS 
'Get user active memberships with MANDATORY end_date check. Always returns only truly active memberships.';

-- ============================================================================
-- PHASE 3: CREATE TRIGGER FOR AUTOMATIC EXPIRATION
-- ============================================================================
SELECT 'PHASE 3: Creating automatic expiration trigger...' as phase;

CREATE OR REPLACE FUNCTION membership_auto_expire_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- If end_date is being set to past, mark as expired
    IF NEW.end_date < CURRENT_DATE THEN
        NEW.is_active = false;
        NEW.status = 'expired';
    END IF;
    
    -- If end_date was already in past and is_active/status is being changed, enforce expiration
    IF NEW.end_date < CURRENT_DATE AND (NEW.is_active = true OR NEW.status = 'active') THEN
        RAISE WARNING 'Attempt to activate expired membership (ID: %s, end_date: %s). Forcing expired status.', NEW.id, NEW.end_date;
        NEW.is_active = false;
        NEW.status = 'expired';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS membership_auto_expire_trigger_trg ON memberships;

-- Create the trigger
CREATE TRIGGER membership_auto_expire_trigger_trg
BEFORE INSERT OR UPDATE ON memberships
FOR EACH ROW
EXECUTE FUNCTION membership_auto_expire_trigger();

COMMENT ON TRIGGER membership_auto_expire_trigger_trg ON memberships IS 
'Automatically sets is_active=false and status=expired when end_date is in the past. Prevents expired memberships from being marked as active.';

-- ============================================================================
-- PHASE 4: CREATE NIGHTLY EXPIRATION CHECK FUNCTION
-- ============================================================================
SELECT 'PHASE 4: Creating nightly expiration check function...' as phase;

CREATE OR REPLACE FUNCTION daily_expire_memberships()
RETURNS TABLE (
    expired_count BIGINT,
    message TEXT
) AS $$
DECLARE
    v_expired_count BIGINT;
BEGIN
    -- Update all memberships that have passed their end_date
    UPDATE memberships
    SET 
        is_active = false,
        status = 'expired',
        updated_at = NOW()
    WHERE (is_active = true OR status = 'active')
      AND end_date < CURRENT_DATE
      AND (is_active = true OR status != 'expired');
    
    GET DIAGNOSTICS v_expired_count = ROW_COUNT;
    
    RETURN QUERY
    SELECT 
        v_expired_count,
        'Expired ' || v_expired_count || ' memberships on ' || NOW()::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION daily_expire_memberships() IS 
'Run daily to automatically expire all memberships with end_date < today. Should be scheduled as a cron job.';

-- ============================================================================
-- PHASE 5: CREATE FUNCTION TO VALIDATE MEMBERSHIP STATUS
-- ============================================================================
SELECT 'PHASE 5: Creating membership validation function...' as phase;

CREATE OR REPLACE FUNCTION validate_membership_status()
RETURNS TABLE (
    problematic_count BIGINT,
    issues TEXT[]
) AS $$
DECLARE
    v_issues TEXT[] := ARRAY[]::TEXT[];
    v_count BIGINT := 0;
BEGIN
    -- Check 1: Memberships with is_active=true but end_date in past
    SELECT COUNT(*) INTO v_count
    FROM memberships
    WHERE is_active = true AND end_date < CURRENT_DATE;
    
    IF v_count > 0 THEN
        v_issues := array_append(v_issues, v_count::TEXT || ' memberships have is_active=true but expired end_date');
    END IF;
    
    -- Check 2: Memberships with status='active' but end_date in past
    SELECT COUNT(*) INTO v_count
    FROM memberships
    WHERE status = 'active' AND end_date < CURRENT_DATE;
    
    IF v_count > 0 THEN
        v_issues := array_append(v_issues, v_count::TEXT || ' memberships have status=active but expired end_date');
    END IF;
    
    -- Check 3: Memberships with is_active != status check
    SELECT COUNT(*) INTO v_count
    FROM memberships
    WHERE (is_active = true AND status != 'active')
       OR (is_active = false AND status = 'active');
    
    IF v_count > 0 THEN
        v_issues := array_append(v_issues, v_count::TEXT || ' memberships have inconsistent is_active/status fields');
    END IF;
    
    RETURN QUERY
    SELECT 
        COALESCE((SELECT COUNT(*) FROM memberships WHERE is_active != (status = 'active')), 0),
        v_issues;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_membership_status() IS 
'Check for data consistency issues. Run this to audit memberships.';

-- ============================================================================
-- PHASE 6: VERIFICATION
-- ============================================================================
SELECT 'PHASE 6: Verification...' as phase;

-- Test the function
SELECT * FROM get_user_active_memberships_v2('00000000-0000-0000-0000-000000000000'::UUID) LIMIT 1;

-- Check for any remaining issues
SELECT * FROM validate_membership_status();

-- ============================================================================
-- PHASE 7: SUCCESS MESSAGE
-- ============================================================================
SELECT 
    '✅ AUTOMATIC EXPIRATION SYSTEM INSTALLED' as status,
    'Trigger will prevent expired memberships from being marked as active' as feature1,
    'New function get_user_active_memberships_v2() with mandatory end_date check' as feature2,
    'Daily function daily_expire_memberships() for cleanup (needs cron scheduling)' as feature3,
    'Validation function validate_membership_status() for auditing' as feature4;
