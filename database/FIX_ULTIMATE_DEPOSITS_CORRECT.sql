-- ΔΙΟΡΘΩΣΗ ULTIMATE PILATES DEPOSITS
-- Το Ultimate (σκέτο) πρέπει να πιστώνει 3 μαθήματα την εβδομάδα
-- Το Ultimate Medium πρέπει να πιστώνει 1 μάθημα την εβδομάδα

-- ========================================
-- ΒΗΜΑ 1: ΔΙΟΡΘΩΣΗ ΤΗΣ create_ultimate_dual_memberships FUNCTION
-- ========================================

SELECT 'ΒΗΜΑ 1: Διόρθωση της create_ultimate_dual_memberships function...' as step;

-- Drop existing function first
DROP FUNCTION IF EXISTS public.create_ultimate_dual_memberships(UUID, UUID, INTEGER, DATE);

CREATE OR REPLACE FUNCTION public.create_ultimate_dual_memberships(
    p_user_id UUID,
    p_ultimate_request_id UUID,
    p_duration_days INTEGER DEFAULT 365,
    p_start_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
DECLARE
    v_pilates_package_id UUID;
    v_free_gym_package_id UUID;
    v_end_date DATE;
    v_pilates_membership_id UUID;
    v_free_gym_membership_id UUID;
    v_result JSONB;
    v_source_package_name TEXT;
    v_ultimate_package_id UUID;
    v_deposit_amount INTEGER;
    v_pilates_deposit_id UUID;
BEGIN
    -- Calculate end date
    v_end_date := p_start_date + INTERVAL '1 day' * p_duration_days;
    
    -- Get Pilates package ID
    SELECT id INTO v_pilates_package_id 
    FROM membership_packages 
    WHERE name = 'Pilates' 
    LIMIT 1;
    
    -- Get Free Gym package ID
    SELECT id INTO v_free_gym_package_id 
    FROM membership_packages 
    WHERE name = 'Free Gym' 
    LIMIT 1;
    
    -- Validate that both packages exist
    IF v_pilates_package_id IS NULL THEN
        RAISE EXCEPTION 'Pilates package not found';
    END IF;
    
    IF v_free_gym_package_id IS NULL THEN
        RAISE EXCEPTION 'Free Gym package not found';
    END IF;
    
    -- Determine source package name from the original request
    SELECT mp.name INTO v_source_package_name
    FROM membership_requests mr
    JOIN membership_packages mp ON mr.package_id = mp.id
    WHERE mr.id = p_ultimate_request_id;
    
    -- Default to 'Ultimate' if not found
    IF v_source_package_name IS NULL THEN
        v_source_package_name := 'Ultimate';
    END IF;
    
    -- Get the Ultimate package ID for deposit crediting
    SELECT id INTO v_ultimate_package_id
    FROM membership_packages
    WHERE name = v_source_package_name
    LIMIT 1;
    
    -- *** ΔΙΟΡΘΩΣΗ: Σωστά deposits ανά πακέτο ***
    v_deposit_amount := CASE 
        WHEN v_source_package_name = 'Ultimate' THEN 3  -- Ultimate: 3 μαθήματα/εβδομάδα
        WHEN v_source_package_name = 'Ultimate Medium' THEN 1  -- Ultimate Medium: 1 μάθημα/εβδομάδα
        ELSE 0
    END;
    
    -- Create Pilates membership
    INSERT INTO memberships (
        id,
        user_id,
        package_id,
        start_date,
        end_date,
        is_active,
        expires_at,
        created_at,
        updated_at,
        source_request_id,
        source_package_name
    ) VALUES (
        gen_random_uuid(),
        p_user_id,
        v_pilates_package_id,
        p_start_date,
        v_end_date,
        true,
        v_end_date + INTERVAL '23:59:59',
        NOW(),
        NOW(),
        p_ultimate_request_id,
        v_source_package_name
    ) RETURNING id INTO v_pilates_membership_id;
    
    -- Create Free Gym membership
    INSERT INTO memberships (
        id,
        user_id,
        package_id,
        start_date,
        end_date,
        is_active,
        expires_at,
        created_at,
        updated_at,
        source_request_id,
        source_package_name
    ) VALUES (
        gen_random_uuid(),
        p_user_id,
        v_free_gym_package_id,
        p_start_date,
        v_end_date,
        true,
        v_end_date + INTERVAL '23:59:59',
        NOW(),
        NOW(),
        p_ultimate_request_id,
        v_source_package_name
    ) RETURNING id INTO v_free_gym_membership_id;
    
    -- Create initial Pilates deposit if amount > 0
    IF v_deposit_amount > 0 THEN
        INSERT INTO public.pilates_deposits (
            user_id,
            package_id,
            deposit_remaining,
            expires_at,
            is_active,
            created_by
        ) VALUES (
            p_user_id,
            v_ultimate_package_id,
            v_deposit_amount,  -- Το σωστό ποσό: 3 για Ultimate, 1 για Ultimate Medium
            v_end_date + INTERVAL '23:59:59',
            true,
            NULL -- System created
        ) RETURNING id INTO v_pilates_deposit_id;
    END IF;
    
    -- Return result with both membership IDs and deposit info
    v_result := jsonb_build_object(
        'success', true,
        'pilates_membership_id', v_pilates_membership_id,
        'free_gym_membership_id', v_free_gym_membership_id,
        'start_date', p_start_date,
        'end_date', v_end_date,
        'duration_days', p_duration_days,
        'source_package_name', v_source_package_name,
        'initial_deposit_amount', v_deposit_amount,
        'pilates_deposit_id', v_pilates_deposit_id
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- ΒΗΜΑ 2: ΔΙΟΡΘΩΣΗ ΤΗΣ process_weekly_pilates_refills FUNCTION
-- ========================================

SELECT 'ΒΗΜΑ 2: Διόρθωση της process_weekly_pilates_refills function...' as step;

-- Drop existing function first
DROP FUNCTION IF EXISTS public.process_weekly_pilates_refills();

CREATE OR REPLACE FUNCTION public.process_weekly_pilates_refills()
RETURNS TABLE(
    user_id uuid,
    package_name text,
    previous_deposit integer,
    new_deposit integer,
    refill_date date,
    refill_week integer,
    success boolean,
    message text,
    processed_count integer,
    success_count integer,
    details jsonb
) AS $$
DECLARE
    v_refill_date date := CURRENT_DATE;
    v_user_record record;
    v_active_deposit record;
    v_new_deposit_amount integer;
    v_previous_deposit_amount integer;
    v_target_deposit_amount integer;
    v_refill_week integer;
    v_pilates_deposit_id uuid;
    v_processed_count integer := 0;
    v_success_count integer := 0;
    v_details jsonb := '[]'::jsonb;
BEGIN
    -- Find all users with active Ultimate memberships
    FOR v_user_record IN 
        SELECT DISTINCT
            m.user_id,
            m.id as membership_id,
            m.source_request_id,
            m.source_package_name as package_name,
            m.start_date as activation_date,
            m.end_date
        FROM public.memberships m
        WHERE m.source_package_name IN ('Ultimate', 'Ultimate Medium')
        AND m.is_active = true
        AND m.start_date <= v_refill_date
        AND m.end_date >= v_refill_date
    LOOP
        v_processed_count := v_processed_count + 1;
        
        BEGIN
            -- Calculate refill week number
            v_refill_week := EXTRACT(DAYS FROM v_refill_date - v_user_record.activation_date) / 7 + 1;
            
            -- Skip if not a weekly refill day (should be every 7 days from activation)
            IF EXTRACT(DAYS FROM v_refill_date - v_user_record.activation_date) % 7 != 0 THEN
                CONTINUE;
            END IF;
            
            -- *** ΔΙΟΡΘΩΣΗ: Σωστά deposits ανά πακέτο ***
            v_target_deposit_amount := CASE 
                WHEN v_user_record.package_name = 'Ultimate' THEN 3  -- Ultimate: 3 μαθήματα/εβδομάδα
                WHEN v_user_record.package_name = 'Ultimate Medium' THEN 1  -- Ultimate Medium: 1 μάθημα/εβδομάδα
                ELSE 0
            END;
            
            IF v_target_deposit_amount = 0 THEN
                CONTINUE;
            END IF;
            
            -- Get current active deposit
            SELECT * INTO v_active_deposit 
            FROM public.get_active_pilates_deposit(v_user_record.user_id);
            
            -- Calculate new deposit amount (top-up to target)
            v_new_deposit_amount := GREATEST(
                COALESCE(v_active_deposit.deposit_remaining, 0), 
                v_target_deposit_amount
            );
            
            -- Only process if we need to top-up
            IF v_new_deposit_amount > COALESCE(v_active_deposit.deposit_remaining, 0) THEN
                -- Update existing deposit
                IF v_active_deposit.id IS NOT NULL THEN
                    UPDATE public.pilates_deposits
                    SET deposit_remaining = v_new_deposit_amount,
                        updated_at = NOW()
                    WHERE id = v_active_deposit.id;
                    
                    v_pilates_deposit_id := v_active_deposit.id;
                END IF;
                
                v_previous_deposit_amount := COALESCE(v_active_deposit.deposit_remaining, 0);
                
                -- Record refill history
                INSERT INTO public.ultimate_weekly_refills (
                    user_id,
                    membership_id,
                    source_request_id,
                    package_name,
                    activation_date,
                    refill_date,
                    refill_week_number,
                    target_deposit_amount,
                    previous_deposit_amount,
                    new_deposit_amount,
                    pilates_deposit_id
                ) VALUES (
                    v_user_record.user_id,
                    v_user_record.membership_id,
                    v_user_record.source_request_id,
                    v_user_record.package_name,
                    v_user_record.activation_date,
                    v_refill_date,
                    v_refill_week,
                    v_target_deposit_amount,
                    v_previous_deposit_amount,
                    v_new_deposit_amount,
                    v_pilates_deposit_id
                )
                ON CONFLICT (user_id, refill_date) DO NOTHING;
                
                v_success_count := v_success_count + 1;
                
                -- Add to details
                v_details := v_details || jsonb_build_object(
                    'user_id', v_user_record.user_id,
                    'package', v_user_record.package_name,
                    'previous', v_previous_deposit_amount,
                    'new', v_new_deposit_amount,
                    'target', v_target_deposit_amount
                );
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Log error but continue processing
            RAISE WARNING 'Error processing refill for user %: %', v_user_record.user_id, SQLERRM;
        END;
    END LOOP;
    
    -- Return summary
    RETURN QUERY SELECT 
        NULL::uuid,
        NULL::text,
        NULL::integer,
        NULL::integer,
        v_refill_date,
        NULL::integer,
        true,
        format('Processed %s users, %s successful refills', v_processed_count, v_success_count),
        v_processed_count,
        v_success_count,
        v_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- ΒΗΜΑ 3: ΔΙΟΡΘΩΣΗ ΤΗΣ get_user_weekly_refill_status FUNCTION
-- ========================================

SELECT 'ΒΗΜΑ 3: Διόρθωση της get_user_weekly_refill_status function...' as step;

-- Drop existing function first
DROP FUNCTION IF EXISTS public.get_user_weekly_refill_status(UUID);

CREATE OR REPLACE FUNCTION public.get_user_weekly_refill_status(p_user_id uuid)
RETURNS TABLE(
    user_id uuid,
    package_name text,
    activation_date date,
    next_refill_date date,
    next_refill_week integer,
    current_deposit_amount integer,
    target_deposit_amount integer,
    is_refill_due boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.user_id,
        m.source_package_name as package_name,
        m.start_date as activation_date,
        (m.start_date + INTERVAL '1 day' * (7 * CEIL((CURRENT_DATE - m.start_date)::integer / 7.0 + 1)))::date as next_refill_date,
        CEIL((CURRENT_DATE - m.start_date)::integer / 7.0)::integer as next_refill_week,
        COALESCE(pd.deposit_remaining, 0) as current_deposit_amount,
        -- *** ΔΙΟΡΘΩΣΗ: Σωστά deposits ανά πακέτο ***
        CASE 
            WHEN m.source_package_name = 'Ultimate' THEN 3  -- Ultimate: 3 μαθήματα/εβδομάδα
            WHEN m.source_package_name = 'Ultimate Medium' THEN 1  -- Ultimate Medium: 1 μάθημα/εβδομάδα
            ELSE 0
        END as target_deposit_amount,
        ((CURRENT_DATE - m.start_date)::integer % 7 = 0) as is_refill_due
    FROM public.memberships m
    LEFT JOIN public.get_active_pilates_deposit(m.user_id) pd ON true
    WHERE m.user_id = p_user_id
    AND m.source_package_name IN ('Ultimate', 'Ultimate Medium')
    AND m.is_active = true
    AND m.start_date <= CURRENT_DATE
    AND m.end_date >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql STABLE;

-- ========================================
-- ΒΗΜΑ 4: PERMISSIONS
-- ========================================

SELECT 'ΒΗΜΑ 4: Ρύθμιση permissions...' as step;

GRANT EXECUTE ON FUNCTION public.create_ultimate_dual_memberships(UUID, UUID, INTEGER, DATE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_weekly_pilates_refills() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_weekly_refill_status(UUID) TO authenticated, service_role;

-- ========================================
-- ΒΗΜΑ 5: ΕΠΑΛΗΘΕΥΣΗ
-- ========================================

SELECT 'ΒΗΜΑ 5: Επαλήθευση διορθώσεων...' as step;

-- Έλεγχος για Ultimate users
SELECT 
    up.first_name,
    up.last_name,
    m.source_package_name,
    status.*
FROM public.user_profiles up
JOIN public.memberships m ON up.user_id = m.user_id
CROSS JOIN LATERAL public.get_user_weekly_refill_status(up.user_id) status
WHERE m.source_package_name IN ('Ultimate', 'Ultimate Medium')
AND m.is_active = true
LIMIT 10;

SELECT '✅ ΔΙΟΡΘΩΣΗ ΟΛΟΚΛΗΡΩΘΗΚΕ ΕΠΙΤΥΧΩΣ!' as result;
SELECT 'Ultimate: 3 μαθήματα/εβδομάδα | Ultimate Medium: 1 μάθημα/εβδομάδα' as confirmation;

