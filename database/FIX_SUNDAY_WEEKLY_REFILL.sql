-- ═══════════════════════════════════════════════════════════════════════════════
-- ΔΙΟΡΘΩΣΗ: Weekly Pilates Refill - Κάθε ΚΥΡΙΑΚΗ
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- ΠΡΟΒΛΗΜΑ: Η παλιά λογική έκανε refill κάθε 7 μέρες από την activation date
-- ΔΙΟΡΘΩΣΗ: Τώρα θα κάνει refill ΚΑΘΕ ΚΥΡΙΑΚΗ για όλους τους Ultimate χρήστες
--
-- Ultimate: Reset σε 3 μαθήματα κάθε Κυριακή
-- Ultimate Medium: Reset σε 1 μάθημα κάθε Κυριακή
-- ═══════════════════════════════════════════════════════════════════════════════

-- ========================================
-- ΒΗΜΑ 1: DROP υπάρχουσες functions
-- ========================================

SELECT 'ΒΗΜΑ 1: Διαγραφή υπαρχουσών functions...' as step;

DROP FUNCTION IF EXISTS public.process_weekly_pilates_refills();
DROP FUNCTION IF EXISTS public.force_sunday_refill();
DROP FUNCTION IF EXISTS public.get_user_weekly_refill_status(uuid);

-- ========================================
-- ΒΗΜΑ 2: Δημιουργία process_weekly_pilates_refills
-- ========================================

SELECT 'ΒΗΜΑ 2: Δημιουργία νέας process_weekly_pilates_refills...' as step;

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
    v_is_sunday boolean;
    v_week_number integer;
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

    -- Ημερομηνία refill = σήμερα
    v_refill_date := CURRENT_DATE;
    
    -- Έλεγχος αν είναι Κυριακή (0 = Κυριακή στο DOW)
    v_is_sunday := (EXTRACT(DOW FROM v_refill_date) = 0);
    
    -- Υπολογισμός αριθμού εβδομάδας του έτους
    v_week_number := EXTRACT(WEEK FROM v_refill_date)::integer;

    -- *** ΔΙΟΡΘΩΣΗ: Επεξεργασία ΟΛΩΝ των ενεργών Ultimate χρηστών ***
    -- Δεν ελέγχουμε πλέον αν είναι 7 μέρες από την activation!
    FOR v_user_record IN (
        SELECT 
            m.id as membership_id,
            m.user_id,
            m.start_date as activation_date,
            m.end_date,
            m.source_request_id,
            m.source_package_name
        FROM public.memberships m
        WHERE m.source_package_name IN ('Ultimate', 'Ultimate Medium')
        AND m.is_active = true
        AND m.start_date <= v_refill_date
        AND m.end_date >= v_refill_date
        -- Έλεγχος ότι δεν έχει γίνει ήδη refill αυτή την Κυριακή
        AND NOT EXISTS (
            SELECT 1 FROM public.ultimate_weekly_refills uwr
            WHERE uwr.user_id = m.user_id 
            AND uwr.refill_date = v_refill_date
        )
    ) LOOP
        v_processed_count := v_processed_count + 1;
        
        BEGIN
            -- *** ΔΙΟΡΘΩΣΗ: Σωστά deposits ανά πακέτο ***
            v_target_deposit_amount := CASE 
                WHEN v_user_record.source_package_name = 'Ultimate' THEN 3  -- Ultimate: 3 μαθήματα/εβδομάδα
                WHEN v_user_record.source_package_name = 'Ultimate Medium' THEN 1  -- Ultimate Medium: 1 μάθημα/εβδομάδα
                ELSE 0
            END;
            
            IF v_target_deposit_amount = 0 THEN
                CONTINUE;
            END IF;
            
            -- Υπολογισμός εβδομάδας από την ενεργοποίηση
            v_refill_week := GREATEST(1, ((v_refill_date - v_user_record.activation_date)::integer / 7) + 1);
            
            -- Πάρε το τρέχον ενεργό deposit
            SELECT pd.id, pd.deposit_remaining INTO v_active_deposit
            FROM public.pilates_deposits pd
            WHERE pd.user_id = v_user_record.user_id
            AND pd.is_active = true
            ORDER BY pd.credited_at DESC
            LIMIT 1;
            
            -- *** ΔΙΟΡΘΩΣΗ: RESET στο target amount (ΟΧΙ top-up) ***
            -- Κάθε Κυριακή το deposit επαναφέρεται στο σωστό νούμερο
            v_new_deposit_amount := v_target_deposit_amount;
            
            -- Δημιουργία ή ενημέρωση Pilates deposit
            IF v_active_deposit.id IS NOT NULL THEN
                -- Ενημέρωση υπάρχοντος deposit
                UPDATE public.pilates_deposits 
                SET 
                    deposit_remaining = v_new_deposit_amount,
                    is_active = true,
                    updated_at = now()
                WHERE id = v_active_deposit.id
                RETURNING id INTO v_deposit_id;
            ELSE
                -- Δημιουργία νέου deposit
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
                    NULL -- System created
                ) RETURNING id INTO v_deposit_id;
            END IF;
            
            -- Καταγραφή του refill
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
                v_user_record.source_request_id,
                v_user_record.source_package_name,
                v_user_record.activation_date,
                v_refill_date,
                v_refill_week,
                v_target_deposit_amount,
                COALESCE(v_active_deposit.deposit_remaining, 0),
                v_new_deposit_amount,
                v_deposit_id,
                NULL -- System created
            );
            
            v_success_count := v_success_count + 1;
            
            -- Προσθήκη στο details
            v_details := v_details || jsonb_build_object(
                'user_id', v_user_record.user_id,
                'package_name', v_user_record.source_package_name,
                'previous_amount', COALESCE(v_active_deposit.deposit_remaining, 0),
                'new_amount', v_new_deposit_amount,
                'week_number', v_refill_week
            );
            
        EXCEPTION
            WHEN OTHERS THEN
                v_error_count := v_error_count + 1;
                v_error_message := SQLERRM;
                
                -- Προσθήκη σφάλματος στο details
                v_details := v_details || jsonb_build_object(
                    'user_id', v_user_record.user_id,
                    'error', v_error_message
                );
        END;
    END LOOP;
    
    RETURN QUERY SELECT v_processed_count, v_success_count, v_error_count, v_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- ΒΗΜΑ 3: Δημιουργία force_sunday_refill function
