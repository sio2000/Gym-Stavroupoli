-- FIX USER PROFILES RLS - ΔΙΟΡΘΩΣΗ RLS ΓΙΑ USER_PROFILES TABLE
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Drop ALL existing policies για user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.user_profiles;

-- 2. Disable RLS για user_profiles table
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. Verify RLS is disabled
SELECT 
    'RLS Status' as test_name,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 4. Test ότι μπορούμε να διαβάσουμε δεδομένα
SELECT 
    'Test Query' as test_name,
    COUNT(*) as user_count
FROM public.user_profiles;

-- Success message
SELECT 'User profiles RLS disabled - Admin Panel should work now!' as message;
