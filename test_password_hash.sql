-- Test password hashing to make sure it works
-- This will help us understand if the password is being hashed correctly

-- Test the password hashing function
SELECT 
    'trainer123' as plain_password,
    crypt('trainer123', gen_salt('bf')) as hashed_password,
    'Password hashing test' as test_type;

-- Check if we can verify the password
SELECT 
    'Password verification test' as test_type,
    CASE 
        WHEN crypt('trainer123', (SELECT encrypted_password FROM auth.users WHERE email = 'katerina@freegym.gr')) = 
             (SELECT encrypted_password FROM auth.users WHERE email = 'katerina@freegym.gr')
        THEN 'Password verification SUCCESS'
        ELSE 'Password verification FAILED'
    END as verification_result;

-- Show current user data
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.encrypted_password,
    up.first_name,
    up.last_name,
    up.role
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'katerina@freegym.gr';


