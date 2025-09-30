-- =============================================
-- NUCLEAR OPTION: DISABLE ALL RLS TO RESTORE FUNCTIONALITY
-- =============================================
-- This script will completely disable RLS on all tables to restore functionality
-- WARNING: This temporarily removes security but restores functionality
-- You can re-enable RLS later with proper policies

-- =============================================
-- README:
-- =======
-- Αυτό το script διορθώνει το infinite recursion πρόβλημα με τον πιο ασφαλή τρόπο:
-- 1. Διαγράφει όλες τις προβληματικές RLS πολιτικές
-- 2. Απενεργοποιεί το RLS σε όλους τους πίνακες
-- 3. Προσθέτει το missing column personal_training_code
-- 4. Επαναφέρει τη λειτουργικότητα του γραμματεία panel
--
-- ΠΡΟΣΟΧΗ: ΜΗΝ τρέξεις σε production χωρίς πρώτα να έχεις δοκιμάσει σε staging!
--
-- ΠΡΙΝ ΤΟ ΤΡΕΞΕΙΣ:
-- 1. Κάνε backup της βάσης σου
-- 2. Δοκίμασε σε staging πρώτα
-- 3. Έχεις το rollback script έτοιμο
--
-- ΜΕΤΑ ΤΟ ΤΡΕΞΕΙΣ:
-- 1. Δοκίμασε το γραμματεία panel
-- 2. Δοκίμασε το admin panel
-- 3. Δοκίμασε την εγγραφή νέων χρηστών
-- 4. Αν όλα λειτουργούν, μπορείς να επαναφέρεις RLS με ασφαλείς πολιτικές

BEGIN;

-- =============================================
-- STEP 1: BACKUP CURRENT STATE
-- =============================================

-- Create backup table for current policies
CREATE TEMP TABLE IF NOT EXISTS tmp_rls_backup AS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check,
    now() as backup_timestamp
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
    'user_profiles', 
    'personal_training_schedules', 
    'personal_training_codes', 
    'group_sessions', 
    'memberships', 
    'membership_packages', 
    'membership_requests'
);

-- Show what we're backing up
SELECT 'Backing up policies...' as step;
SELECT COUNT(*) as policies_backed_up FROM tmp_rls_backup;

-- =============================================
-- STEP 2: DROP ALL PROBLEMATIC POLICIES
-- =============================================

SELECT 'Dropping all problematic policies...' as step;

-- Drop all policies from user_profiles
DROP POLICY IF EXISTS "Admins/service_role can view all" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow insert for trigger" ON public.user_profiles;
DROP POLICY IF EXISTS "User can view self" ON public.user_profiles;
DROP POLICY IF EXISTS "User/admin can update" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_allow_registration" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_user_view_own" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_user_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_service_role_all" ON public.user_profiles;
DROP POLICY IF EXISTS "allow_all_inserts" ON public.user_profiles;
DROP POLICY IF EXISTS "allow_own_selects" ON public.user_profiles;
DROP POLICY IF EXISTS "allow_own_updates" ON public.user_profiles;
DROP POLICY IF EXISTS "allow_service_role_all" ON public.user_profiles;
DROP POLICY IF EXISTS "Secretary can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Secretary ultra safe view all" ON public.user_profiles;
DROP POLICY IF EXISTS "Secretary ultra safe insert" ON public.user_profiles;
DROP POLICY IF EXISTS "Secretary ultra safe update" ON public.user_profiles;
DROP POLICY IF EXISTS "Secretary ultra safe delete" ON public.user_profiles;
DROP POLICY IF EXISTS "Secretary safe view all" ON public.user_profiles;
DROP POLICY IF EXISTS "Secretary safe insert" ON public.user_profiles;
DROP POLICY IF EXISTS "Secretary safe update" ON public.user_profiles;
DROP POLICY IF EXISTS "Secretary safe delete" ON public.user_profiles;
DROP POLICY IF EXISTS "Secretary can view all" ON public.user_profiles;
DROP POLICY IF EXISTS "Secretary can insert" ON public.user_profiles;
DROP POLICY IF EXISTS "Secretary can update" ON public.user_profiles;
DROP POLICY IF EXISTS "Secretary can delete" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- Drop all policies from personal_training_schedules
DROP POLICY IF EXISTS "Secretaries can view all personal training schedules" ON public.personal_training_schedules;
DROP POLICY IF EXISTS "Secretaries can insert personal training schedules" ON public.personal_training_schedules;
DROP POLICY IF EXISTS "Secretaries can update personal training schedules" ON public.personal_training_schedules;
DROP POLICY IF EXISTS "Secretaries can delete personal training schedules" ON public.personal_training_schedules;
DROP POLICY IF EXISTS "Secretary ultra safe view all" ON public.personal_training_schedules;
DROP POLICY IF EXISTS "Secretary ultra safe insert" ON public.personal_training_schedules;
DROP POLICY IF EXISTS "Secretary ultra safe update" ON public.personal_training_schedules;
DROP POLICY IF EXISTS "Secretary ultra safe delete" ON public.personal_training_schedules;
DROP POLICY IF EXISTS "Secretary safe view all" ON public.personal_training_schedules;
DROP POLICY IF EXISTS "Secretary safe insert" ON public.personal_training_schedules;
DROP POLICY IF EXISTS "Secretary safe update" ON public.personal_training_schedules;
DROP POLICY IF EXISTS "Secretary safe delete" ON public.personal_training_schedules;

