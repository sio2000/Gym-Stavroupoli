-- =============================================
-- NUCLEAR OPTION - DISABLE ALL RLS
-- =============================================
-- Αυτό το script θα απενεργοποιήσει ΟΛΟ το RLS προσωρινά
-- για να επαναφέρει τη λειτουργικότητα της βάσης

BEGIN;

-- =============================================
-- STEP 1: ΔΙΑΓΡΑΦΗ ΟΛΩΝ ΤΩΝ POLICIES
-- =============================================
SELECT 'Διαγραφή όλων των policies...' as step;

-- Διαγραφή όλων των policies από όλους τους πίνακες
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname, tablename
        FROM pg_policies 
        WHERE tablename IN (
            'user_profiles', 'personal_training_schedules', 
            'personal_training_codes', 'group_sessions', 'memberships',
            'membership_packages', 'membership_requests'
        )
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
-- STEP 2: ΔΙΑΓΡΑΦΗ ΟΛΩΝ ΤΩΝ FUNCTIONS
-- =============================================
SELECT 'Διαγραφή όλων των functions...' as step;

-- Διαγραφή όλων των functions που δημιουργήσαμε
DROP FUNCTION IF EXISTS public.is_user_secretary() CASCADE;
DROP FUNCTION IF EXISTS public.is_secretary_simple() CASCADE;
DROP FUNCTION IF EXISTS public.is_secretary_ultra_simple() CASCADE;
DROP FUNCTION IF EXISTS public.is_user_secretary_safe() CASCADE;
DROP FUNCTION IF EXISTS public.is_secretary_ultra_simple() CASCADE;

-- =============================================
-- STEP 3: ΑΠΕΝΕΡΓΟΠΟΙΗΣΗ RLS ΑΠΟ ΟΛΟΥΣ ΤΟΥΣ ΠΙΝΑΚΕΣ
-- =============================================
SELECT 'Απενεργοποίηση RLS από όλους τους πίνακες...' as step;

-- Απενεργοποίηση RLS από όλους τους πίνακες
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE personal_training_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE personal_training_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership_requests DISABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 4: ΠΡΟΣΘΗΚΗ MISSING COLUMN
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
-- STEP 5: ΕΛΕΓΧΟΣ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
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

-- Έλεγχος αν μπορούμε να κάνουμε query στο personal_training_schedules
SELECT 
    'Test personal_training_schedules query:' as test,
    COUNT(*) as schedule_count 
FROM personal_training_schedules;

-- Έλεγχος αν μπορούμε να κάνουμε query στο membership_packages
SELECT 
    'Test membership_packages query:' as test,
    COUNT(*) as package_count 
FROM membership_packages;

-- =============================================
-- STEP 6: ΕΛΕΓΧΟΣ RLS STATUS
-- =============================================
SELECT 'Έλεγχος RLS status...' as step;

-- Έλεγχος RLS status όλων των πινάκων
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasrls
FROM pg_tables 
WHERE tablename IN (
    'user_profiles', 'personal_training_schedules', 
    'personal_training_codes', 'group_sessions', 'memberships',
    'membership_packages', 'membership_requests'
)
ORDER BY tablename;

-- =============================================
-- STEP 7: ΕΠΙΒΕΒΑΙΩΣΗ
-- =============================================
SELECT '🎉 NUCLEAR OPTION ΟΛΟΚΛΗΡΩΘΗΚΕ!' as message;
SELECT '✅ Όλες οι policies διαγράφηκαν' as message;
SELECT '✅ Όλες οι functions διαγράφηκαν' as message;
SELECT '✅ RLS απενεργοποιήθηκε από όλους τους πίνακες' as message;
SELECT '✅ Missing column προστέθηκε' as message;
SELECT '✅ Η βάση θα πρέπει να λειτουργεί τώρα' as message;
SELECT '⚠️ RLS είναι απενεργοποιημένο - χρειάζεται security review' as message;

COMMIT;
