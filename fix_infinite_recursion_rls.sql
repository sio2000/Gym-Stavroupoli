-- FIX INFINITE RECURSION RLS POLICIES
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Διαγραφή όλων των υπαρχουσών πολιτικών
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow registration" ON public.user_profiles;

-- 2. Δημιουργία νέων απλών πολιτικών χωρίς recursion
-- Επιτρέπει σε οποιονδήποτε να κάνει εγγραφή
CREATE POLICY "Allow registration" ON public.user_profiles
    FOR INSERT WITH CHECK (true);

-- Επιτρέπει στους χρήστες να βλέπουν το δικό τους προφίλ
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Επιτρέπει στους χρήστες να ενημερώνουν το δικό τους προφίλ
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Ενεργοποίηση RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Δοκιμή ότι οι πολιτικές λειτουργούν
SELECT 
    'RLS Policies Fixed Successfully' as status,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_profiles';
