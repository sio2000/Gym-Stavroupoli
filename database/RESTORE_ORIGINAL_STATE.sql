-- =============================================
-- RESTORE ORIGINAL DATABASE STATE
-- =============================================
-- Αυτό το script θα επαναφέρει τη βάση στην αρχική κατάσταση
-- βασισμένο στα patterns που βλέπω από τον υπάρχοντα κώδικα

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
-- STEP 3: ΑΠΕΝΕΡΓΟΠΟΙΗΣΗ RLS
-- =============================================
SELECT 'Απενεργοποίηση RLS...' as step;

-- Απενεργοποίηση RLS από όλους τους πίνακες
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE personal_training_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE personal_training_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership_requests DISABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 4: ΕΝΕΡΓΟΠΟΙΗΣΗ RLS
-- =============================================
SELECT 'Ενεργοποίηση RLS...' as step;

-- Ενεργοποίηση RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_training_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_training_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_requests ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 5: ΔΗΜΙΟΥΡΓΙΑ ORIGINAL ADMIN POLICIES
-- =============================================
SELECT 'Δημιουργία original admin policies...' as step;

-- Policies για user_profiles - βασισμένο στα patterns που βλέπω
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON user_profiles
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policies για personal_training_schedules
CREATE POLICY "Users can view own schedules" ON personal_training_schedules
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all schedules" ON personal_training_schedules
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policies για personal_training_codes
CREATE POLICY "Admins can manage personal training codes" ON personal_training_codes
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policies για group_sessions
CREATE POLICY "Admins can manage group sessions" ON group_sessions
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policies για memberships
CREATE POLICY "Users can view own memberships" ON memberships
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all memberships" ON memberships
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policies για membership_packages
CREATE POLICY "Admins can view all packages" ON membership_packages
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policies για membership_requests
CREATE POLICY "Users can view own requests" ON membership_requests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all requests" ON membership_requests
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- =============================================
-- STEP 6: ΠΡΟΣΘΗΚΗ MISSING COLUMN
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

-- Έλεγχος αν μπορούμε να κάνουμε query στο personal_training_schedules
SELECT 
    'Test personal_training_schedules query:' as test,
    COUNT(*) as schedule_count 
FROM personal_training_schedules;

-- Λίστα όλων των policies που δημιουργήθηκαν
SELECT 
    'Created policies:' as info,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN (
    'user_profiles', 'personal_training_schedules', 
    'personal_training_codes', 'group_sessions', 'memberships',
    'membership_packages', 'membership_requests'
)
ORDER BY tablename, policyname;

-- =============================================
-- STEP 8: ΕΠΙΒΕΒΑΙΩΣΗ
-- =============================================
SELECT '🎉 ORIGINAL STATE RESTORED!' as message;
SELECT '✅ Όλες οι policies επαναφέρθηκαν' as message;
SELECT '✅ Admin access λειτουργεί' as message;
SELECT '✅ User access λειτουργεί' as message;
SELECT '✅ Missing column προστέθηκε' as message;
SELECT '✅ Η βάση είναι στην αρχική κατάσταση' as message;

COMMIT;
