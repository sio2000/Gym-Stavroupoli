/* ULTIMATE PROFILE FIX - ΤΕΛΙΚΗ ΔΙΟΡΘΩΣΗ PROFILES
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Drop ALL existing policies to start fresh */
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.user_profiles;

/* 2. Add missing columns if they don't exist */
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS dob DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS profile_photo TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dob_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'el',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

/* 3. Update existing records to have updated_at */
UPDATE public.user_profiles 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

/* 4. Create simple, non-recursive policies */
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

/* 5. Create admin policies that don't reference the same table */
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

/* 6. Ensure RLS is enabled */
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

/* 7. Update admin users to have correct role in metadata */
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'admin@freegym.gr' 
   OR email LIKE '%admin%';

/* 8. Update trainer users to have correct role in metadata */
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "trainer"}'::jsonb
WHERE email = 'trainer1@freegym.gr' 
   OR email LIKE '%trainer%';

/* 9. Update user_profiles table to match */
UPDATE user_profiles 
SET role = 'admin'
WHERE email = 'admin@freegym.gr' 
   OR email LIKE '%admin%';

UPDATE user_profiles 
SET role = 'trainer'
WHERE email = 'trainer1@freegym.gr' 
   OR email LIKE '%trainer%';

/* 10. Test the setup */
SELECT 
    'Ultimate Fix Results' as test_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'user_profiles') as total_columns,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_profiles') as total_policies,
    (SELECT COUNT(*) FROM user_profiles) as total_profiles;

/* 11. Test a simple query */
SELECT 
    'Test Query' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    role
FROM user_profiles 
LIMIT 3;

/* Success message */
SELECT 'Ultimate profile fix applied successfully!' as message;
