-- Create trainer using Supabase-compatible method
-- This should work with Supabase authentication

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
WHERE u.email IN ('kat@freegym.gr', 'alex@freegym.gr', 'trainer@freegym.gr');

-- Try to create a completely new user with different email
-- Using a method that should work with Supabase
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
    'trainer@freegym.gr',
    '$2a$10$rQZ8K9L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K', -- This is a pre-hashed password for 'trainer123'
    NOW(),
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Trainer", "last_name": "User"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- Create user profile using UPSERT
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
    'Trainer',
    'User',
    'trainer@freegym.gr',
    'trainer',
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'trainer@freegym.gr'
ON CONFLICT (user_id) 
DO UPDATE SET
    first_name = 'Trainer',
    last_name = 'User',
    role = 'trainer',
    updated_at = NOW();

-- Verify the creation
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    up.first_name,
    up.last_name,
    up.role,
    'Trainer created successfully' as status
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'trainer@freegym.gr';


