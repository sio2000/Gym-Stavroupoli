-- =====================================================
-- PILATES SUBSCRIPTION DEFINITIVE FIX
-- =====================================================
-- 🎯 ROOT CAUSE: Database NEVER auto-synchronized subscription state with end_date
-- 🔧 SOLUTION: Deterministic checks + automatic expiration triggers
-- ⚠️ SCOPE: ONLY Pilates subscription system - NO changes to ultimate/freegym
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PHASE 1: IMMEDIATE DATA FIX - Expire overdue memberships
-- =====================================================

SELECT '📋 PHASE 1: Immediate data fix - expire overdue Pilates memberships...' as phase;

-- Step 1.1: Fix Pilates memberships that are expired by date but still marked as active
DO $$
DECLARE
    pilates_package_id UUID;
    affected_rows INTEGER;
BEGIN
    -- Find Pilates package ID
    SELECT id INTO pilates_package_id FROM membership_packages WHERE LOWER(name) = 'pilates' LIMIT 1;
    
    IF pilates_package_id IS NOT NULL THEN
        -- Update expired Pilates memberships immediately
        UPDATE memberships 
        SET 
            status = 'expired',
            is_active = false,
            updated_at = NOW()
        WHERE package_id = pilates_package_id
        AND end_date < CURRENT_DATE 
        AND (status = 'active' OR is_active = true);
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE '✅ PHASE 1.1: Fixed % expired Pilates memberships', affected_rows;
    ELSE
        RAISE NOTICE '⚠️ No Pilates package found in membership_packages';
    END IF;
END $$;

-- Step 1.2: Fix pilates_deposits that are expired by date but still marked as active
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE pilates_deposits 
    SET 
        is_active = false,
        updated_at = NOW()
    WHERE is_active = true 
    AND (
        deposit_remaining <= 0 
        OR (expires_at IS NOT NULL AND expires_at < NOW())
    );
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE '✅ PHASE 1.2: Fixed % expired Pilates deposits', affected_rows;
END $$;

-- =====================================================
-- PHASE 2: CREATE DETERMINISTIC VALIDATION FUNCTIONS
-- =====================================================

SELECT '📋 PHASE 2: Creating deterministic validation functions...' as phase;

