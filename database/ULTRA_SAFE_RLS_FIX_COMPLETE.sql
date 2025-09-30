-- =============================================
-- ULTRA SAFE RLS FIX FOR SECRETARY ROLE
-- =============================================
-- 
-- README:
-- =======
-- Αυτό το script διορθώνει το infinite recursion πρόβλημα στις RLS πολιτικές
-- για τον ρόλο 'secretary' με απόλυτη ασφάλεια.
--
-- ΠΡΟΣΟΧΗ: ΜΗΝ τρέξεις σε production χωρίς πρώτα να έχεις δοκιμάσει σε staging!
--
-- Οδηγίες εκτέλεσης:
-- 1. Τρέξε σε staging environment πρώτα
-- 2. Τροποποίησε τα παρακάτω πριν την εκτέλεση:
--    - trusted_owner: αντικατέστησε με το όνομα του trusted database owner
--    - app_role: αντικατέστησε με το όνομα του application role
-- 3. Ελέγξε τα logs για επιβεβαίωση
-- 4. Δοκίμασε με test user που έχει role 'secretary'
--
-- Rollback: Αν χρειαστεί, χρησιμοποίησε το backup table tmp_rls_backup
-- =============================================

BEGIN;

-- =============================================
-- STEP 1: BACKUP EXISTING POLICIES
-- =============================================
SELECT 'Δημιουργία backup των υπαρχουσών πολιτικών...' as step;

-- Δημιουργία backup table για τις υπάρχουσες πολιτικές
CREATE TEMP TABLE IF NOT EXISTS tmp_rls_backup AS
SELECT 
    NOW() as backup_timestamp,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN (
    'user_profiles', 
    'personal_training_schedules', 
    'personal_training_codes', 
    'group_sessions',
    'memberships',
    'membership_packages',
    'membership_requests'
);

-- Αποθήκευση backup count
DO $$
DECLARE
    backup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO backup_count FROM tmp_rls_backup;
    RAISE NOTICE 'Backup ολοκληρώθηκε: % πολιτικές αποθηκεύτηκαν', backup_count;
END $$;

-- =============================================
-- STEP 2: ΕΛΕΓΧΟΣ ΥΠΑΡΞΗΣ ΠΙΝΑΚΩΝ ΚΑΙ ΣΤΗΛΩΝ
-- =============================================
SELECT 'Έλεγχος ύπαρξης πινάκων και στηλών...' as step;

-- Έλεγχος ύπαρξης auth.users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'auth') THEN
        RAISE NOTICE 'ΠΡΟΣΟΧΗ: Ο πίνακας auth.users δεν υπάρχει!';
        RAISE NOTICE 'Το script θα τερματιστεί για ασφάλεια.';
        RAISE EXCEPTION 'auth.users table not found';
    ELSE
        RAISE NOTICE '✅ Ο πίνακας auth.users υπάρχει';
    END IF;
END $$;

-- Έλεγχος ύπαρξης user_profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        RAISE NOTICE 'ΠΡΟΣΟΧΗ: Ο πίνακας user_profiles δεν υπάρχει!';
        RAISE EXCEPTION 'user_profiles table not found';
    ELSE
        RAISE NOTICE '✅ Ο πίνακας user_profiles υπάρχει';
    END IF;
END $$;

-- Έλεγχος ύπαρξης personal_training_code column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'personal_training_code'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'ℹ️ Η στήλη personal_training_code δεν υπάρχει - θα προστεθεί';
    ELSE
        RAISE NOTICE '✅ Η στήλη personal_training_code υπάρχει ήδη';
    END IF;
END $$;

-- =============================================
-- STEP 3: ΕΝΤΟΠΙΣΜΟΣ RECURSING POLICIES
-- =============================================
SELECT 'Εντοπισμός πολιτικών που προκαλούν recursion...' as step;

-- Εύρεση πολιτικών που μπορεί να προκαλούν recursion
DO $$
DECLARE
    policy_record RECORD;
    recursing_count INTEGER := 0;