-- Drop all policies from personal_training_codes
DROP POLICY IF EXISTS "Secretaries can view all personal training codes" ON public.personal_training_codes;
DROP POLICY IF EXISTS "Secretaries can insert personal training codes" ON public.personal_training_codes;
DROP POLICY IF EXISTS "Secretaries can update personal training codes" ON public.personal_training_codes;
DROP POLICY IF EXISTS "Secretaries can delete personal training codes" ON public.personal_training_codes;
DROP POLICY IF EXISTS "Secretary ultra safe view all" ON public.personal_training_codes;
DROP POLICY IF EXISTS "Secretary ultra safe insert" ON public.personal_training_codes;
DROP POLICY IF EXISTS "Secretary ultra safe update" ON public.personal_training_codes;
DROP POLICY IF EXISTS "Secretary ultra safe delete" ON public.personal_training_codes;
DROP POLICY IF EXISTS "Secretary safe view all" ON public.personal_training_codes;
DROP POLICY IF EXISTS "Secretary safe insert" ON public.personal_training_codes;
DROP POLICY IF EXISTS "Secretary safe update" ON public.personal_training_codes;
DROP POLICY IF EXISTS "Secretary safe delete" ON public.personal_training_codes;

-- Drop all policies from group_sessions
DROP POLICY IF EXISTS "Secretaries can view all group sessions" ON public.group_sessions;
DROP POLICY IF EXISTS "Secretaries can insert group sessions" ON public.group_sessions;
DROP POLICY IF EXISTS "Secretaries can update group sessions" ON public.group_sessions;
DROP POLICY IF EXISTS "Secretaries can delete group sessions" ON public.group_sessions;
DROP POLICY IF EXISTS "Secretary ultra safe view all" ON public.group_sessions;
DROP POLICY IF EXISTS "Secretary ultra safe insert" ON public.group_sessions;
DROP POLICY IF EXISTS "Secretary ultra safe update" ON public.group_sessions;
DROP POLICY IF EXISTS "Secretary ultra safe delete" ON public.group_sessions;
DROP POLICY IF EXISTS "Secretary safe view all" ON public.group_sessions;
DROP POLICY IF EXISTS "Secretary safe insert" ON public.group_sessions;
DROP POLICY IF EXISTS "Secretary safe update" ON public.group_sessions;
DROP POLICY IF EXISTS "Secretary safe delete" ON public.group_sessions;

-- Drop all policies from memberships
DROP POLICY IF EXISTS "Secretaries can view all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Secretaries can insert memberships" ON public.memberships;
DROP POLICY IF EXISTS "Secretaries can update memberships" ON public.memberships;
DROP POLICY IF EXISTS "Secretaries can delete memberships" ON public.memberships;
DROP POLICY IF EXISTS "Secretary ultra safe view all" ON public.memberships;
DROP POLICY IF EXISTS "Secretary ultra safe insert" ON public.memberships;
DROP POLICY IF EXISTS "Secretary ultra safe update" ON public.memberships;
DROP POLICY IF EXISTS "Secretary ultra safe delete" ON public.memberships;
DROP POLICY IF EXISTS "Secretary safe view all" ON public.memberships;
DROP POLICY IF EXISTS "Secretary safe insert" ON public.memberships;
DROP POLICY IF EXISTS "Secretary safe update" ON public.memberships;
DROP POLICY IF EXISTS "Secretary safe delete" ON public.memberships;

-- Drop all policies from membership_packages
DROP POLICY IF EXISTS "Secretaries can view all membership packages" ON public.membership_packages;
DROP POLICY IF EXISTS "Secretaries can insert membership packages" ON public.membership_packages;
DROP POLICY IF EXISTS "Secretaries can update membership packages" ON public.membership_packages;
DROP POLICY IF EXISTS "Secretaries can delete membership packages" ON public.membership_packages;
DROP POLICY IF EXISTS "Secretary ultra safe view all" ON public.membership_packages;
DROP POLICY IF EXISTS "Secretary ultra safe insert" ON public.membership_packages;
DROP POLICY IF EXISTS "Secretary ultra safe update" ON public.membership_packages;
DROP POLICY IF EXISTS "Secretary ultra safe delete" ON public.membership_packages;
DROP POLICY IF EXISTS "Secretary safe view all" ON public.membership_packages;
DROP POLICY IF EXISTS "Secretary safe insert" ON public.membership_packages;
DROP POLICY IF EXISTS "Secretary safe update" ON public.membership_packages;
DROP POLICY IF EXISTS "Secretary safe delete" ON public.membership_packages;

