-- Add new trainer Lefteris (Λευτέρης) to the database
-- Email: lefteris@freegym.gr
-- Password: trainer123
-- Ισότιμος trainer με Mike/Jordan - ίδιο role, ίδια δικαιώματα.
-- Μοντέλο: add_trainer_katerina.sql

-- Insert the new trainer into auth.users (skip if exists)
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
)
SELECT
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'lefteris@freegym.gr',
    crypt('trainer123', gen_salt('bf')),
    NOW(),
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Λευτέρης", "last_name": "Trainer", "role": "trainer"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'lefteris@freegym.gr');

-- Insert into user_profiles
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
    (SELECT id FROM auth.users WHERE email = 'lefteris@freegym.gr'),
    'Λευτέρης',
    'Trainer',
    'lefteris@freegym.gr',
    'trainer',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE email = 'lefteris@freegym.gr'
);

-- Verification
SELECT u.email, p.first_name, p.role
FROM auth.users u
JOIN public.user_profiles p ON p.user_id = u.id
WHERE u.email = 'lefteris@freegym.gr';
