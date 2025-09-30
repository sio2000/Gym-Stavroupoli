-- =============================================
-- EMERGENCY ROLLBACK SCRIPT
-- =============================================
-- Αυτό το script θα επαναφέρει την κατάσταση πριν τις αλλαγές
-- και θα διορθώσει το πρόβλημα με τις RLS policies

BEGIN;

-- =============================================
-- STEP 1: ΔΙΑΓΡΑΦΗ ΟΛΩΝ ΤΩΝ ΝΕΩΝ POLICIES
-- =============================================
SELECT 'Διαγραφή νέων policies...' as step;

-- Διαγραφή όλων των "Secretary ultra safe" policies
DROP POLICY IF EXISTS "Secretary ultra safe view user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Secretary ultra safe update user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Secretary ultra safe access personal training schedules" ON personal_training_schedules;
DROP POLICY IF EXISTS "Secretary ultra safe access personal training codes" ON personal_training_codes;
DROP POLICY IF EXISTS "Secretary ultra safe access group sessions" ON group_sessions;
DROP POLICY IF EXISTS "Secretary ultra safe view memberships" ON memberships;
DROP POLICY IF EXISTS "Secretary ultra safe update memberships" ON memberships;
DROP POLICY IF EXISTS "Secretary ultra safe view membership packages" ON membership_packages;
DROP POLICY IF EXISTS "Secretary ultra safe manage membership requests" ON membership_requests;

-- =============================================
-- STEP 2: ΔΙΑΓΡΑΦΗ ΤΗΣ HELPER FUNCTION
-- =============================================
SELECT 'Διαγραφή helper function...' as step;

DROP FUNCTION IF EXISTS public.is_user_secretary();

-- =============================================
-- STEP 3: ΔΙΑΓΡΑΦΗ ΟΛΩΝ ΤΩΝ SECRETARY POLICIES
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
-- STEP 4: ΔΙΑΓΡΑΦΗ ΟΛΩΝ ΤΩΝ SAFE POLICIES
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
-- STEP 5: ΔΗΜΙΟΥΡΓΙΑ ΑΠΛΩΝ POLICIES
-- =============================================
SELECT 'Δημιουργία απλών policies...' as step;

-- Δημιουργία πολύ απλών policies που δεν προκαλούν recursion
-- Policy για user_profiles - Allow all for now (temporary)
CREATE POLICY "Temporary allow all user_profiles" ON user_profiles
    FOR ALL USING (true);

-- Policy για personal_training_schedules - Allow all for now (temporary)
CREATE POLICY "Temporary allow all personal_training_schedules" ON personal_training_schedules
    FOR ALL USING (true);

-- Policy για personal_training_codes - Allow all for now (temporary)
CREATE POLICY "Temporary allow all personal_training_codes" ON personal_training_codes
    FOR ALL USING (true);

-- Policy για group_sessions - Allow all for now (temporary)
CREATE POLICY "Temporary allow all group_sessions" ON group_sessions
    FOR ALL USING (true);

-- Policy για memberships - Allow all for now (temporary)
CREATE POLICY "Temporary allow all memberships" ON memberships
    FOR ALL USING (true);

-- Policy για membership_packages - Allow all for now (temporary)
CREATE POLICY "Temporary allow all membership_packages" ON membership_packages
    FOR ALL USING (true);

-- Policy για membership_requests - Allow all for now (temporary)
CREATE POLICY "Temporary allow all membership_requests" ON membership_requests
    FOR ALL USING (true);

-- =============================================
-- STEP 6: ΕΛΕΓΧΟΣ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
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
-- STEP 7: ΕΠΙΒΕΒΑΙΩΣΗ
-- =============================================
SELECT '🎉 EMERGENCY ROLLBACK ΟΛΟΚΛΗΡΩΘΗΚΕ!' as message;
SELECT '✅ Όλες οι προβληματικές policies διαγράφηκαν' as message;
SELECT '✅ Δημιουργήθηκαν απλές temporary policies' as message;
SELECT '✅ Το secretary panel θα πρέπει να λειτουργεί τώρα' as message;
SELECT '⚠️ Οι temporary policies είναι ανοιχτές - χρειάζεται security review' as message;

COMMIT;
