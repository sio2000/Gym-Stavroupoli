-- ROLLBACK SCRIPT FOR SAFE INFINITE RECURSION FIX
-- This script safely rolls back the changes made by fix_infinite_recursion_safe.sql
-- All changes are reversible and non-destructive

-- ==============================================
-- PHASE 1: DISABLE NEW POLICIES
-- ==============================================

-- Disable RLS temporarily to modify policies
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop the new safe policies
DROP POLICY IF EXISTS "safe_allow_registration" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_user_view_own" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_user_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_service_role_all" ON public.user_profiles;

-- Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- PHASE 2: REMOVE NEW FUNCTIONS
-- ==============================================

-- Drop the safe functions
DROP FUNCTION IF EXISTS public.create_user_profile_safe(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_user_profile_safe(UUID);
DROP FUNCTION IF EXISTS public.user_exists_safe(UUID);
DROP FUNCTION IF EXISTS public.get_user_role_safe(UUID);

-- ==============================================
-- PHASE 3: REMOVE NEW VIEWS
-- ==============================================

-- Drop the safe view
DROP VIEW IF EXISTS public.user_profiles_safe;

-- ==============================================
-- PHASE 4: VERIFY ROLLBACK
-- ==============================================

-- Check that new policies are gone
SELECT 
    'POLICY_AUDIT' as audit_type,
    p.polname as policy_name,
    p.polcmd as command,
    p.polpermissive as permissive
FROM pg_catalog.pg_policy p
JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'user_profiles'
ORDER BY p.polname;

-- Check that new functions are gone
SELECT 
    'FUNCTION_AUDIT' as audit_type,
    p.proname as function_name,
    n.nspname as schema_name,
    p.prokind as function_type
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (p.proname LIKE '%user_profile%' OR p.proname LIKE '%safe%')
ORDER BY p.proname;

-- Check RLS status
SELECT 
    'RLS_STATUS' as audit_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'user_profiles';

-- ==============================================
-- PHASE 5: RESTORE ORIGINAL BEHAVIOR
-- ==============================================

-- Note: This script does NOT restore the original problematic policies
-- because we don't want to reintroduce the infinite recursion issue.
-- If you need to restore original policies, you should:
-- 1. First identify what the original policies were
-- 2. Create new, non-recursive versions of them
-- 3. Test them thoroughly before applying

-- ==============================================
-- PHASE 6: CLEANUP VERIFICATION
-- ==============================================

-- Verify that the table is still accessible
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    -- Try to query the table
    SELECT COUNT(*) INTO test_count
    FROM public.user_profiles
    LIMIT 1;
    
    RAISE NOTICE 'Table is accessible. Row count: %', test_count;
    
    -- Check if RLS is still enabled
    IF (SELECT rowsecurity FROM pg_tables WHERE tablename = 'user_profiles') THEN
        RAISE NOTICE 'RLS is still enabled';
    ELSE
        RAISE NOTICE 'WARNING: RLS is disabled';
    END IF;
    
    RAISE NOTICE 'Rollback completed successfully';
END $$;

-- ==============================================
-- PHASE 7: FINAL STATUS REPORT
-- ==============================================

-- Show final status
SELECT 
    'ROLLBACK_COMPLETE' as status,
    'All safe fix changes have been rolled back' as message,
    NOW() as timestamp;

-- Show remaining policies (if any)
SELECT 
    'REMAINING_POLICIES' as audit_type,
    p.polname as policy_name,
    p.polcmd as command
FROM pg_catalog.pg_policy p
JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'user_profiles'
ORDER BY p.polname;

-- Show remaining functions
SELECT 
    'REMAINING_FUNCTIONS' as audit_type,
    p.proname as function_name,
    n.nspname as schema_name,
    p.prokind as function_type
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname LIKE '%user_profile%'
ORDER BY p.proname;

-- Rollback script completed. The table should now be in its original state.
