-- TEST CONNECTION - ΔΟΚΙΜΗ ΣΥΝΔΕΣΗΣ
-- Εκτέλεση στο Supabase SQL Editor

-- Test 1: Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Test 2: Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test 3: Check functions
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Test 4: Check storage buckets
SELECT * FROM storage.buckets;

-- Test 5: Simple query test
SELECT COUNT(*) as user_count FROM user_profiles;

-- Success message
SELECT 'Connection test completed!' as message;
