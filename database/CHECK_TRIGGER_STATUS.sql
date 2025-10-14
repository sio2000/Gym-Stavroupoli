-- CHECK TRIGGER STATUS
-- Ελέγχος αν το bulletproof trigger λειτουργεί σωστά

-- 1. Ελέγχος αν υπάρχει το trigger
SELECT 
    tgname as trigger_name,
    tgtype as trigger_type,
    tgenabled as enabled,
    tgisinternal as is_internal
FROM pg_trigger 
WHERE tgname LIKE '%auth_user_created%';

-- 2. Ελέγχος αν υπάρχει η function
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname LIKE '%handle_new_user%';

-- 3. Ελέγχος αν υπάρχει η ensure_user_profile function
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'ensure_user_profile';

-- 4. Ελέγχος RLS policies για user_profiles
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 5. Ελέγχος αν το audit logs table υπάρχει
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'user_profile_audit_logs'
ORDER BY ordinal_position;

-- 6. Test του trigger με dummy user (προσοχή: αυτό θα δημιουργήσει test user!)
-- ΑΠΟΣΥΝΔΕΣΤΕ ΑΥΤΗΝ ΤΗΝ ΓΡΑΜΜΗ ΕΑΝ ΔΕ ΘΕΛΕΤΕ TEST USER
-- INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data) VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'test-trigger@freegym.gr', crypt('test123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"first_name": "Test", "last_name": "Trigger"}');

-- 7. Ελέγχος αν δημιουργήθηκε profile για test user
-- SELECT u.email, up.first_name, up.last_name, up.created_at
-- FROM auth.users u
-- LEFT JOIN user_profiles up ON u.id = up.user_id
-- WHERE u.email = 'test-trigger@freegym.gr';

-- 8. Ελέγχος audit logs
SELECT 
    user_id,
    action,
    origin,
    error_message,
    created_at
FROM user_profile_audit_logs
ORDER BY created_at DESC
LIMIT 10;

-- 9. Στατιστικά profiles
SELECT 
    COUNT(*) as total_auth_users
FROM auth.users;

SELECT 
    COUNT(*) as total_profiles
FROM user_profiles;

SELECT 
    COUNT(*) as missing_profiles
FROM auth.users a
LEFT JOIN user_profiles p ON a.id = p.user_id
WHERE p.user_id IS NULL;
