-- Simple UPSERT script for trainer Kat
-- Email: kat@freegym.gr
-- Password: trainer123

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
WHERE u.email = 'kat@freegym.gr';

-- Update or insert user profile using UPSERT
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
    'Kat',
    'Trainer',
    'kat@freegym.gr',
    'trainer',
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'kat@freegym.gr'
ON CONFLICT (user_id) 
DO UPDATE SET
    first_name = 'Kat',
    last_name = 'Trainer',
    role = 'trainer',
    updated_at = NOW();

-- Update password for existing user
UPDATE auth.users 
SET 
    encrypted_password = crypt('trainer123', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'kat@freegym.gr';

-- Test password verification
SELECT 
    'Password verification test for Kat' as test_type,
    CASE 
        WHEN crypt('trainer123', (SELECT encrypted_password FROM auth.users WHERE email = 'kat@freegym.gr')) = 
             (SELECT encrypted_password FROM auth.users WHERE email = 'kat@freegym.gr')
        THEN 'Password verification SUCCESS'
        ELSE 'Password verification FAILED'
    END as verification_result;

-- Verify the result
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    up.first_name,
    up.last_name,
    up.role,
    up.created_at,
    up.updated_at
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'kat@freegym.gr';