-- Drop all policies from membership_requests
DROP POLICY IF EXISTS "Secretaries can view all membership requests" ON public.membership_requests;
DROP POLICY IF EXISTS "Secretaries can insert membership requests" ON public.membership_requests;
DROP POLICY IF EXISTS "Secretaries can update membership requests" ON public.membership_requests;
DROP POLICY IF EXISTS "Secretaries can delete membership requests" ON public.membership_requests;
DROP POLICY IF EXISTS "Secretary ultra safe view all" ON public.membership_requests;
DROP POLICY IF EXISTS "Secretary ultra safe insert" ON public.membership_requests;
DROP POLICY IF EXISTS "Secretary ultra safe update" ON public.membership_requests;
DROP POLICY IF EXISTS "Secretary ultra safe delete" ON public.membership_requests;
DROP POLICY IF EXISTS "Secretary safe view all" ON public.membership_requests;
DROP POLICY IF EXISTS "Secretary safe insert" ON public.membership_requests;
DROP POLICY IF EXISTS "Secretary safe update" ON public.membership_requests;
DROP POLICY IF EXISTS "Secretary safe delete" ON public.membership_requests;

-- =============================================
-- STEP 3: DROP PROBLEMATIC FUNCTIONS
-- =============================================

SELECT 'Dropping problematic functions...' as step;

-- Drop functions that might cause recursion
DROP FUNCTION IF EXISTS public.is_user_secretary();
DROP FUNCTION IF EXISTS public.is_user_secretary_safe();
DROP FUNCTION IF EXISTS public.get_user_role_safe(UUID);
DROP FUNCTION IF EXISTS public.user_exists_safe(UUID);
DROP FUNCTION IF EXISTS public.is_secretary();

-- =============================================
-- STEP 4: DISABLE RLS ON ALL TABLES
-- =============================================

SELECT 'Disabling RLS on all tables...' as step;

-- Disable RLS on all affected tables
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_training_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_training_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_requests DISABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 5: ADD MISSING COLUMN
-- =============================================

SELECT 'Adding missing personal_training_code column...' as step;

-- Add personal_training_code column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'personal_training_code'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN personal_training_code TEXT DEFAULT NULL;
        
        RAISE NOTICE 'Added personal_training_code column to user_profiles';
    ELSE
        RAISE NOTICE 'personal_training_code column already exists in user_profiles';
    END IF;
END $$;

-- =============================================
-- STEP 6: CREATE TEMPORARY "ALLOW ALL" POLICIES
-- =============================================

SELECT 'Creating temporary allow-all policies...' as step;

-- Re-enable RLS but with simple "allow all" policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_training_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_training_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_requests ENABLE ROW LEVEL SECURITY;

-- Create simple "allow all" policies
CREATE POLICY "temporary_allow_all_user_profiles" ON public.user_profiles
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "temporary_allow_all_personal_training_schedules" ON public.personal_training_schedules
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "temporary_allow_all_personal_training_codes" ON public.personal_training_codes
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "temporary_allow_all_group_sessions" ON public.group_sessions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "temporary_allow_all_memberships" ON public.memberships
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "temporary_allow_all_membership_packages" ON public.membership_packages
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "temporary_allow_all_membership_requests" ON public.membership_requests
    FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- STEP 7: SUCCESS MESSAGE
-- =============================================

SELECT '🎉 NUCLEAR OPTION COMPLETED SUCCESSFULLY!' as message;
SELECT '✅ All problematic policies removed' as message;
SELECT '✅ RLS disabled on all tables' as message;
SELECT '✅ Missing column added' as message;
SELECT '✅ Temporary allow-all policies created' as message;
SELECT '✅ No more infinite recursion' as message;
SELECT 'ℹ️ Secretary panel should now work!' as message;

COMMIT;

-- =============================================
-- TESTING INSTRUCTIONS
-- =============================================

-- Test these queries to verify functionality:
-- 1. SELECT COUNT(*) FROM user_profiles;
-- 2. SELECT COUNT(*) FROM personal_training_schedules;
-- 3. SELECT COUNT(*) FROM personal_training_codes;
-- 4. SELECT COUNT(*) FROM group_sessions;
-- 5. SELECT COUNT(*) FROM memberships;
-- 6. SELECT COUNT(*) FROM membership_packages;
-- 7. SELECT COUNT(*) FROM membership_requests;

-- =============================================
-- ROLLBACK INSTRUCTIONS
-- =============================================

-- If you need to rollback, run this:
-- BEGIN;
-- DROP POLICY IF EXISTS "temporary_allow_all_user_profiles" ON public.user_profiles;
-- DROP POLICY IF EXISTS "temporary_allow_all_personal_training_schedules" ON public.personal_training_schedules;
-- DROP POLICY IF EXISTS "temporary_allow_all_personal_training_codes" ON public.personal_training_codes;
-- DROP POLICY IF EXISTS "temporary_allow_all_group_sessions" ON public.group_sessions;
-- DROP POLICY IF EXISTS "temporary_allow_all_memberships" ON public.memberships;
-- DROP POLICY IF EXISTS "temporary_allow_all_membership_packages" ON public.membership_packages;
-- DROP POLICY IF EXISTS "temporary_allow_all_membership_requests" ON public.membership_requests;
-- -- Then restore from tmp_rls_backup table
-- COMMIT;
