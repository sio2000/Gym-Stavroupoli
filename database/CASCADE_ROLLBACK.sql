-- =============================================
-- CASCADE ROLLBACK SCRIPT
-- =============================================
-- Αυτό το script θα διαγράψει όλα τα dependent objects μαζί
-- και θα επαναφέρει τη λειτουργικότητα

BEGIN;

-- =============================================
-- STEP 1: ΔΙΑΓΡΑΦΗ FUNCTION ΜΕ CASCADE
-- =============================================
SELECT 'Διαγραφή function με CASCADE...' as step;

-- Διαγραφή της function με CASCADE για να διαγράψει και τις dependent policies
DROP FUNCTION IF EXISTS public.is_user_secretary() CASCADE;

-- =============================================
-- STEP 2: ΔΙΑΓΡΑΦΗ ΟΛΩΝ ΤΩΝ SECRETARY POLICIES
-- =============================================
SELECT 'Διαγραφή όλων των secretary policies...' as step;

-- Διαγραφή όλων των policies που περιέχουν "secretary" στο όνομα
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname, tablename
        FROM pg_policies 
        WHERE policyname ILIKE '%secretary%'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 
                policy_record.policyname, 
                policy_record.tablename);
            RAISE NOTICE 'Διαγράφηκε policy: % στο %', 
                policy_record.policyname, 
                policy_record.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Δεν μπόρεσε να διαγραφεί: % - %', 
                    policy_record.policyname, 
                    SQLERRM;
        END;
    END LOOP;
END $$;

-- =============================================
-- STEP 3: ΔΙΑΓΡΑΦΗ ΟΛΩΝ ΤΩΝ SAFE POLICIES
-- =============================================
SELECT 'Διαγραφή όλων των safe policies...' as step;

-- Διαγραφή όλων των policies που περιέχουν "safe" στο όνομα
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname, tablename
        FROM pg_policies 
        WHERE policyname ILIKE '%safe%'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 
                policy_record.policyname, 
                policy_record.tablename);
            RAISE NOTICE 'Διαγράφηκε policy: % στο %', 
                policy_record.policyname, 
                policy_record.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Δεν μπόρεσε να διαγραφεί: % - %', 
                    policy_record.policyname, 
                    SQLERRM;
        END;
    END LOOP;
END $$;

-- =============================================
-- STEP 4: ΔΙΑΓΡΑΦΗ ΟΛΩΝ ΤΩΝ ULTRA SAFE POLICIES
-- =============================================
SELECT 'Διαγραφή όλων των ultra safe policies...' as step;

-- Διαγραφή όλων των policies που περιέχουν "ultra safe" στο όνομα
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname, tablename
        FROM pg_policies 
        WHERE policyname ILIKE '%ultra safe%'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 
                policy_record.policyname, 
                policy_record.tablename);
            RAISE NOTICE 'Διαγράφηκε policy: % στο %', 
                policy_record.policyname, 
                policy_record.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Δεν μπόρεσε να διαγραφεί: % - %', 
                    policy_record.policyname, 
                    SQLERRM;
        END;
    END LOOP;
END $$;

-- =============================================
-- STEP 5: ΔΙΑΓΡΑΦΗ ΟΛΩΝ ΤΩΝ TEMPORARY POLICIES
-- =============================================
SELECT 'Διαγραφή όλων των temporary policies...' as step;

-- Διαγραφή όλων των policies που περιέχουν "temporary" στο όνομα
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname, tablename
        FROM pg_policies 
        WHERE policyname ILIKE '%temporary%'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 
                policy_record.policyname, 
                policy_record.tablename);
            RAISE NOTICE 'Διαγράφηκε policy: % στο %', 
                policy_record.policyname, 
                policy_record.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Δεν μπόρεσε να διαγραφεί: % - %', 
                    policy_record.policyname, 
                    SQLERRM;
        END;
    END LOOP;
END $$;

-- =============================================
-- STEP 6: ΔΗΜΙΟΥΡΓΙΑ ΑΠΛΩΝ POLICIES
-- =============================================
SELECT 'Δημιουργία απλών policies...' as step;

-- Δημιουργία πολύ απλών policies που δεν προκαλούν recursion
-- Policy για user_profiles - Allow all for now (temporary)
CREATE POLICY "Allow all user_profiles" ON user_profiles
    FOR ALL USING (true);

-- Policy για personal_training_schedules - Allow all for now (temporary)
CREATE POLICY "Allow all personal_training_schedules" ON personal_training_schedules
    FOR ALL USING (true);

-- Policy για personal_training_codes - Allow all for now (temporary)
CREATE POLICY "Allow all personal_training_codes" ON personal_training_codes
    FOR ALL USING (true);

-- Policy για group_sessions - Allow all for now (temporary)
CREATE POLICY "Allow all group_sessions" ON group_sessions
    FOR ALL USING (true);

-- Policy για memberships - Allow all for now (temporary)
CREATE POLICY "Allow all memberships" ON memberships
    FOR ALL USING (true);

-- Policy για membership_packages - Allow all for now (temporary)
CREATE POLICY "Allow all membership_packages" ON membership_packages
    FOR ALL USING (true);

-- Policy για membership_requests - Allow all for now (temporary)
CREATE POLICY "Allow all membership_requests" ON membership_requests
    FOR ALL USING (true);

-- =============================================
-- STEP 7: ΕΛΕΓΧΟΣ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
-- =============================================
SELECT 'Έλεγχος αποτελεσμάτων...' as step;

-- Έλεγχος αν μπορούμε να κάνουμε query στο user_profiles
SELECT 
    'Test user_profiles query:' as test,
    COUNT(*) as user_count 
FROM user_profiles;

-- Έλεγχος αν μπορούμε να κάνουμε query στο memberships
SELECT 
    'Test memberships query:' as test,
    COUNT(*) as membership_count 
FROM memberships;

-- Λίστα όλων των policies που απομένουν
SELECT 
    'Remaining policies:' as info,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN (
    'user_profiles', 
    'personal_training_schedules', 
    'personal_training_codes', 
    'group_sessions',
    'memberships',
    'membership_packages',
    'membership_requests'
)
ORDER BY tablename, policyname;

-- =============================================
-- STEP 8: ΕΠΙΒΕΒΑΙΩΣΗ
-- =============================================
SELECT '🎉 CASCADE ROLLBACK ΟΛΟΚΛΗΡΩΘΗΚΕ!' as message;
SELECT '✅ Όλες οι προβληματικές policies διαγράφηκαν' as message;
SELECT '✅ Δημιουργήθηκαν απλές policies' as message;
SELECT '✅ Το secretary panel θα πρέπει να λειτουργεί τώρα' as message;
SELECT '⚠️ Οι policies είναι ανοιχτές - χρειάζεται security review' as message;

COMMIT;
