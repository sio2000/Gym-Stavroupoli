/* COMPLETE PROFILE FIX - ΠΛΗΡΗΣ ΔΙΟΡΘΩΣΗ PROFILES
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Add missing columns if they don't exist */
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

/* 2. Update existing records to have updated_at */
UPDATE public.user_profiles 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

/* 3. Drop existing RLS policies to avoid conflicts */
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.user_profiles;

/* 4. Create comprehensive RLS policies */
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert user profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update user profiles" ON public.user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

/* 5. Ensure RLS is enabled */
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

/* 6. Test the setup */
SELECT 
    'Profile Fix Results' as test_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'user_profiles') as total_columns,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_profiles') as total_policies,
    (SELECT COUNT(*) FROM user_profiles) as total_profiles;

/* 7. Show sample profile data */
SELECT 
    'Sample Profile Data' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    phone,
    dob,
    address,
    emergency_contact,
    profile_photo,
    profile_photo_locked,
    dob_locked,
    language,
    created_at,
    updated_at
FROM user_profiles 
ORDER BY updated_at DESC 
LIMIT 3;

/* Success message */
SELECT 'Complete profile fix applied successfully!' as message;
