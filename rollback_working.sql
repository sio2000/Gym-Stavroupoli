-- WORKING ROLLBACK SCRIPT FOR INFINITE RECURSION FIX
-- This removes only the new policies and functions we added

-- ==============================================
-- PHASE 1: SHOW CURRENT STATE
-- ==============================================

-- Show current policies
SELECT 
    'BEFORE_ROLLBACK' as audit_type,
    p.polname as policy_name,
    p.polcmd as command,
    p.polpermissive as permissive
FROM pg_catalog.pg_policy p
JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'user_profiles'
ORDER BY p.polname;

-- ==============================================
-- PHASE 2: REMOVE NEW POLICIES
-- ==============================================

-- Temporarily disable RLS
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop the new policies we created
DROP POLICY IF EXISTS "safe_allow_registration" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_user_view_own" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_user_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "safe_service_role_all" ON public.user_profiles;

-- Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- PHASE 3: REMOVE NEW FUNCTIONS
-- ==============================================

-- Drop the safe functions
DROP FUNCTION IF EXISTS public.create_user_profile_safe(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_user_profile_safe(UUID);
DROP FUNCTION IF EXISTS public.user_exists_safe(UUID);
DROP FUNCTION IF EXISTS public.get_user_role_safe(UUID);

-- ==============================================
-- PHASE 4: REMOVE NEW VIEW
-- ==============================================

-- Drop the safe view
DROP VIEW IF EXISTS public.user_profiles_safe;

-- ==============================================
-- PHASE 5: VERIFY ROLLBACK
-- ==============================================

-- Show remaining policies
SELECT 
    'AFTER_ROLLBACK' as audit_type,
    p.polname as policy_name,
    p.polcmd as command,
    p.polpermissive as permissive
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

-- Final success message
SELECT 
    'ROLLBACK_COMPLETE' as audit_type,
    'Rollback completed successfully! Table restored to original state.' as message,
    NOW() as timestamp;
