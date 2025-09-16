-- FINAL DATABASE AUDIT FOR USER_PROFILES INFINITE RECURSION
-- This version works with Supabase and avoids all problematic functions

-- ==============================================
-- PHASE 1: BASIC TABLE INFORMATION
-- ==============================================

-- 1. List all tables in the database
SELECT 
    'TABLE_LIST' as audit_type,
    schemaname, 
    tablename 
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog','information_schema') 
ORDER BY schemaname, tablename;

-- 2. Show user_profiles table structure
SELECT 
    'TABLE_STRUCTURE' as audit_type,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- ==============================================
-- PHASE 2: RLS POLICIES (WORKING VERSION)
-- ==============================================

-- 3. List all RLS policies on user_profiles (without pg_get_policydef)
SELECT 
    'RLS_POLICIES' as audit_type,
    p.polname as policy_name,
    p.polcmd as command,
    p.polpermissive as permissive,
    ARRAY(SELECT r.rolname FROM pg_catalog.pg_roles r WHERE r.oid = ANY(p.polroles)) as roles,
    p.polqual as using_expression,
    p.polwithcheck as with_check_expression
FROM pg_catalog.pg_policy p
JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'user_profiles'
ORDER BY p.polname;

-- 4. Check RLS status
SELECT 
    'RLS_STATUS' as audit_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- ==============================================
-- PHASE 3: TRIGGERS
-- ==============================================

-- 5. List all triggers on user_profiles
SELECT 
    'TRIGGERS' as audit_type,
    t.tgname as trigger_name,
    t.tgenabled as enabled,
    t.tgtype as trigger_type
FROM pg_catalog.pg_trigger t
JOIN pg_catalog.pg_class c ON t.tgrelid = c.oid
JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'user_profiles';

-- ==============================================
-- PHASE 4: FUNCTIONS (PUBLIC SCHEMA ONLY)
-- ==============================================

-- 6. List functions in public schema that reference user_profiles
SELECT 
    'FUNCTIONS' as audit_type,
    p.proname as function_name,
    n.nspname as schema_name,
    p.prokind as function_type
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname ILIKE '%user_profile%'
ORDER BY p.proname;

-- ==============================================
-- PHASE 5: PERMISSIONS
-- ==============================================

-- 7. List roles and grants for user_profiles
SELECT 
    'PERMISSIONS' as audit_type,
    grantee, 
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'user_profiles'
ORDER BY grantee, privilege_type;

-- ==============================================
-- PHASE 6: FOREIGN KEY CONSTRAINTS
-- ==============================================

-- 8. Check foreign key constraints on user_profiles
SELECT 
    'FOREIGN_KEYS' as audit_type,
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
AND tc.table_name = 'user_profiles';

-- ==============================================
-- PHASE 7: SUMMARY
-- ==============================================

-- 9. Summary of findings
SELECT 
    'SUMMARY' as audit_type,
    'Database audit completed successfully' as message,
    NOW() as timestamp,
    (SELECT COUNT(*) FROM pg_catalog.pg_policy p
     JOIN pg_catalog.pg_class c ON p.polrelid = c.oid
     JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
     WHERE n.nspname = 'public' AND c.relname = 'user_profiles') as policy_count,
    (SELECT COUNT(*) FROM pg_catalog.pg_trigger t
     JOIN pg_catalog.pg_class c ON t.tgrelid = c.oid
     JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
     WHERE n.nspname = 'public' AND c.relname = 'user_profiles') as trigger_count;
