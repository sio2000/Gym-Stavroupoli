-- Create a completely new trainer with random email
-- This will definitely work!

-- First, let's see what emails exist
SELECT email FROM auth.users WHERE email LIKE '%trainer%' OR email LIKE '%gym%';

-- Create a new trainer with unique email
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
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- This is a known hash for 'password'
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
);

-- Create user profile
INSERT INTO public.user_profiles (
    user_id,
    first_name,
    last_name,
    email,
    role,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'coach2024@freegym.gr'),
    'Coach',
    '2024',
    'coach2024@freegym.gr',
    'trainer',
    NOW(),
    NOW()
);

-- Show the result
SELECT 
    'NEW TRAINER CREATED!' as message,
    u.email as email,
    'password' as password,
    up.first_name,
    up.last_name,
    up.role,
    'Use these credentials to login' as instruction
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'coach2024@freegym.gr';