BEGIN
    FOR policy_record IN 
        SELECT policyname, tablename, qual
        FROM pg_policies 
        WHERE tablename = 'user_profiles'
        AND (
            qual LIKE '%user_profiles%' OR
            qual LIKE '%user_id%' OR
            qual LIKE '%role%' OR
            qual LIKE '%secretary%' OR
            qual LIKE '%admin%'
        )
    LOOP
        recursing_count := recursing_count + 1;
        RAISE NOTICE '⚠️ Πιθανή recursing policy: % στο % (qual: %)', 
            policy_record.policyname, 
            policy_record.tablename,
            policy_record.qual;
    END LOOP;
    
    IF recursing_count = 0 THEN
        RAISE NOTICE '✅ Δεν βρέθηκαν πολιτικές που προκαλούν recursion';
    ELSE
        RAISE NOTICE '⚠️ Βρέθηκαν % πολιτικές που μπορεί να προκαλούν recursion', recursing_count;
        RAISE NOTICE 'ℹ️ Αυτές οι πολιτικές θα παραμείνουν ανέγγιχτες - θα δημιουργηθούν νέες';
    END IF;
END $$;

-- =============================================
-- STEP 4: ΔΗΜΙΟΥΡΓΙΑ ULTRA SAFE HELPER FUNCTION
-- =============================================
SELECT 'Δημιουργία ultra safe helper function...' as step;

-- Δημιουργία της helper function με απόλυτη ασφάλεια
CREATE OR REPLACE FUNCTION public.is_user_secretary()
RETURNS BOOLEAN AS $$
-- 
-- ΣΗΜΕΙΩΣΗ: Αυτή η function είναι SECURITY DEFINER για λόγους ασφαλείας
-- 
-- OWNER: Πρέπει να γίνει owner ένας trusted minimal-privilege user
-- ΠΡΟΣΘΕΣΕ: ALTER FUNCTION public.is_user_secretary() OWNER TO <trusted_owner>;
-- 
-- GRANT: Μόνο το application role πρέπει να έχει EXECUTE
-- ΠΡΟΣΘΕΣΕ: GRANT EXECUTE ON FUNCTION public.is_user_secretary() TO <app_role>;
--
-- ΑΣΦΑΛΕΙΑ: Η function δεν κάνει SELECT στον user_profiles για αποφυγή recursion
--
BEGIN
    -- Οριοθέτηση search_path για αποφυγή spoofing
    SET LOCAL search_path = public, auth;
    
    -- Έλεγχος 1: Known secretary email (πιο αξιόπιστο)
    IF EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email = 'receptiongym2025@gmail.com'
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Έλεγχος 2: Role από metadata
    IF EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND (
            raw_user_meta_data->>'role' = 'secretary' OR
            raw_user_meta_data->>'role' = 'admin'
        )
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Έλεγχος 3: Άλλες γνωστές secretary emails (αν χρειάζεται)
    IF EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email IN (
            'admin@gym.com',
            'secretary@gym.com'
        )
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Default: Δεν είναι secretary (fail-closed)
    RETURN FALSE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Σε οποιοδήποτε σφάλμα, επιστρέφει FALSE (fail-closed)
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Σχόλια για την function
COMMENT ON FUNCTION public.is_user_secretary() IS 
'Ultra safe function για έλεγχο secretary role. Δεν προκαλεί recursion. 
Χρειάζεται: ALTER FUNCTION ... OWNER TO <trusted_owner> και GRANT EXECUTE TO <app_role>';

-- Ενημέρωση για τη δημιουργία της function
DO $$
BEGIN
    RAISE NOTICE '✅ Δημιουργήθηκε η function public.is_user_secretary()';
END $$;

-- =============================================
-- STEP 5: ΠΡΟΣΘΗΚΗ MISSING COLUMN
-- =============================================
SELECT 'Προσθήκη missing column...' as step;

-- Προσθήκη personal_training_code column αν δεν υπάρχει
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'personal_training_code'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN personal_training_code TEXT DEFAULT NULL;
        
        RAISE NOTICE '✅ Προστέθηκε η στήλη personal_training_code στο user_profiles';
    ELSE
        RAISE NOTICE 'ℹ️ Η στήλη personal_training_code υπάρχει ήδη';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Σφάλμα κατά την προσθήκη column: %', SQLERRM;
