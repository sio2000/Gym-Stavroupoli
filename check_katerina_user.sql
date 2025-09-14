-- Check if Katerina user was created/updated correctly
-- This will help diagnose the login issue

-- Check auth.users table
SELECT 
    id,
    email,
    email_confirmed_at,
    encrypted_password,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'katerina@freegym.gr';

-- Check user_profiles table
SELECT 
    user_id,
    first_name,
    last_name,
    email,
    role,
    created_at,
    updated_at
FROM public.user_profiles 
WHERE email = 'katerina@freegym.gr';

-- Check if there are any RLS issues
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('users', 'user_profiles');

-- Check if the user can be found by the application
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    up.first_name,
    up.last_name,
    up.role
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'katerina@freegym.gr';