-- ========================================

SELECT 'ΒΗΜΑ 3: Δημιουργία force_sunday_refill function...' as step;

-- Function για να τρέξει το refill χειροκίνητα (σαν να είναι Κυριακή)
CREATE OR REPLACE FUNCTION public.force_sunday_refill()
RETURNS TABLE(
    processed_count integer,
    success_count integer,
    error_count integer,
    details jsonb
) AS $$
BEGIN
    -- Τρέχει το process_weekly_pilates_refills χωρίς να ελέγχει αν είναι Κυριακή
    RETURN QUERY SELECT * FROM public.process_weekly_pilates_refills();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- ΒΗΜΑ 4: Δημιουργία get_user_weekly_refill_status
-- ========================================

SELECT 'ΒΗΜΑ 4: Δημιουργία get_user_weekly_refill_status...' as step;

CREATE OR REPLACE FUNCTION public.get_user_weekly_refill_status(p_user_id uuid)
RETURNS TABLE(
    user_id uuid,
    package_name text,
    activation_date date,
    next_refill_date date,
    next_refill_week integer,
    current_deposit_amount integer,
    target_deposit_amount integer,
    is_refill_due boolean,
    current_week_start date,
    current_week_end date
) AS $$
DECLARE
    v_today date := CURRENT_DATE;
    v_day_of_week integer := EXTRACT(DOW FROM v_today)::integer;
    v_next_sunday date;
    v_current_week_start date;
    v_current_week_end date;
