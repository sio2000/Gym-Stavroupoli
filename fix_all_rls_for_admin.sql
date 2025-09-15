-- FIX ALL RLS FOR ADMIN - ΔΙΟΡΘΩΣΗ RLS ΓΙΑ ΟΛΑ ΤΑ TABLES
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Disable RLS για όλα τα κύρια tables
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_training_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_training_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_audit_logs DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies για user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.user_profiles;

-- 3. Drop all existing policies για membership_requests
DROP POLICY IF EXISTS "Users can view own requests" ON public.membership_requests;
DROP POLICY IF EXISTS "Users can insert own requests" ON public.membership_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.membership_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON public.membership_requests;

-- 4. Drop all existing policies για personal_training_schedules
DROP POLICY IF EXISTS "Users can view own schedules" ON public.personal_training_schedules;
DROP POLICY IF EXISTS "Users can insert own schedules" ON public.personal_training_schedules;
DROP POLICY IF EXISTS "Admins can view all schedules" ON public.personal_training_schedules;
DROP POLICY IF EXISTS "Admins can update all schedules" ON public.personal_training_schedules;

-- 5. Drop all existing policies για personal_training_codes
DROP POLICY IF EXISTS "Users can view own codes" ON public.personal_training_codes;
DROP POLICY IF EXISTS "Users can insert own codes" ON public.personal_training_codes;
DROP POLICY IF EXISTS "Admins can view all codes" ON public.personal_training_codes;
DROP POLICY IF EXISTS "Admins can update all codes" ON public.personal_training_codes;

-- 6. Drop all existing policies για qr_codes
DROP POLICY IF EXISTS "Users can view own qr codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Users can insert own qr codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Admins can view all qr codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Admins can update all qr codes" ON public.qr_codes;

-- 7. Drop all existing policies για scan_audit_logs
DROP POLICY IF EXISTS "Users can view own scan logs" ON public.scan_audit_logs;
DROP POLICY IF EXISTS "Users can insert own scan logs" ON public.scan_audit_logs;
DROP POLICY IF EXISTS "Admins can view all scan logs" ON public.scan_audit_logs;
DROP POLICY IF EXISTS "Admins can update all scan logs" ON public.scan_audit_logs;

-- 8. Verify RLS is disabled για όλα τα tables
SELECT 
    'RLS Status' as test_name,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'membership_requests', 'personal_training_schedules', 'personal_training_codes', 'qr_codes', 'scan_audit_logs')
ORDER BY tablename;

-- 9. Test ότι μπορούμε να διαβάσουμε δεδομένα
SELECT 
    'User Profiles Count' as table_name,
    COUNT(*) as record_count
FROM public.user_profiles
UNION ALL
SELECT 
    'Membership Requests Count' as table_name,
    COUNT(*) as record_count
FROM public.membership_requests
UNION ALL
SELECT 
    'Personal Training Schedules Count' as table_name,
    COUNT(*) as record_count
FROM public.personal_training_schedules
UNION ALL
SELECT 
    'Personal Training Codes Count' as table_name,
    COUNT(*) as record_count
FROM public.personal_training_codes
UNION ALL
SELECT 
    'QR Codes Count' as table_name,
    COUNT(*) as record_count
FROM public.qr_codes
UNION ALL
SELECT 
    'Scan Audit Logs Count' as table_name,
    COUNT(*) as record_count
FROM public.scan_audit_logs;

-- Success message
SELECT 'All RLS disabled - Admin Panel should work perfectly now!' as message;
