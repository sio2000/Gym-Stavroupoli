/* FINAL RLS FIX - ΤΕΛΙΚΗ ΔΙΟΡΘΩΣΗ RLS
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

/* 2. Create very simple policies that definitely work */
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

/* 3. Ensure RLS is enabled */
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

/* 4. Test the current user */
SELECT 
    'Current User Test' as test_name,
    auth.uid() as current_user_id,
    auth.role() as current_role;

/* 5. Test if the user can see their profile */
SELECT 
    'Profile Access Test' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    phone
FROM user_profiles 
WHERE user_id = auth.uid();

/* 6. Test update with the specific user */
UPDATE user_profiles 
SET 
    first_name = 'Updated Test',
    updated_at = NOW()
WHERE user_id = 'af590b3a-aa03-44f5-bb5c-73c483bffacc';

/* 7. Check if update worked */
SELECT 
    'Update Test Result' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    updated_at
FROM user_profiles 
WHERE user_id = 'af590b3a-aa03-44f5-bb5c-73c483bffacc';

/* Success message */
SELECT 'Final RLS fix applied!' as message;