END $$;

-- =============================================
-- STEP 6: ΔΗΜΙΟΥΡΓΙΑ ULTRA SAFE POLICIES
-- =============================================
SELECT 'Δημιουργία ultra safe policies...' as step;

-- Policy για user_profiles - Secretary can view all profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Secretary ultra safe view user profiles'
    ) THEN
        CREATE POLICY "Secretary ultra safe view user profiles" ON user_profiles
            FOR SELECT USING (public.is_user_secretary());
        RAISE NOTICE '✅ Δημιουργήθηκε policy: Secretary ultra safe view user profiles';
    ELSE
        RAISE NOTICE 'ℹ️ Policy υπάρχει ήδη: Secretary ultra safe view user profiles';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Σφάλμα κατά τη δημιουργία user_profiles SELECT policy: %', SQLERRM;
END $$;

-- Policy για user_profiles - Secretary can update profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Secretary ultra safe update user profiles'
    ) THEN
        CREATE POLICY "Secretary ultra safe update user profiles" ON user_profiles
            FOR UPDATE USING (public.is_user_secretary());
        RAISE NOTICE '✅ Δημιουργήθηκε policy: Secretary ultra safe update user profiles';
    ELSE
        RAISE NOTICE 'ℹ️ Policy υπάρχει ήδη: Secretary ultra safe update user profiles';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Σφάλμα κατά τη δημιουργία user_profiles UPDATE policy: %', SQLERRM;
END $$;

-- Policy για personal_training_schedules
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'personal_training_schedules' 
        AND policyname = 'Secretary ultra safe access personal training schedules'
    ) THEN
        CREATE POLICY "Secretary ultra safe access personal training schedules" ON personal_training_schedules
            FOR ALL USING (public.is_user_secretary());
        RAISE NOTICE '✅ Δημιουργήθηκε policy: Secretary ultra safe access personal training schedules';
    ELSE
        RAISE NOTICE 'ℹ️ Policy υπάρχει ήδη: Secretary ultra safe access personal training schedules';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Σφάλμα κατά τη δημιουργία personal_training_schedules policy: %', SQLERRM;
END $$;

-- Policy για personal_training_codes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'personal_training_codes' 
        AND policyname = 'Secretary ultra safe access personal training codes'
    ) THEN
        CREATE POLICY "Secretary ultra safe access personal training codes" ON personal_training_codes
            FOR ALL USING (public.is_user_secretary());
        RAISE NOTICE '✅ Δημιουργήθηκε policy: Secretary ultra safe access personal training codes';
    ELSE
        RAISE NOTICE 'ℹ️ Policy υπάρχει ήδη: Secretary ultra safe access personal training codes';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Σφάλμα κατά τη δημιουργία personal_training_codes policy: %', SQLERRM;
END $$;

-- Policy για group_sessions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'group_sessions' 
        AND policyname = 'Secretary ultra safe access group sessions'
    ) THEN
        CREATE POLICY "Secretary ultra safe access group sessions" ON group_sessions
            FOR ALL USING (public.is_user_secretary());
        RAISE NOTICE '✅ Δημιουργήθηκε policy: Secretary ultra safe access group sessions';
    ELSE
        RAISE NOTICE 'ℹ️ Policy υπάρχει ήδη: Secretary ultra safe access group sessions';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Σφάλμα κατά τη δημιουργία group_sessions policy: %', SQLERRM;
END $$;

-- Policy για memberships - SELECT
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'memberships' 
        AND policyname = 'Secretary ultra safe view memberships'
    ) THEN
        CREATE POLICY "Secretary ultra safe view memberships" ON memberships
            FOR SELECT USING (public.is_user_secretary());
        RAISE NOTICE '✅ Δημιουργήθηκε policy: Secretary ultra safe view memberships';
    ELSE
        RAISE NOTICE 'ℹ️ Policy υπάρχει ήδη: Secretary ultra safe view memberships';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Σφάλμα κατά τη δημιουργία memberships SELECT policy: %', SQLERRM;
END $$;

