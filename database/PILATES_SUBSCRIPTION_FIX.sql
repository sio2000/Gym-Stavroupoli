-- =====================================================
-- PILATES SUBSCRIPTION COMPLETE FIX
-- =====================================================
-- PILATES-FIX: Deterministic subscription state management
-- 
-- PROBLEM: Database never auto-synchronized subscription state with end_date
-- SOLUTION: Deterministic functions that ALWAYS check end_date, not just status/is_active
--
-- This script:
-- 1. Creates functions that always validate end_date >= CURRENT_DATE
-- 2. Expires all currently overdue memberships and deposits
-- 3. Provides comprehensive Pilates subscription status checking
-- =====================================================

-- ========================================
-- PHASE 1: IMMEDIATELY FIX EXPIRED MEMBERSHIPS
-- ========================================

DO $$ 
DECLARE
    expired_memberships_count INTEGER;
    expired_deposits_count INTEGER;
BEGIN
    RAISE NOTICE 'PILATES-FIX: Starting immediate expiration of overdue records...';
    RAISE NOTICE 'PILATES-FIX: Current date is %', CURRENT_DATE;
    
    -- Fix memberships where end_date has passed but status is still 'active'
    UPDATE memberships 
    SET 
        status = 'expired',
        is_active = false,
        updated_at = NOW()
    WHERE status = 'active' 
    AND end_date < CURRENT_DATE;
    
    GET DIAGNOSTICS expired_memberships_count = ROW_COUNT;
    RAISE NOTICE 'PILATES-FIX: Expired % memberships with end_date in the past', expired_memberships_count;
    
    -- Fix pilates_deposits where expires_at has passed but is_active is still true
    UPDATE pilates_deposits 
    SET 
        is_active = false,
        updated_at = NOW()
    WHERE is_active = true 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_deposits_count = ROW_COUNT;
    RAISE NOTICE 'PILATES-FIX: Expired % pilates deposits with expires_at in the past', expired_deposits_count;
    
    RAISE NOTICE 'PILATES-FIX: Total expired: % memberships, % deposits', expired_memberships_count, expired_deposits_count;
END $$;

-- ========================================
-- PHASE 2: CREATE DETERMINISTIC PILATES FUNCTIONS
-- ========================================

-- Drop existing functions if they exist (to avoid conflicts)
DROP FUNCTION IF EXISTS get_pilates_subscription_status(UUID);
DROP FUNCTION IF EXISTS expire_pilates_subscriptions();
DROP FUNCTION IF EXISTS can_user_book_pilates_class(UUID);

-- Function: Get comprehensive Pilates subscription status
-- PILATES-FIX: ALWAYS checks end_date, never trusts status alone
CREATE OR REPLACE FUNCTION get_pilates_subscription_status(p_user_id UUID)
RETURNS TABLE(
    has_active_membership BOOLEAN,
    membership_id UUID,
    membership_end_date DATE,
    membership_days_remaining INTEGER,
    has_active_deposit BOOLEAN,
    deposit_id UUID,
    deposit_remaining INTEGER,
    deposit_expires_at TIMESTAMPTZ,
    can_book_pilates_class BOOLEAN,
    can_access_gym_via_pilates BOOLEAN,
    status_message TEXT
) AS $$
DECLARE
    v_membership RECORD;
    v_deposit RECORD;
    v_has_active_membership BOOLEAN := false;
    v_has_active_deposit BOOLEAN := false;
    v_can_book BOOLEAN := false;
    v_can_access BOOLEAN := false;
    v_message TEXT := '';
