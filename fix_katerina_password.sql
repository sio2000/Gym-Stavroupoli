-- Fix Katerina's password without creating duplicate users
-- This will update the existing user's password

-- First, let's see what we have
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

-- Update the password for existing user
UPDATE auth.users 
SET 
    encrypted_password = crypt('trainer123', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'katerina@freegym.gr';

-- Update the profile to ensure it's a trainer
UPDATE public.user_profiles 
SET 
    first_name = 'Katerina',
    last_name = 'Trainer',
    role = 'trainer',
    updated_at = NOW()
WHERE email = 'katerina@freegym.gr';

-- Test the password verification
SELECT 
    'Password verification test' as test_type,
    CASE 
        WHEN crypt('trainer123', (SELECT encrypted_password FROM auth.users WHERE email = 'katerina@freegym.gr')) = 
             (SELECT encrypted_password FROM auth.users WHERE email = 'katerina@freegym.gr')
        THEN 'Password verification SUCCESS'
        ELSE 'Password verification FAILED'
    END as verification_result;

-- Show final result
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    up.first_name,
    up.last_name,
    up.role,
    'User updated successfully' as status
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'katerina@freegym.gr';


