-- ═══════════════════════════════════════════════════════════════════════════════
-- ΟΛΟΚΛΗΡΩΜΕΝΗ ΔΙΟΡΘΩΣΗ: Weekly Pilates Refill System
-- ═══════════════════════════════════════════════════════════════════════════════
-- Αυτό το script:
-- 1. Αφαιρεί το check constraint που εμποδίζει το refill
-- 2. Ενημερώνει τη function process_weekly_pilates_refills
-- ═══════════════════════════════════════════════════════════════════════════════

-- ΒΗΜΑ 1: Βρείτε και διαγράψτε το check constraint
SELECT 'ΒΗΜΑ 1: Αφαίρεση check constraint' as step;

DO $$
DECLARE
    r record;
BEGIN
    FOR r IN 
        SELECT conname, pg_get_constraintdef(oid) as def
        FROM pg_constraint
        WHERE conrelid = 'public.ultimate_weekly_refills'::regclass
        AND contype = 'c'
    LOOP
        -- Αν το constraint ελέγχει new_deposit_amount >= previous_deposit_amount
        IF r.def LIKE '%new_deposit_amount%>=%previous_deposit_amount%' 
           OR r.def LIKE '%previous_deposit_amount%<=%new_deposit_amount%' THEN
            EXECUTE format('ALTER TABLE public.ultimate_weekly_refills DROP CONSTRAINT %I', r.conname);
            RAISE NOTICE '✅ Διαγράφηκε: % (%)', r.conname, r.def;
        END IF;
    END LOOP;
END $$;

-- ΒΗΜΑ 2: Ενημέρωση function (από FIX_REFILL_FOR_ALL_ULTIMATE.sql)
SELECT 'ΒΗΜΑ 2: Ενημέρωση function' as step;

DROP FUNCTION IF EXISTS public.process_weekly_pilates_refills();

CREATE OR REPLACE FUNCTION public.process_weekly_pilates_refills()
RETURNS TABLE(
    processed_count integer,
    success_count integer,
    error_count integer,
    details jsonb
) AS $$
DECLARE
    v_processed_count integer := 0;
    v_success_count integer := 0;
    v_error_count integer := 0;
    v_details jsonb := '[]'::jsonb;
    v_user_record record;
    v_active_deposit record;
    v_new_deposit_amount integer;
    v_target_deposit_amount integer;
    v_pilates_package_id uuid;
    v_deposit_id uuid;
    v_refill_date date;
    v_refill_week integer;
    v_error_message text;