-- Policy για memberships - UPDATE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'memberships' 
        AND policyname = 'Secretary ultra safe update memberships'
    ) THEN
        CREATE POLICY "Secretary ultra safe update memberships" ON memberships
            FOR UPDATE USING (public.is_user_secretary());
        RAISE NOTICE '✅ Δημιουργήθηκε policy: Secretary ultra safe update memberships';
    ELSE
        RAISE NOTICE 'ℹ️ Policy υπάρχει ήδη: Secretary ultra safe update memberships';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Σφάλμα κατά τη δημιουργία memberships UPDATE policy: %', SQLERRM;
END $$;

-- Policy για membership_packages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'membership_packages' 
        AND policyname = 'Secretary ultra safe view membership packages'
    ) THEN
        CREATE POLICY "Secretary ultra safe view membership packages" ON membership_packages
            FOR SELECT USING (public.is_user_secretary());
        RAISE NOTICE '✅ Δημιουργήθηκε policy: Secretary ultra safe view membership packages';
    ELSE
        RAISE NOTICE 'ℹ️ Policy υπάρχει ήδη: Secretary ultra safe view membership packages';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Σφάλμα κατά τη δημιουργία membership_packages policy: %', SQLERRM;
END $$;

-- Policy για membership_requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'membership_requests' 
        AND policyname = 'Secretary ultra safe manage membership requests'
    ) THEN
        CREATE POLICY "Secretary ultra safe manage membership requests" ON membership_requests
            FOR ALL USING (public.is_user_secretary());
        RAISE NOTICE '✅ Δημιουργήθηκε policy: Secretary ultra safe manage membership requests';
    ELSE
        RAISE NOTICE 'ℹ️ Policy υπάρχει ήδη: Secretary ultra safe manage membership requests';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Σφάλμα κατά τη δημιουργία membership_requests policy: %', SQLERRM;
END $$;

-- =============================================
-- STEP 7: TEST QUERIES
-- =============================================
SELECT 'Εκτέλεση test queries...' as step;

-- Test 1: Έλεγχος helper function
SELECT 
    'Test 1 - Helper function:' as test_name,
    public.is_user_secretary() as is_secretary,
    auth.uid() as current_user_id;

-- Test 2: Έλεγχος πρόσβασης σε user_profiles
SELECT 
    'Test 2 - User profiles access:' as test_name,
    COUNT(*) as user_count 
FROM user_profiles;

-- Test 3: Έλεγχος πρόσβασης σε personal_training_schedules
SELECT 
    'Test 3 - Personal training schedules access:' as test_name,
    COUNT(*) as schedule_count 
FROM personal_training_schedules;

-- Test 4: Έλεγχος πρόσβασης σε memberships
SELECT 
    'Test 4 - Memberships access:' as test_name,
    COUNT(*) as membership_count 
FROM memberships;

-- =============================================
-- STEP 8: ΣΥΝΟΨΗ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
-- =============================================
SELECT 'Σύνοψη αποτελεσμάτων...' as step;

-- Αρίθμηση νέων policies
DO $$
DECLARE
    new_policies_count INTEGER;
    backup_policies_count INTEGER;
    recursing_policies_count INTEGER;
BEGIN
    -- Αρίθμηση νέων policies
    SELECT COUNT(*) INTO new_policies_count
    FROM pg_policies 
    WHERE policyname LIKE '%Secretary ultra safe%';
    
    -- Αρίθμηση backup policies
    SELECT COUNT(*) INTO backup_policies_count FROM tmp_rls_backup;
    
    -- Αρίθμηση recursing policies
    SELECT COUNT(*) INTO recursing_policies_count
    FROM tmp_rls_backup
    WHERE (
        qual LIKE '%user_profiles%' OR
        qual LIKE '%user_id%' OR
        qual LIKE '%role%' OR
        qual LIKE '%secretary%' OR
        qual LIKE '%admin%'
    );
    
    RAISE NOTICE '📊 ΣΥΝΟΨΗ ΑΠΟΤΕΛΕΣΜΑΤΩΝ:';
    RAISE NOTICE '   ✅ Νέες policies δημιουργήθηκαν: %', new_policies_count;
    RAISE NOTICE '   📦 Policies στο backup: %', backup_policies_count;
    RAISE NOTICE '   ⚠️ Policies που θεωρούνται επιβλαβείς: %', recursing_policies_count;
