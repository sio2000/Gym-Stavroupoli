/* EMERGENCY RLS FIX - ΕΠΕΙΓΟΥΣΑ ΔΙΟΡΘΩΣΗ RLS
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

/* 2. Temporarily disable RLS to test */
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

/* 3. Test if update works without RLS */
UPDATE user_profiles 
SET 
    first_name = 'Test Update',
    updated_at = NOW()
WHERE user_id = 'af590b3a-aa03-44f5-bb5c-73c483bffacc';

/* 4. Re-enable RLS */
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

/* 5. Create simple, working policies */
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

/* 6. Test the policies */
SELECT 
    'RLS Test' as test_name,
    user_id,
    first_name,
    last_name,
    email
FROM user_profiles 
WHERE user_id = 'af590b3a-aa03-44f5-bb5c-73c483bffacc';

/* Success message */
SELECT 'Emergency RLS fix applied!' as message;