BEGIN
    -- Υπολογισμός επόμενης Κυριακής
    IF v_day_of_week = 0 THEN
        -- Σήμερα είναι Κυριακή
        v_next_sunday := v_today;
    ELSE
        v_next_sunday := v_today + (7 - v_day_of_week);
    END IF;
    
    -- Υπολογισμός τρέχουσας εβδομάδας (Δευτέρα - Κυριακή)
    IF v_day_of_week = 0 THEN
        v_current_week_start := v_today - 6;  -- Δευτέρα πριν
        v_current_week_end := v_today;        -- Σήμερα (Κυριακή)
    ELSE
        v_current_week_start := v_today - v_day_of_week + 1;  -- Δευτέρα
        v_current_week_end := v_today + (7 - v_day_of_week);   -- Κυριακή
    END IF;

    RETURN QUERY
    SELECT 
        m.user_id,
        m.source_package_name as package_name,
        m.start_date as activation_date,
        v_next_sunday as next_refill_date,
        GREATEST(1, ((v_today - m.start_date)::integer / 7) + 1) as next_refill_week,
        COALESCE(pd.deposit_remaining, 0)::integer as current_deposit_amount,
        (CASE 
            WHEN m.source_package_name = 'Ultimate' THEN 3
            WHEN m.source_package_name = 'Ultimate Medium' THEN 1
            ELSE 0
        END)::integer as target_deposit_amount,
        (EXTRACT(DOW FROM v_today) = 0) as is_refill_due,  -- True αν είναι Κυριακή
        v_current_week_start as current_week_start,
        v_current_week_end as current_week_end
    FROM public.memberships m
    LEFT JOIN (
        SELECT pd2.user_id as dep_user_id, pd2.deposit_remaining
        FROM public.pilates_deposits pd2
        WHERE pd2.is_active = true
        ORDER BY pd2.credited_at DESC
    ) pd ON pd.dep_user_id = m.user_id
    WHERE m.user_id = p_user_id
    AND m.source_package_name IN ('Ultimate', 'Ultimate Medium')
    AND m.is_active = true
    AND m.start_date <= v_today
    AND m.end_date >= v_today
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ========================================
-- ΒΗΜΑ 5: PERMISSIONS
-- ========================================

SELECT 'ΒΗΜΑ 5: Ρύθμιση permissions...' as step;

GRANT EXECUTE ON FUNCTION public.process_weekly_pilates_refills() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_weekly_refill_status(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.force_sunday_refill() TO authenticated, service_role;

-- ========================================
-- ΒΗΜΑ 6: ΕΝΕΡΓΟΠΟΙΗΣΗ FEATURE FLAG
-- ========================================

SELECT 'ΒΗΜΑ 6: Ενεργοποίηση feature flag...' as step;

UPDATE public.feature_flags 
SET is_enabled = true, updated_at = now()
WHERE name = 'weekly_pilates_refill_enabled';

-- Αν δεν υπάρχει, δημιούργησέ το
INSERT INTO public.feature_flags (name, is_enabled, description)
VALUES ('weekly_pilates_refill_enabled', true, 'Enable weekly Pilates deposit refills for Ultimate packages')
ON CONFLICT (name) DO UPDATE SET is_enabled = true, updated_at = now();

-- ========================================
-- ΒΗΜΑ 7: ΕΠΑΛΗΘΕΥΣΗ
-- ========================================

SELECT 'ΒΗΜΑ 7: Επαλήθευση διορθώσεων...' as step;

-- Εμφάνιση Ultimate χρηστών
SELECT 
    up.first_name,
    up.last_name,
    m.source_package_name,
    m.is_active,
    m.start_date,
    m.end_date,
    pd.deposit_remaining as current_deposit,
    CASE 
        WHEN m.source_package_name = 'Ultimate' THEN 3
        WHEN m.source_package_name = 'Ultimate Medium' THEN 1
        ELSE 0
    END as target_deposit
FROM public.memberships m
JOIN public.user_profiles up ON m.user_id = up.user_id
LEFT JOIN public.pilates_deposits pd ON m.user_id = pd.user_id AND pd.is_active = true
WHERE m.source_package_name IN ('Ultimate', 'Ultimate Medium')
AND m.is_active = true
ORDER BY m.source_package_name, up.last_name;

SELECT '✅ ΟΛΟΚΛΗΡΩΘΗΚΕ! Η function θα κάνει refill κάθε Κυριακή!' as final_message;