BEGIN
    -- PILATES-FIX: Get active Pilates/Ultimate membership with DETERMINISTIC date check
    SELECT 
        m.id,
        m.end_date,
        (m.end_date - CURRENT_DATE)::INTEGER as days_remaining,
        mp.name as package_name
    INTO v_membership
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE m.user_id = p_user_id
    AND m.status = 'active'
    AND m.end_date >= CURRENT_DATE  -- CRITICAL: Deterministic check
    AND m.deleted_at IS NULL
    AND (LOWER(mp.name) LIKE '%pilates%' OR LOWER(mp.name) LIKE '%ultimate%')
    ORDER BY m.end_date DESC
    LIMIT 1;
    
    IF FOUND THEN
        v_has_active_membership := true;
    END IF;
    
    -- PILATES-FIX: Get active deposit with DETERMINISTIC expiry check
    SELECT 
        d.id,
        d.deposit_remaining,
        d.expires_at
    INTO v_deposit
    FROM pilates_deposits d
    WHERE d.user_id = p_user_id
    AND d.is_active = true
    AND d.deposit_remaining > 0
    AND (d.expires_at IS NULL OR d.expires_at > NOW())  -- CRITICAL: Deterministic check
    ORDER BY d.credited_at DESC
    LIMIT 1;
    
    IF FOUND AND v_deposit.deposit_remaining > 0 THEN
        v_has_active_deposit := true;
    END IF;
    
    -- Determine booking and access eligibility
    v_can_book := v_has_active_membership AND v_has_active_deposit;
    v_can_access := v_has_active_membership AND v_has_active_deposit;
    
    -- Build status message
    IF NOT v_has_active_membership THEN
        v_message := 'Δεν υπάρχει ενεργή συνδρομή Pilates';
    ELSIF NOT v_has_active_deposit THEN
        v_message := 'Δεν υπάρχουν διαθέσιμα μαθήματα Pilates';
    ELSIF v_membership.days_remaining <= 3 THEN
        v_message := 'Η συνδρομή λήγει σε ' || v_membership.days_remaining || ' ημέρες! - ' || COALESCE(v_deposit.deposit_remaining, 0) || ' μαθήματα απομένουν';
    ELSIF v_membership.days_remaining <= 7 THEN
        v_message := 'Η συνδρομή λήγει σε ' || v_membership.days_remaining || ' ημέρες - ' || COALESCE(v_deposit.deposit_remaining, 0) || ' μαθήματα απομένουν';
    ELSE
        v_message := 'Ενεργή συνδρομή - ' || COALESCE(v_deposit.deposit_remaining, 0) || ' μαθήματα απομένουν';
    END IF;
    
    RETURN QUERY SELECT 
        v_has_active_membership,
        v_membership.id,
        v_membership.end_date,
        v_membership.days_remaining,
        v_has_active_deposit,
        v_deposit.id,
        v_deposit.deposit_remaining,
        v_deposit.expires_at,
        v_can_book,
        v_can_access,
        v_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Expire Pilates subscriptions (memberships + deposits)
-- PILATES-FIX: Run this periodically or on app load
CREATE OR REPLACE FUNCTION expire_pilates_subscriptions()
RETURNS TABLE(
    expired_memberships INTEGER,
    expired_deposits INTEGER,
    total_processed INTEGER
) AS $$
DECLARE
    v_expired_memberships INTEGER := 0;
    v_expired_deposits INTEGER := 0;
