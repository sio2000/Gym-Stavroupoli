-- COMPREHENSIVE DATABASE AUDIT FOR USER_PROFILES INFINITE RECURSION
-- Run this in staging first, then production

-- 1. List all tables
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog','information_schema') 
ORDER BY schemaname, tablename;

-- 2. Show user_profiles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 3. List all RLS policies on user_profiles (full definition)
SELECT 
    p.polname as policy_name,
    p.polcmd as command,
    p.polpermissive as permissive,
    ARRAY(SELECT r.rolname FROM pg_catalog.pg_roles r WHERE r.oid = ANY(p.polroles)) as roles,
    pg_get_policydef(p.oid) as full_policy_definition
FROM pg_catalog.pg_policy p
JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'user_profiles'
ORDER BY p.polname;

-- 4. List all triggers on user_profiles
SELECT 
    t.tgname as trigger_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_catalog.pg_trigger t
JOIN pg_catalog.pg_class c ON t.tgrelid = c.oid
JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'user_profiles';

-- 5. List functions that reference user_profiles (avoiding auth schema)
SELECT 
    p.proname as function_name,
    n.nspname as schema_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('auth', 'pg_catalog', 'information_schema')
AND pg_get_functiondef(p.oid) ILIKE '%user_profiles%'
ORDER BY n.nspname, p.proname;

-- 6. List roles and grants for user_profiles
SELECT 
    grantee, 
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'user_profiles' AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- 7. Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasrls as has_rls
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 8. Check for any views that reference user_profiles
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE definition ILIKE '%user_profiles%';

-- 9. Check for any materialized views
SELECT 
    schemaname,
    matviewname,
    definition
FROM pg_matviews
WHERE definition ILIKE '%user_profiles%';

-- 10. Check for any foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (tc.table_name = 'user_profiles' OR ccu.table_name = 'user_profiles');

-- 11. Check for any indexes on user_profiles
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'user_profiles' AND schemaname = 'public';

-- 12. Check for any sequences used by user_profiles
SELECT
    column_name,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
    AND column_default LIKE 'nextval%';

-- 13. Check current active connections and their roles
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY usename;

-- 14. Check for any custom types that might be used
SELECT 
    typname,
    typtype,
    typcategory
FROM pg_type
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND typname LIKE '%user%' OR typname LIKE '%profile%';

-- 15. Check for any stored procedures or functions that might be called during auth
SELECT 
    proname,
    prokind,
    proargnames,
    prosrc
FROM pg_proc
WHERE proname LIKE '%auth%' 
    OR proname LIKE '%user%'
    OR proname LIKE '%profile%'
    OR proname LIKE '%referral%'
ORDER BY proname;
