-- Alternative approach: Use Supabase's password hashing method
-- This should work better with Supabase authentication

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

-- Try different password hashing methods
-- Method 1: Use pgcrypto with different salt
UPDATE auth.users 
SET 
    encrypted_password = crypt('trainer123', gen_salt('bf', 10)),
    updated_at = NOW()
WHERE email = 'katerina@freegym.gr';

-- Method 2: If that doesn't work, try with md5 (less secure but might work)
-- UPDATE auth.users 
-- SET 
--     encrypted_password = md5('trainer123'),
--     updated_at = NOW()
-- WHERE email = 'katerina@freegym.gr';

-- Ensure the profile is correct
UPDATE public.user_profiles 
SET 
    first_name = 'Katerina',
    last_name = 'Trainer',
    role = 'trainer',
    updated_at = NOW()
WHERE email = 'katerina@freegym.gr';

-- Test password verification
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
    'User password updated' as status
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'katerina@freegym.gr';


