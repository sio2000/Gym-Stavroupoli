-- ═══════════════════════════════════════════════════════════════════════════════
-- ΡΥΘΜΙΣΗ CRON JOB ΓΙΑ WEEKLY PILATES REFILL
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Αυτό το script ρυθμίζει automatic execution κάθε Κυριακή στις 00:01
--
-- ΕΠΙΛΟΓΗ 1: pg_cron (αν είναι διαθέσιμο στο Supabase project)
-- ΕΠΙΛΟΓΗ 2: Supabase Scheduled Functions (προτεινόμενο)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ========================================
-- ΕΠΙΛΟΓΗ 1: pg_cron (Supabase Pro/Team plans)
-- ========================================

-- Πρώτα έλεγξε αν το pg_cron είναι διαθέσιμο
DO $$
DECLARE
    v_has_pg_cron boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) INTO v_has_pg_cron;
    
    IF v_has_pg_cron THEN
        RAISE NOTICE '✅ pg_cron είναι διαθέσιμο!';
        RAISE NOTICE 'Για να ρυθμίσεις το cron job, τρέξε χειροκίνητα:';
        RAISE NOTICE 'SELECT cron.schedule(''weekly-pilates-refill'', ''1 0 * * 0'', ''SELECT public.process_weekly_pilates_refills()'');';
    ELSE
        RAISE NOTICE '⚠️  pg_cron ΔΕΝ είναι διαθέσιμο.';
        RAISE NOTICE '   Χρησιμοποίησε Supabase Edge Functions + Cron ή εξωτερικό cron service.';
    END IF;
END $$;

-- ========================================
-- ΕΝΑΛΛΑΚΤΙΚΗ: Trigger function για έλεγχο κάθε φορά που γίνεται login
-- ========================================

SELECT 'Δημιουργία trigger function για auto-refill...' as step;

-- Trigger που ελέγχει και εκτελεί refill όταν κάποιος χρήστης συνδεθεί την Κυριακή
CREATE OR REPLACE FUNCTION public.check_and_trigger_sunday_refill()
RETURNS void AS $$
DECLARE
    v_today date := CURRENT_DATE;
    v_is_sunday boolean;
    v_last_refill_date date;
BEGIN
    -- Έλεγχος αν είναι Κυριακή
    v_is_sunday := (EXTRACT(DOW FROM v_today) = 0);
    
    IF v_is_sunday THEN
        -- Έλεγχος αν έχει ήδη γίνει refill σήμερα (κοιτάμε αν υπάρχει τουλάχιστον 1 refill)
        SELECT MAX(refill_date) INTO v_last_refill_date
        FROM public.ultimate_weekly_refills
        WHERE refill_date = v_today;
        
        IF v_last_refill_date IS NULL THEN
            -- Δεν έχει γίνει refill σήμερα, κάνε το τώρα
            PERFORM public.process_weekly_pilates_refills();
            RAISE NOTICE 'Sunday refill triggered automatically!';
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.check_and_trigger_sunday_refill() TO authenticated, service_role;

-- ========================================
-- MANUAL VERIFICATION
-- ========================================

SELECT 'Έλεγχος feature flag status:' as check_type;

SELECT 
    name,
    is_enabled,
    description,
    updated_at
FROM public.feature_flags 
WHERE name = 'weekly_pilates_refill_enabled';

SELECT 'Έλεγχος Ultimate χρηστών:' as check_type;

SELECT 
    COUNT(*) as total_ultimate_users,
    SUM(CASE WHEN source_package_name = 'Ultimate' THEN 1 ELSE 0 END) as ultimate_count,
    SUM(CASE WHEN source_package_name = 'Ultimate Medium' THEN 1 ELSE 0 END) as ultimate_medium_count
FROM public.memberships
WHERE source_package_name IN ('Ultimate', 'Ultimate Medium')
AND is_active = true
AND start_date <= CURRENT_DATE
AND end_date >= CURRENT_DATE;

-- ========================================
-- ΟΔΗΓΙΕΣ ΡΥΘΜΙΣΗΣ
-- ========================================

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT 'ΟΔΗΓΙΕΣ ΡΥΘΜΙΣΗΣ ΑΥΤΟΜΑΤΟΥ WEEKLY REFILL:' as title;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

SELECT 'ΕΠΙΛΟΓΗ A - Supabase Dashboard Cron (Απλή):' as option_a;
SELECT '  1. Πήγαινε στο Supabase Dashboard → Database → Cron Jobs' as step_a1;
SELECT '  2. Δημιούργησε νέο cron job με:' as step_a2;
SELECT '     Name: weekly-pilates-refill' as step_a3;
SELECT '     Schedule: 0 0 * * 0 (κάθε Κυριακή 00:00 UTC)' as step_a4;
SELECT '     Command: SELECT public.process_weekly_pilates_refills()' as step_a5;

SELECT '' as spacer;

SELECT 'ΕΠΙΛΟΓΗ B - External Cron Service (π.χ. cron-job.org):' as option_b;
SELECT '  1. Δημιούργησε account στο cron-job.org' as step_b1;
SELECT '  2. URL: https://[project-ref].supabase.co/functions/v1/weekly-pilates-refill?force=true' as step_b2;
SELECT '  3. Schedule: Κάθε Κυριακή 00:00' as step_b3;
SELECT '  4. Headers: Authorization: Bearer [SUPABASE_ANON_KEY]' as step_b4;

SELECT '' as spacer2;

SELECT 'ΕΠΙΛΟΓΗ C - Manual (Για testing):' as option_c;
SELECT '  Τρέξε: SELECT * FROM public.process_weekly_pilates_refills();' as step_c1;

SELECT '✅ Setup ολοκληρώθηκε!' as final_message;