BEGIN
    -- Expire Pilates memberships where end_date has passed
    WITH expired AS (
        UPDATE memberships m
        SET 
            status = 'expired',
            is_active = false,
            updated_at = NOW()
        FROM membership_packages mp
        WHERE m.package_id = mp.id
        AND m.status = 'active'
        AND m.end_date < CURRENT_DATE
        AND (LOWER(mp.name) LIKE '%pilates%' OR LOWER(mp.name) LIKE '%ultimate%')
        RETURNING m.id
    )
    SELECT COUNT(*) INTO v_expired_memberships FROM expired;
    
    -- Expire pilates deposits where expires_at has passed
    WITH expired AS (
        UPDATE pilates_deposits
        SET 
            is_active = false,
            updated_at = NOW()
        WHERE is_active = true
        AND expires_at IS NOT NULL
        AND expires_at < NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO v_expired_deposits FROM expired;
    
    RETURN QUERY SELECT v_expired_memberships, v_expired_deposits, v_expired_memberships + v_expired_deposits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user can book a Pilates class
-- PILATES-FIX: Used for pre-validation before booking
CREATE OR REPLACE FUNCTION can_user_book_pilates_class(p_user_id UUID)
RETURNS TABLE(
    can_book BOOLEAN,
    reason TEXT
) AS $$
DECLARE
    v_status RECORD;
BEGIN
    SELECT * INTO v_status FROM get_pilates_subscription_status(p_user_id);
    
    IF NOT v_status.has_active_membership THEN
        RETURN QUERY SELECT false, 'Δεν υπάρχει ενεργή συνδρομή Pilates'::TEXT;
    ELSIF NOT v_status.has_active_deposit THEN
        RETURN QUERY SELECT false, 'Δεν υπάρχουν διαθέσιμα μαθήματα'::TEXT;
    ELSIF v_status.deposit_remaining <= 0 THEN
        RETURN QUERY SELECT false, 'Τα μαθήματά σας τελείωσαν'::TEXT;
    ELSE
        RETURN QUERY SELECT true, v_status.status_message;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PHASE 3: UPDATE EXISTING FUNCTIONS
-- ========================================

-- Update manual_expire_overdue_memberships to be more comprehensive
CREATE OR REPLACE FUNCTION manual_expire_overdue_memberships()
RETURNS TABLE(
    success BOOLEAN,
    expired_count INTEGER,
    message TEXT
) AS $$
DECLARE
    v_expired_memberships INTEGER := 0;
    v_expired_deposits INTEGER := 0;
BEGIN
    -- Expire all memberships where end_date < CURRENT_DATE
    UPDATE memberships 
    SET 
        status = 'expired',
        is_active = false,
        updated_at = NOW()
    WHERE status = 'active' 
    AND end_date < CURRENT_DATE;
    
    GET DIAGNOSTICS v_expired_memberships = ROW_COUNT;
    
    -- Expire all deposits where expires_at < NOW()
    UPDATE pilates_deposits 
    SET 
        is_active = false,
        updated_at = NOW()
    WHERE is_active = true 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS v_expired_deposits = ROW_COUNT;
    
    RETURN QUERY SELECT 
        true,
        v_expired_memberships + v_expired_deposits,
        ('Έληξαν ' || v_expired_memberships || ' συνδρομές και ' || v_expired_deposits || ' deposits')::TEXT;
        
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            false,
            0,
            ('Σφάλμα: ' || SQLERRM)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_user_active_memberships_deterministic
CREATE OR REPLACE FUNCTION get_user_active_memberships_deterministic(p_user_id UUID)
RETURNS TABLE(
    membership_id UUID,
    package_id UUID,
    package_name TEXT,
    package_type TEXT,
    start_date DATE,
    end_date DATE,
    days_remaining INTEGER,
    status TEXT,
    is_pilates BOOLEAN,
    is_ultimate BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as membership_id,
        m.package_id,
        mp.name::TEXT as package_name,
        mp.package_type::TEXT,
        m.start_date,
        m.end_date,
        (m.end_date - CURRENT_DATE)::INTEGER as days_remaining,
        m.status::TEXT,
        (LOWER(mp.name) LIKE '%pilates%')::BOOLEAN as is_pilates,
        (LOWER(mp.name) LIKE '%ultimate%')::BOOLEAN as is_ultimate
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE m.user_id = p_user_id
    AND m.status = 'active'
    AND m.end_date >= CURRENT_DATE  -- DETERMINISTIC: end_date check
    AND m.deleted_at IS NULL
    ORDER BY m.end_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user_has_qr_access to be deterministic
CREATE OR REPLACE FUNCTION user_has_qr_access(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- PILATES-FIX: Deterministic check - MUST have valid membership with end_date >= today
    RETURN EXISTS(
        SELECT 1
        FROM memberships m
        WHERE m.user_id = p_user_id
        AND m.status = 'active'
        AND m.end_date >= CURRENT_DATE  -- DETERMINISTIC
        AND m.deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PHASE 4: CREATE DIAGNOSTIC VIEW
-- ========================================

-- View to identify anomalies (memberships marked active but expired by date)
CREATE OR REPLACE VIEW pilates_subscription_anomalies AS
SELECT 
    'MEMBERSHIP' as record_type,
    m.id,
    m.user_id,
    up.first_name,
    up.last_name,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    m.status,
    m.is_active,
    CASE 
        WHEN m.end_date < CURRENT_DATE THEN 'EXPIRED_BY_DATE'
        ELSE 'OK'
    END as actual_state,
    CASE 
        WHEN m.status = 'active' AND m.end_date < CURRENT_DATE THEN 'ANOMALY: status=active but expired'
        WHEN m.is_active = true AND m.end_date < CURRENT_DATE THEN 'ANOMALY: is_active=true but expired'
        ELSE 'OK'
    END as anomaly_description
FROM memberships m
LEFT JOIN user_profiles up ON m.user_id = up.user_id
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE (LOWER(mp.name) LIKE '%pilates%' OR LOWER(mp.name) LIKE '%ultimate%')
AND (
    (m.status = 'active' AND m.end_date < CURRENT_DATE)
    OR (m.is_active = true AND m.end_date < CURRENT_DATE)
)

UNION ALL

SELECT 
    'DEPOSIT' as record_type,
    d.id,
    d.user_id,
    up.first_name,
    up.last_name,
    'Pilates Deposit' as package_name,
    d.credited_at::DATE as start_date,
    d.expires_at::DATE as end_date,
    CASE WHEN d.is_active THEN 'active' ELSE 'inactive' END as status,
    d.is_active,
    CASE 
        WHEN d.expires_at IS NOT NULL AND d.expires_at < NOW() THEN 'EXPIRED_BY_DATE'
        ELSE 'OK'
    END as actual_state,
    CASE 
        WHEN d.is_active = true AND d.expires_at IS NOT NULL AND d.expires_at < NOW() THEN 'ANOMALY: is_active=true but expired'
        ELSE 'OK'
    END as anomaly_description
FROM pilates_deposits d
LEFT JOIN user_profiles up ON d.user_id = up.user_id
WHERE d.is_active = true 
AND d.expires_at IS NOT NULL 
AND d.expires_at < NOW();

-- ========================================
-- PHASE 5: GRANT PERMISSIONS
-- ========================================

GRANT EXECUTE ON FUNCTION get_pilates_subscription_status(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION expire_pilates_subscriptions() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION can_user_book_pilates_class(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION manual_expire_overdue_memberships() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_active_memberships_deterministic(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION user_has_qr_access(UUID) TO authenticated, service_role;
GRANT SELECT ON pilates_subscription_anomalies TO authenticated, service_role;

-- ========================================
-- PHASE 6: VERIFICATION
-- ========================================

DO $$
DECLARE
    anomaly_count INTEGER;
BEGIN
    -- Count remaining anomalies
    SELECT COUNT(*) INTO anomaly_count FROM pilates_subscription_anomalies;
    
    IF anomaly_count > 0 THEN
        RAISE WARNING 'PILATES-FIX: Found % anomalies that need manual review', anomaly_count;
    ELSE
        RAISE NOTICE 'PILATES-FIX: No anomalies found - all subscriptions are correctly synchronized';
    END IF;
END $$;

-- Show final status
SELECT 
    'PILATES-FIX COMPLETE' as status,
    (SELECT COUNT(*) FROM memberships WHERE status = 'active' AND end_date >= CURRENT_DATE) as active_memberships,
    (SELECT COUNT(*) FROM pilates_deposits WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())) as active_deposits,
    (SELECT COUNT(*) FROM pilates_subscription_anomalies) as remaining_anomalies;