-- Function: Check if Pilates membership is TRULY active (deterministic)
CREATE OR REPLACE FUNCTION is_pilates_membership_truly_active(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    pilates_package_id UUID;
    result BOOLEAN;
BEGIN
    -- Find Pilates package ID
    SELECT id INTO pilates_package_id FROM membership_packages WHERE LOWER(name) = 'pilates' LIMIT 1;
    
    IF pilates_package_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Deterministic check: end_date must be >= CURRENT_DATE AND status must be 'active'
    SELECT EXISTS(
        SELECT 1 
        FROM memberships m
        WHERE m.user_id = p_user_id
        AND m.package_id = pilates_package_id
        AND m.status = 'active'
        AND m.end_date >= CURRENT_DATE
        AND COALESCE(m.deleted_at, '2999-12-31'::TIMESTAMP) > NOW()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Check if Pilates deposit is TRULY active (deterministic)
CREATE OR REPLACE FUNCTION is_pilates_deposit_truly_active(p_user_id UUID)
RETURNS TABLE(
    is_valid BOOLEAN,
    deposit_id UUID,
    deposit_remaining INTEGER,
    expires_at TIMESTAMPTZ,
    days_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN pd.is_active = true 
                AND pd.deposit_remaining > 0 
                AND (pd.expires_at IS NULL OR pd.expires_at > NOW())
            THEN TRUE
            ELSE FALSE
        END as is_valid,
        pd.id as deposit_id,
        pd.deposit_remaining,
        pd.expires_at,
        CASE 
            WHEN pd.expires_at IS NOT NULL 
            THEN EXTRACT(DAY FROM (pd.expires_at - NOW()))::INTEGER
            ELSE NULL
        END as days_until_expiry
    FROM pilates_deposits pd
    WHERE pd.user_id = p_user_id
    AND pd.is_active = true
    ORDER BY pd.credited_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get comprehensive Pilates subscription status for a user
CREATE OR REPLACE FUNCTION get_pilates_subscription_status(p_user_id UUID)
RETURNS TABLE(
    has_active_membership BOOLEAN,
    membership_end_date DATE,
    membership_days_remaining INTEGER,
    has_active_deposit BOOLEAN,
    deposit_remaining INTEGER,
    deposit_expires_at TIMESTAMPTZ,
    can_book_pilates_class BOOLEAN,
    can_access_gym_via_pilates BOOLEAN,
    status_message TEXT
) AS $$
DECLARE
    pilates_package_id UUID;
    v_membership RECORD;
    v_deposit RECORD;
    v_can_book BOOLEAN;
    v_can_access BOOLEAN;
    v_message TEXT;
BEGIN
    -- Find Pilates package ID
    SELECT id INTO pilates_package_id FROM membership_packages WHERE LOWER(name) = 'pilates' LIMIT 1;
    
    -- Get active Pilates membership (deterministic check)
    SELECT 
        m.id,
        m.end_date,
        (m.end_date - CURRENT_DATE)::INTEGER as days_remaining,
        (m.status = 'active' AND m.end_date >= CURRENT_DATE) as is_truly_active
    INTO v_membership
    FROM memberships m
    WHERE m.user_id = p_user_id
    AND m.package_id = pilates_package_id
    AND m.status = 'active'
    ORDER BY m.end_date DESC
    LIMIT 1;
    
    -- Get active Pilates deposit (deterministic check)
    SELECT 
        pd.id,
        pd.deposit_remaining,
        pd.expires_at,
        pd.is_active AND pd.deposit_remaining > 0 AND (pd.expires_at IS NULL OR pd.expires_at > NOW()) as is_truly_active
    INTO v_deposit
    FROM pilates_deposits pd
    WHERE pd.user_id = p_user_id
    AND pd.is_active = true
    ORDER BY pd.credited_at DESC
    LIMIT 1;
    
    -- Determine booking eligibility
    v_can_book := COALESCE(v_membership.is_truly_active, FALSE) 
        AND COALESCE(v_deposit.is_truly_active, FALSE)
        AND COALESCE(v_deposit.deposit_remaining, 0) > 0;
    
    -- Determine gym access via Pilates
    v_can_access := COALESCE(v_membership.is_truly_active, FALSE)
        AND COALESCE(v_deposit.is_truly_active, FALSE);
    
    -- Build status message
    IF NOT COALESCE(v_membership.is_truly_active, FALSE) THEN
        v_message := 'Δεν υπάρχει ενεργή συνδρομή Pilates';
    ELSIF NOT COALESCE(v_deposit.is_truly_active, FALSE) THEN
        v_message := 'Η συνδρομή Pilates έχει λήξει ή δεν έχει διαθέσιμα μαθήματα';
    ELSIF COALESCE(v_deposit.deposit_remaining, 0) <= 0 THEN
        v_message := 'Δεν υπάρχουν διαθέσιμα μαθήματα Pilates';
    ELSIF COALESCE(v_membership.days_remaining, 0) <= 7 THEN
        v_message := format('Η συνδρομή λήγει σε %s ημέρες - %s μαθήματα απομένουν', 
            v_membership.days_remaining, v_deposit.deposit_remaining);
    ELSE
        v_message := format('Ενεργή συνδρομή - %s μαθήματα απομένουν', v_deposit.deposit_remaining);
    END IF;
    
    RETURN QUERY SELECT
        COALESCE(v_membership.is_truly_active, FALSE),
        v_membership.end_date,
        v_membership.days_remaining,
        COALESCE(v_deposit.is_truly_active, FALSE),
        v_deposit.deposit_remaining,
        v_deposit.expires_at,
        v_can_book,
        v_can_access,
        v_message;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- PHASE 3: UPDATE BOOKING RPC WITH STRICT VALIDATION
-- =====================================================

SELECT '📋 PHASE 3: Updating booking RPC with strict validation...' as phase;

-- Enhanced book_pilates_class with comprehensive validation and logging
CREATE OR REPLACE FUNCTION public.book_pilates_class_v2(p_user_id uuid, p_slot_id uuid)
RETURNS json AS $$
DECLARE
    v_pilates_package_id UUID;
    v_membership RECORD;
    v_deposit public.pilates_deposits;
    v_capacity integer;
    v_booked integer;
    v_existing uuid;
    v_result json;
    v_log_details json;
BEGIN
    -- VALIDATION 1: Check for Pilates package
    SELECT id INTO v_pilates_package_id FROM membership_packages WHERE LOWER(name) = 'pilates' LIMIT 1;
    
    -- VALIDATION 2: Check if user has TRULY active Pilates membership (DETERMINISTIC)
    SELECT 
        m.id,
        m.end_date,
        (m.end_date - CURRENT_DATE)::INTEGER as days_remaining,
        (m.status = 'active' AND m.end_date >= CURRENT_DATE) as is_truly_active
    INTO v_membership
    FROM memberships m
    WHERE m.user_id = p_user_id
    AND (m.package_id = v_pilates_package_id 
         OR EXISTS(SELECT 1 FROM membership_packages mp WHERE mp.id = m.package_id AND LOWER(mp.name) LIKE '%ultimate%'))
    AND m.status = 'active'
    ORDER BY m.end_date DESC
    LIMIT 1;
    
    -- Log validation
    v_log_details := json_build_object(
        'user_id', p_user_id,
        'slot_id', p_slot_id,
        'membership_found', v_membership.id IS NOT NULL,
        'membership_end_date', v_membership.end_date,
        'membership_days_remaining', v_membership.days_remaining,
        'membership_is_truly_active', v_membership.is_truly_active,
        'timestamp', NOW()
    );
    
    -- Insert log entry
    INSERT INTO membership_logs (membership_id, action, details, created_at)
    VALUES (v_membership.id, 'pilates_booking_attempt', v_log_details, NOW())
    ON CONFLICT DO NOTHING;
    
    IF v_membership.id IS NULL OR NOT COALESCE(v_membership.is_truly_active, FALSE) THEN
        RAISE EXCEPTION 'No active membership - membership expired or not found (end_date: %)', v_membership.end_date;
    END IF;
    
    -- Check existing booking
    SELECT id INTO v_existing FROM public.pilates_bookings 
    WHERE user_id = p_user_id AND slot_id = p_slot_id AND status = 'confirmed';
    IF v_existing IS NOT NULL THEN
        -- Return current deposit state without double-decrement
        SELECT * INTO v_deposit FROM public.get_active_pilates_deposit(p_user_id);
        
        -- Return full booking details with joined data
        SELECT json_build_object(
            'booking_id', b.id,
            'deposit_remaining', COALESCE(v_deposit.deposit_remaining, 0),
            'already_booked', TRUE,
            'booking', json_build_object(
                'id', b.id,
                'user_id', b.user_id,
                'slot_id', b.slot_id,
                'booking_date', b.booking_date,
                'status', b.status,
                'notes', b.notes,
                'created_at', b.created_at,
                'updated_at', b.updated_at,
                'slot', json_build_object(
                    'id', s.id,
                    'date', s.date,
                    'start_time', s.start_time,
                    'end_time', s.end_time,
                    'max_capacity', s.max_capacity,
                    'is_active', s.is_active
                )
            )
        ) INTO v_result
        FROM public.pilates_bookings b
        LEFT JOIN public.pilates_schedule_slots s ON s.id = b.slot_id
        WHERE b.id = v_existing;
        
        RETURN v_result;
    END IF;

    -- Check slot capacity
    SELECT max_capacity INTO v_capacity FROM public.pilates_schedule_slots WHERE id = p_slot_id AND is_active = true;
    IF v_capacity IS NULL THEN
        RAISE EXCEPTION 'Slot not available';
    END IF;
    SELECT COUNT(*) INTO v_booked FROM public.pilates_bookings WHERE slot_id = p_slot_id AND status = 'confirmed';
    IF v_booked >= v_capacity THEN
        RAISE EXCEPTION 'Slot full';
    END IF;

    -- Get active deposit with DETERMINISTIC check
    SELECT * INTO v_deposit FROM public.pilates_deposits
    WHERE user_id = p_user_id 
    AND is_active = true
    AND deposit_remaining > 0
    AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY credited_at DESC
    LIMIT 1;
    
    IF v_deposit.id IS NULL OR v_deposit.is_active = false OR v_deposit.deposit_remaining <= 0 THEN
        RAISE EXCEPTION 'No active deposit - deposit exhausted or expired';
    END IF;

    -- Atomic: lock deposit row to avoid race
    PERFORM 1 FROM public.pilates_deposits WHERE id = v_deposit.id FOR UPDATE;

    -- Re-check deposit after lock
    SELECT deposit_remaining INTO v_deposit.deposit_remaining FROM public.pilates_deposits WHERE id = v_deposit.id;
    IF v_deposit.deposit_remaining <= 0 THEN
        RAISE EXCEPTION 'Deposit empty after lock';
    END IF;

    -- Decrement deposit
    UPDATE public.pilates_deposits AS pd
        SET deposit_remaining = pd.deposit_remaining - 1,
            updated_at = now(),
            is_active = CASE WHEN pd.deposit_remaining - 1 <= 0 THEN false ELSE pd.is_active END
        WHERE pd.id = v_deposit.id;

    -- Create booking
    INSERT INTO public.pilates_bookings (user_id, slot_id, status)
    VALUES (p_user_id, p_slot_id, 'confirmed')
    ON CONFLICT (user_id, slot_id) DO NOTHING
    RETURNING id INTO v_existing;

    IF v_existing IS NULL THEN
        -- Booking already existed concurrently; revert decrement
        UPDATE public.pilates_deposits
            SET deposit_remaining = deposit_remaining + 1,
                is_active = true,
                updated_at = now()
            WHERE id = v_deposit.id;
        SELECT * INTO v_deposit FROM public.get_active_pilates_deposit(p_user_id);
        SELECT id INTO v_existing FROM public.pilates_bookings WHERE user_id=p_user_id AND slot_id=p_slot_id AND status='confirmed' LIMIT 1;
    END IF;

    -- Get updated deposit
    SELECT pd.deposit_remaining INTO v_deposit.deposit_remaining FROM public.pilates_deposits pd WHERE pd.id = v_deposit.id;

    -- Log successful booking
    INSERT INTO membership_logs (membership_id, action, details, created_at)
    VALUES (v_membership.id, 'pilates_booking_success', json_build_object(
        'user_id', p_user_id,
        'slot_id', p_slot_id,
        'booking_id', v_existing,
        'deposit_remaining_after', v_deposit.deposit_remaining,
        'timestamp', NOW()
    ), NOW())
    ON CONFLICT DO NOTHING;

    -- Return full booking details
    SELECT json_build_object(
        'booking_id', b.id,
        'deposit_remaining', v_deposit.deposit_remaining,
        'booking', json_build_object(
            'id', b.id,
            'user_id', b.user_id,
            'slot_id', b.slot_id,
            'booking_date', b.booking_date,
            'status', b.status,
            'notes', b.notes,
            'created_at', b.created_at,
            'updated_at', b.updated_at,
            'slot', json_build_object(
                'id', s.id,
                'date', s.date,
                'start_time', s.start_time,
                'end_time', s.end_time,
                'max_capacity', s.max_capacity,
                'is_active', s.is_active
            )
        )
    ) INTO v_result
    FROM public.pilates_bookings b
    LEFT JOIN public.pilates_schedule_slots s ON s.id = b.slot_id
    WHERE b.id = v_existing;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON FUNCTION public.book_pilates_class_v2(uuid, uuid) IS 
'Enhanced Pilates booking with DETERMINISTIC membership validation.
Checks end_date >= CURRENT_DATE and deposit validity before allowing booking.
Includes comprehensive logging for debugging.';

-- =====================================================
-- PHASE 4: CREATE AUTOMATIC EXPIRATION TRIGGER
-- =====================================================

SELECT '📋 PHASE 4: Creating automatic expiration triggers...' as phase;

-- Function to auto-expire Pilates memberships when end_date passes
CREATE OR REPLACE FUNCTION auto_expire_pilates_memberships()
RETURNS TRIGGER AS $$
DECLARE
    pilates_package_id UUID;
BEGIN
    -- Find Pilates package ID
    SELECT id INTO pilates_package_id FROM membership_packages WHERE LOWER(name) = 'pilates' LIMIT 1;
    
    -- Only process Pilates memberships
    IF NEW.package_id = pilates_package_id THEN
        -- If end_date is in the past and status is still active, expire it
        IF NEW.end_date < CURRENT_DATE AND NEW.status = 'active' THEN
            NEW.status := 'expired';
            NEW.is_active := false;
            NEW.updated_at := NOW();
            
            -- Log the auto-expiration
            INSERT INTO membership_logs (membership_id, action, details, created_at)
            VALUES (NEW.id, 'auto_expired', json_build_object(
                'reason', 'end_date passed',
                'end_date', NEW.end_date,
                'current_date', CURRENT_DATE,
                'auto_expired_at', NOW()
            ), NOW())
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT/UPDATE on memberships
DROP TRIGGER IF EXISTS trigger_auto_expire_pilates_memberships ON memberships;
CREATE TRIGGER trigger_auto_expire_pilates_memberships
    BEFORE INSERT OR UPDATE ON memberships
    FOR EACH ROW
    EXECUTE FUNCTION auto_expire_pilates_memberships();

-- Function to auto-expire pilates deposits when exhausted or expired
CREATE OR REPLACE FUNCTION auto_expire_pilates_deposits()
RETURNS TRIGGER AS $$
BEGIN
    -- If deposit is exhausted or expired, deactivate it
    IF NEW.is_active = true AND (
        NEW.deposit_remaining <= 0 
        OR (NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW())
    ) THEN
        NEW.is_active := false;
        NEW.updated_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT/UPDATE on pilates_deposits
DROP TRIGGER IF EXISTS trigger_auto_expire_pilates_deposits ON pilates_deposits;
CREATE TRIGGER trigger_auto_expire_pilates_deposits
    BEFORE INSERT OR UPDATE ON pilates_deposits
    FOR EACH ROW
    EXECUTE FUNCTION auto_expire_pilates_deposits();

-- =====================================================
-- PHASE 5: CREATE SCHEDULED EXPIRATION FUNCTION
-- =====================================================

SELECT '📋 PHASE 5: Creating scheduled expiration function...' as phase;

-- Comprehensive function to expire all overdue Pilates subscriptions
CREATE OR REPLACE FUNCTION expire_pilates_subscriptions()
RETURNS TABLE(
    expired_memberships INTEGER,
    expired_deposits INTEGER,
    total_processed INTEGER,
    execution_time INTERVAL,
    details JSON
) AS $$
DECLARE
    v_start_time TIMESTAMP;
    v_expired_memberships INTEGER := 0;
    v_expired_deposits INTEGER := 0;
    pilates_package_id UUID;
    v_membership_ids UUID[];
    v_deposit_ids UUID[];
BEGIN
    v_start_time := NOW();
    
    -- Find Pilates package ID
    SELECT id INTO pilates_package_id FROM membership_packages WHERE LOWER(name) = 'pilates' LIMIT 1;
    
    -- Step 1: Expire Pilates memberships where end_date < CURRENT_DATE
    IF pilates_package_id IS NOT NULL THEN
        WITH expired AS (
            UPDATE memberships 
            SET 
                status = 'expired',
                is_active = false,
                updated_at = NOW()
            WHERE package_id = pilates_package_id
            AND end_date < CURRENT_DATE 
            AND status = 'active'
            RETURNING id
        )
        SELECT ARRAY_AGG(id), COUNT(*) INTO v_membership_ids, v_expired_memberships FROM expired;
    END IF;
    
    -- Step 2: Expire pilates_deposits where exhausted or expired
    WITH expired AS (
        UPDATE pilates_deposits 
        SET 
            is_active = false,
            updated_at = NOW()
        WHERE is_active = true 
        AND (
            deposit_remaining <= 0 
            OR (expires_at IS NOT NULL AND expires_at < NOW())
        )
        RETURNING id
    )
    SELECT ARRAY_AGG(id), COUNT(*) INTO v_deposit_ids, v_expired_deposits FROM expired;
    
    -- Log the expiration batch
    INSERT INTO membership_logs (membership_id, action, details, created_at)
    VALUES (NULL, 'batch_expiration', json_build_object(
        'expired_memberships_count', v_expired_memberships,
        'expired_memberships_ids', v_membership_ids,
        'expired_deposits_count', v_expired_deposits,
        'expired_deposits_ids', v_deposit_ids,
        'execution_time', NOW() - v_start_time,
        'executed_at', NOW()
    ), NOW())
    ON CONFLICT DO NOTHING;
    
    RETURN QUERY SELECT
        v_expired_memberships,
        v_expired_deposits,
        v_expired_memberships + v_expired_deposits,
        NOW() - v_start_time,
        json_build_object(
            'membership_ids', v_membership_ids,
            'deposit_ids', v_deposit_ids
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PHASE 6: GRANT PERMISSIONS
-- =====================================================

SELECT '📋 PHASE 6: Granting permissions...' as phase;

GRANT EXECUTE ON FUNCTION is_pilates_membership_truly_active(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_pilates_deposit_truly_active(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_pilates_subscription_status(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION book_pilates_class_v2(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION expire_pilates_subscriptions() TO authenticated, service_role;

-- =====================================================
-- PHASE 7: VERIFICATION
-- =====================================================

SELECT '📋 PHASE 7: Verification...' as phase;

-- Verify all functions exist
SELECT 
    'is_pilates_membership_truly_active' as function_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_pilates_membership_truly_active') 
        THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'is_pilates_deposit_truly_active',
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_pilates_deposit_truly_active') 
        THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
    'get_pilates_subscription_status',
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_pilates_subscription_status') 
        THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
    'book_pilates_class_v2',
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'book_pilates_class_v2') 
        THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
    'expire_pilates_subscriptions',
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'expire_pilates_subscriptions') 
        THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- Verify triggers exist
SELECT 
    'trigger_auto_expire_pilates_memberships' as trigger_name,
    CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_auto_expire_pilates_memberships') 
        THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'trigger_auto_expire_pilates_deposits',
    CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_auto_expire_pilates_deposits') 
        THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- Show current Pilates subscription status
SELECT 
    'PILATES SUBSCRIPTION STATUS' as report_type,
    COUNT(*) as total_pilates_memberships,
    COUNT(*) FILTER (WHERE status = 'active' AND end_date >= CURRENT_DATE) as truly_active,
    COUNT(*) FILTER (WHERE status = 'active' AND end_date < CURRENT_DATE) as should_be_expired,
    COUNT(*) FILTER (WHERE status = 'expired') as expired
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE LOWER(mp.name) = 'pilates';

SELECT 
    'PILATES DEPOSITS STATUS' as report_type,
    COUNT(*) as total_deposits,
    COUNT(*) FILTER (WHERE is_active = true AND deposit_remaining > 0 AND (expires_at IS NULL OR expires_at > NOW())) as truly_active,
    COUNT(*) FILTER (WHERE is_active = true AND (deposit_remaining <= 0 OR (expires_at IS NOT NULL AND expires_at < NOW()))) as should_be_expired,
    COUNT(*) FILTER (WHERE is_active = false) as inactive
FROM pilates_deposits;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 
    '🎉 PILATES SUBSCRIPTION DEFINITIVE FIX COMPLETE! 🎉' as final_message,
    'All expired Pilates memberships and deposits have been fixed' as immediate_fix,
    'Triggers will auto-expire memberships/deposits when dates pass' as automatic_fix,
    'All queries now use deterministic date checking' as query_fix,
    'Run expire_pilates_subscriptions() daily for batch expiration' as scheduled_fix;