BEGIN
    -- Έλεγχος αν το feature είναι ενεργό
    IF NOT EXISTS (
        SELECT 1 FROM public.feature_flags 
        WHERE name = 'weekly_pilates_refill_enabled' 
        AND is_enabled = true
    ) THEN
        RETURN QUERY SELECT 0, 0, 0, '{"error": "Feature disabled"}'::jsonb;
        RETURN;
    END IF;

    -- Βρες το Pilates package ID
    SELECT id INTO v_pilates_package_id 
    FROM public.membership_packages 
    WHERE name = 'Pilates' 
    LIMIT 1;

    IF v_pilates_package_id IS NULL THEN
        RETURN QUERY SELECT 0, 0, 1, '{"error": "Pilates package not found"}'::jsonb;
        RETURN;
    END IF;

    v_refill_date := CURRENT_DATE;

    -- Ψάχνουμε με ΠΟΛΛΑΠΛΟΥΣ τρόπους
    FOR v_user_record IN (
        SELECT DISTINCT ON (m.user_id)
            m.id as membership_id,
            m.user_id,
            m.start_date as activation_date,
            m.end_date,
            COALESCE(m.source_package_name, mp.name) as package_name
        FROM public.memberships m
        JOIN public.membership_packages mp ON m.package_id = mp.id
        WHERE (
            m.source_package_name IN ('Ultimate', 'Ultimate Medium')
            OR mp.name IN ('Ultimate', 'Ultimate Medium')
        )
        AND m.is_active = true
        AND m.start_date <= v_refill_date
        AND m.end_date >= v_refill_date
        AND NOT EXISTS (
            SELECT 1 FROM public.ultimate_weekly_refills uwr
            WHERE uwr.user_id = m.user_id 
            AND uwr.refill_date = v_refill_date
        )
        ORDER BY m.user_id, m.created_at DESC
    ) LOOP
        v_processed_count := v_processed_count + 1;
        
        BEGIN
            -- Σωστά deposits ανά πακέτο
            v_target_deposit_amount := CASE 
                WHEN v_user_record.package_name = 'Ultimate' THEN 3
                WHEN v_user_record.package_name = 'Ultimate Medium' THEN 1
                ELSE 0
            END;
            
            IF v_target_deposit_amount = 0 THEN
                CONTINUE;
            END IF;
            
            v_refill_week := GREATEST(1, ((v_refill_date - v_user_record.activation_date)::integer / 7) + 1);
            
            -- Πάρε το τρέχον ενεργό deposit
            SELECT pd.id, pd.deposit_remaining INTO v_active_deposit
            FROM public.pilates_deposits pd
            WHERE pd.user_id = v_user_record.user_id
            AND pd.is_active = true
            ORDER BY pd.credited_at DESC
            LIMIT 1;
            
            -- RESET στο target amount
            v_new_deposit_amount := v_target_deposit_amount;
            
            -- Δημιουργία ή ενημέρωση Pilates deposit
            IF v_active_deposit.id IS NOT NULL THEN
                UPDATE public.pilates_deposits 
                SET 
                    deposit_remaining = v_new_deposit_amount,
                    is_active = true,
                    updated_at = now()
                WHERE id = v_active_deposit.id
                RETURNING id INTO v_deposit_id;
            ELSE
                INSERT INTO public.pilates_deposits (
                    user_id, 
                    package_id, 
                    deposit_remaining, 
                    expires_at, 
                    is_active,
                    created_by
                ) VALUES (
                    v_user_record.user_id,
                    v_pilates_package_id,
                    v_new_deposit_amount,
                    v_user_record.end_date + INTERVAL '23:59:59',
                    true,
                    NULL
                ) RETURNING id INTO v_deposit_id;
            END IF;
            
            -- Καταγραφή refill (με NULL για source_request_id)
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
                pilates_deposit_id,
                created_by
            ) VALUES (
                v_user_record.user_id,
                v_user_record.membership_id,
                NULL,  -- System-triggered refill, no source_request_id
                v_user_record.package_name,
                v_user_record.activation_date,
                v_refill_date,
                v_refill_week,
                v_target_deposit_amount,
                COALESCE(v_active_deposit.deposit_remaining, 0),
                v_new_deposit_amount,
                v_deposit_id,
                NULL
            );
            
            v_success_count := v_success_count + 1;
            
            v_details := v_details || jsonb_build_object(
                'user_id', v_user_record.user_id,
                'package_name', v_user_record.package_name,
                'previous_amount', COALESCE(v_active_deposit.deposit_remaining, 0),
                'new_amount', v_new_deposit_amount,
                'week_number', v_refill_week
            );
            
        EXCEPTION
            WHEN OTHERS THEN
                v_error_count := v_error_count + 1;
                v_error_message := SQLERRM;
                
                v_details := v_details || jsonb_build_object(
                    'user_id', v_user_record.user_id,
                    'error', v_error_message
                );
        END;
    END LOOP;
    
    RETURN QUERY SELECT v_processed_count, v_success_count, v_error_count, v_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.process_weekly_pilates_refills() TO authenticated, service_role;

-- ΒΗΜΑ 3: Επαλήθευση
SELECT 'ΒΗΜΑ 3: Επαλήθευση constraints' as step;

SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.ultimate_weekly_refills'::regclass
AND contype = 'c'
ORDER BY conname;

SELECT '✅ ΟΛΟΚΛΗΡΩΘΗΚΕ Η ΔΙΟΡΘΩΣΗ!' as result;

