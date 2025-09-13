/* FIX INFINITE RECURSION - ΔΙΟΡΘΩΣΗ INFINITE RECURSION
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Drop ALL existing policies to start fresh */
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.user_profiles;

/* 2. Create simple, non-recursive policies */
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

/* 3. Create admin policies that don't reference the same table */
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can insert profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can update profiles" ON public.user_profiles
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM auth.users 
            WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

/* 4. Ensure RLS is enabled */
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

/* 5. Test the policies */
SELECT 
    'RLS Policies Fixed' as test_name,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'user_profiles';

/* 6. Test a simple query */
SELECT 
    'Test Query' as test_name,
    user_id,
    first_name,
    last_name,
    email
FROM user_profiles 
LIMIT 1;

/* Success message */
SELECT 'Infinite recursion fixed!' as message;
