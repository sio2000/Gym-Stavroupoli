-- =============================================
-- DEEP DATABASE ANALYSIS
-- =============================================
-- Αυτό το script θα αναλύσει την υπάρχουσα δομή της βάσης
-- για να καταλάβουμε τι συμβαίνει με τις RLS policies

-- =============================================
-- STEP 1: ΕΛΕΓΧΟΣ ΥΠΑΡΞΗΣ ΠΙΝΑΚΩΝ
-- =============================================
SELECT 'Checking table existence...' as step;

SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema IN ('public', 'auth')
AND table_name IN (
    'users', 'user_profiles', 'personal_training_schedules', 
    'personal_training_codes', 'group_sessions', 'memberships',
    'membership_packages', 'membership_requests'
)
ORDER BY table_schema, table_name;

-- =============================================
-- STEP 2: ΕΛΕΓΧΟΣ RLS STATUS
-- =============================================
SELECT 'Checking RLS status...' as step;

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
-- STEP 3: ΛΙΣΤΑ ΟΛΩΝ ΤΩΝ POLICIES
-- =============================================
SELECT 'Listing all policies...' as step;

SELECT 
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
    'user_profiles', 'personal_training_schedules', 
    'personal_training_codes', 'group_sessions', 'memberships',
    'membership_packages', 'membership_requests'
)
ORDER BY tablename, policyname;

-- =============================================
-- STEP 4: ΕΛΕΓΧΟΣ COLUMNS
-- =============================================
SELECT 'Checking columns...' as step;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- STEP 5: ΕΛΕΓΧΟΣ AUTH.USERS STRUCTURE
-- =============================================
SELECT 'Checking auth.users structure...' as step;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
AND table_schema = 'auth'
ORDER BY ordinal_position;

-- =============================================
-- STEP 6: TEST SIMPLE QUERIES
-- =============================================
SELECT 'Testing simple queries...' as step;

-- Test 1: Basic user_profiles query
SELECT 
    'user_profiles count:' as test,
    COUNT(*) as count
FROM user_profiles;

-- Test 2: Basic auth.users query
SELECT 
    'auth.users count:' as test,
    COUNT(*) as count
FROM auth.users;

-- Test 3: Current user
SELECT 
    'current user:' as test,
    auth.uid() as user_id,
    auth.email() as email;

-- =============================================
-- STEP 7: ΕΛΕΓΧΟΣ FUNCTIONS
-- =============================================
SELECT 'Checking functions...' as step;

SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%secretary%'
ORDER BY routine_name;

-- =============================================
-- STEP 8: ΕΛΕΓΧΟΣ ROLES
-- =============================================
SELECT 'Checking roles...' as step;

SELECT 
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin
FROM pg_roles 
WHERE rolname LIKE '%secretary%' 
OR rolname LIKE '%admin%'
OR rolname LIKE '%reception%'
ORDER BY rolname;
