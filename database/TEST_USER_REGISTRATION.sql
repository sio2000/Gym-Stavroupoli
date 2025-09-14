/* TEST USER REGISTRATION - ΔΟΚΙΜΗ ΕΓΓΡΑΦΗΣ ΧΡΗΣΤΗ
   Εκτέλεση στο Supabase SQL Editor */

/* Check current users and profiles */
SELECT 
    'Current Users and Profiles' as test_name,
    u.email,
    up.first_name,
    up.last_name,
    up.phone,
    up.role,
    up.created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
ORDER BY up.created_at DESC
LIMIT 10;

/* Check if trigger exists and is working */
SELECT 
    'Trigger Check' as test_name,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

/* Check if function exists */
SELECT 
    'Function Check' as test_name,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

/* Test creating a new user manually */
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test-registration@freegym.gr',
    crypt('test123', gen_salt('bf')),
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Test", "last_name": "User", "phone": "+306912345678"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

/* Check if the new user got a profile */
SELECT 
    'New User Profile Check' as test_name,
    u.email,
    up.first_name,
    up.last_name,
    up.phone,
    up.role,
    up.created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.email = 'test-registration@freegym.gr';

/* Check RLS policies for user_profiles */
SELECT 
    'RLS Policies for user_profiles' as test_name,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'user_profiles'
AND schemaname = 'public';

/* Success message */
SELECT 'User registration test completed!' as message;
