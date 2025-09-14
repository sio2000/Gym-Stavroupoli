-- Create trainer Alex with different email
-- Email: alex@freegym.gr
-- Password: trainer123

-- First, check if user already exists
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    up.first_name,
    up.last_name,
    up.role
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'alex@freegym.gr';

-- Create the user in auth.users
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
    'alex@freegym.gr',
    crypt('trainer123', gen_salt('bf')),
    NOW(),
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Alex", "last_name": "Trainer"}',
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
    (SELECT id FROM auth.users WHERE email = 'alex@freegym.gr'),
    'Alex',
    'Trainer',
    'alex@freegym.gr',
    'trainer',
    NOW(),
    NOW()
);

-- Test password verification
SELECT 
    'Password verification test for Alex' as test_type,
    CASE 
        WHEN crypt('trainer123', (SELECT encrypted_password FROM auth.users WHERE email = 'alex@freegym.gr')) = 
             (SELECT encrypted_password FROM auth.users WHERE email = 'alex@freegym.gr')
        THEN 'Password verification SUCCESS'
        ELSE 'Password verification FAILED'
    END as verification_result;

-- Verify the creation
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    up.first_name,
    up.last_name,
    up.role,
    'Trainer Alex created successfully' as status
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'alex@freegym.gr';


