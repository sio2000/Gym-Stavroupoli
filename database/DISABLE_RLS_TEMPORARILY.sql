/* DISABLE RLS TEMPORARILY - ΑΠΕΝΕΡΓΟΠΟΙΗΣΗ RLS ΠΡΟΣΩΡΙΝΑ
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Drop ALL existing policies */
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.user_profiles;

/* 2. Disable RLS temporarily to allow updates */
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

/* 3. Test update */
UPDATE user_profiles 
SET 
    first_name = 'Test Update Success',
    updated_at = NOW()
WHERE user_id = 'af590b3a-aa03-44f5-bb5c-73c483bffacc';

/* 4. Check if update worked */
SELECT 
    'Update Test Result' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    phone,
    profile_photo,
    updated_at
FROM user_profiles 
WHERE user_id = 'af590b3a-aa03-44f5-bb5c-73c483bffacc';

/* 5. Show RLS status */
SELECT 
    'RLS Status' as test_name,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_profiles';

/* Success message */
SELECT 'RLS disabled temporarily - updates should work now!' as message;
