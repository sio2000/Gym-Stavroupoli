/* CHECK PROFILE RLS - ΕΛΕΓΧΟΣ RLS POLICIES ΓΙΑ PROFILES
   Εκτέλεση στο Supabase SQL Editor */

/* Check RLS policies for user_profiles */
SELECT 
    'RLS Policies for user_profiles' as test_name,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

/* Check if RLS is enabled */
SELECT 
    'RLS Status' as test_name,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_profiles';

/* Test if current user can update profiles */
SELECT 
    'Current User Info' as test_name,
    auth.uid() as current_user_id,
    auth.role() as current_role;

/* Check if there are any constraints */
SELECT 
    'Constraints' as test_name,
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'user_profiles';

/* Success message */
SELECT 'RLS check completed!' as message;
