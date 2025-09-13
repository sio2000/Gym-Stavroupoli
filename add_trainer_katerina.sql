-- Add new trainer Katerina to the database
-- Email: katerina@freegym.gr
-- Password: trainer123

-- Insert the new trainer into auth.users
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
    'katerina@freegym.gr',
    crypt('trainer123', gen_salt('bf')),
    NOW(),
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Katerina", "last_name": "Trainer", "role": "trainer"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- Insert into user_profiles table (the correct table name)
INSERT INTO public.user_profiles (
    user_id,
    first_name,
    last_name,
    email,
    role,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'katerina@freegym.gr'),
    'Katerina',
    'Trainer',
    'katerina@freegym.gr',
    'trainer',
    NOW(),
    NOW()
);

-- Verify the insertion
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
