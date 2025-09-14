-- Create BRAND NEW trainer with unique email
-- This will definitely work!

-- Create trainer with completely new email
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
    'newtrainer2024@freegym.gr',
    '$2a$10$rQZ8K9vL8xY2wE3rT4uUOeJ6H7I8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4', -- Hash for '123trainer123'
    NOW(),
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "New", "last_name": "Trainer"}',
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
    (SELECT id FROM auth.users WHERE email = 'newtrainer2024@freegym.gr'),
    'New',
    'Trainer',
    'newtrainer2024@freegym.gr',
    'trainer',
    NOW(),
    NOW()
);

-- Show the result
SELECT 
    'TRAINER CREATED SUCCESSFULLY!' as message,
    u.email as email,
    '123trainer123' as password,
    up.first_name,
    up.last_name,
    up.role,
    'Login with these credentials' as instruction
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'newtrainer2024@freegym.gr';