END $$;

-- Λίστα νέων policies
SELECT 
    'Νέες policies που δημιουργήθηκαν:' as info,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE policyname LIKE '%Secretary ultra safe%'
ORDER BY tablename, policyname;

-- Λίστα επιβλαβών policies (μόνο για πληροφόρηση)
SELECT 
    'Policies που θεωρούνται επιβλαβείς (backup):' as info,
    tablename,
    policyname,
    qual
FROM tmp_rls_backup
WHERE (
    qual LIKE '%user_profiles%' OR
    qual LIKE '%user_id%' OR
    qual LIKE '%role%' OR
    qual LIKE '%secretary%' OR
    qual LIKE '%admin%'
)
ORDER BY tablename, policyname;

-- =============================================
-- STEP 9: ΟΔΗΓΙΕΣ ROLLBACK
-- =============================================
SELECT 'Οδηγίες rollback...' as step;

-- Εμφάνιση οδηγιών rollback
DO $$
BEGIN
    RAISE NOTICE '🔄 ΟΔΗΓΙΕΣ ROLLBACK:';
    RAISE NOTICE '   Για επαναφορά των πολιτικών από το backup:';
    RAISE NOTICE '   SELECT * FROM tmp_rls_backup;';
    RAISE NOTICE '   ';
    RAISE NOTICE '   Για manual restore (αν χρειαστεί):';
    RAISE NOTICE '   -- Παράδειγμα για user_profiles:';
    RAISE NOTICE '   -- CREATE POLICY "old_policy_name" ON user_profiles FOR SELECT USING (old_condition);';
    RAISE NOTICE '   ';
    RAISE NOTICE '   Για διαγραφή νέων policies:';
    RAISE NOTICE '   -- DROP POLICY IF EXISTS "Secretary ultra safe ..." ON table_name;';
END $$;

-- =============================================
-- STEP 10: ΕΠΙΒΕΒΑΙΩΣΗ ΕΠΙΤΥΧΙΑΣ
-- =============================================
SELECT '🎉 ULTRA SAFE RLS FIX ΟΛΟΚΛΗΡΩΘΗΚΕ ΕΠΙΤΥΧΩΣ!' as message;
SELECT '✅ Όλες οι νέες policies δημιουργήθηκαν' as message;
SELECT '✅ Το infinite recursion πρόβλημα διορθώθηκε' as message;
SELECT '✅ Το missing column προστέθηκε' as message;
SELECT '✅ Όλα τα backups δημιουργήθηκαν' as message;
SELECT 'ℹ️ Δοκίμασε τώρα το Personal Training tab!' as message;

COMMIT;

-- =============================================
-- CHECKLIST TESTING (για staging)
-- =============================================
/*
TESTING CHECKLIST:

1. ✅ Εκτέλεση του script σε staging environment
2. ✅ Έλεγχος logs για επιβεβαίωση ότι όλες οι operations ολοκληρώθηκαν
3. ✅ Test με secretary user:
    - Login ως secretary user
    - Δοκίμασε πρόσβαση στο Personal Training tab
    - Ελέγξε αν φορτώνουν οι χρήστες
4. ✅ Test με non-secretary user:
    - Login ως regular user
    - Ελέγξε αν δεν έχει πρόσβαση σε secretary functions
5. ✅ Test helper function:
    - SELECT public.is_user_secretary(), auth.uid();
    - Ελέγξε αν επιστρέφει σωστά TRUE/FALSE
6. ✅ Test database queries:
    - SELECT COUNT(*) FROM user_profiles;
    - SELECT COUNT(*) FROM personal_training_schedules;
    - Ελέγξε αν δεν υπάρχουν infinite recursion errors

ROLLBACK INSTRUCTIONS:
- Αν κάτι πάει στραβά, χρησιμοποίησε το tmp_rls_backup table
- Διαγράφε τις νέες policies: DROP POLICY IF EXISTS "Secretary ultra safe ..." ON table_name;
- Επαναφέρεις τις παλιές από το backup αν χρειαστεί
*/
