-- Create trainer with FRESH email
-- This will definitely work!

-- Create trainer with completely fresh email
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
    'trainer2024@freegym.gr',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Hash for 'password'
    NOW(),
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Trainer", "last_name": "2024"}',
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
    (SELECT id FROM auth.users WHERE email = 'trainer2024@freegym.gr'),
    'Trainer',
    '2024',
    'trainer2024@freegym.gr',
    'trainer',
    NOW(),
    NOW()
);

-- Show the result
SELECT 
    'TRAINER CREATED SUCCESSFULLY!' as message,
    u.email as email,
    'password' as password,
    up.first_name,
    up.last_name,
    up.role,
    'Login with these credentials' as instruction
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'trainer2024@freegym.gr';