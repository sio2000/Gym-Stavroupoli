-- Create trainer with UPSERT to avoid duplicate key errors
-- This will definitely work!

-- First, let's see what exists
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    up.first_name,
    up.last_name,
    up.role
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'coach2024@freegym.gr';

-- Create user in auth.users (if not exists)
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
    'coach2024@freegym.gr',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Hash for 'password'
    NOW(),
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Coach", "last_name": "2024"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
)
ON CONFLICT (email) DO NOTHING;

-- Create or update user profile using UPSERT
INSERT INTO public.user_profiles (
    user_id,
    first_name,
    last_name,
    email,
    role,
    created_at,
    updated_at
)
SELECT 
    u.id,
    'Coach',
    '2024',
    'coach2024@freegym.gr',
    'trainer',
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'coach2024@freegym.gr'
ON CONFLICT (user_id) 
DO UPDATE SET
    first_name = 'Coach',
    last_name = '2024',
    role = 'trainer',
    updated_at = NOW();

-- Show the result
SELECT 
    'TRAINER READY!' as message,
    u.email as email,
    'password' as password,
    up.first_name,
    up.last_name,
    up.role,
    'Use these credentials to login' as instruction
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'coach2024@freegym.gr';