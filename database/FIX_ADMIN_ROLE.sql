/* FIX ADMIN ROLE - ΔΙΟΡΘΩΣΗ ADMIN ROLE
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check current admin users */
SELECT 
    'Current Admin Users' as test_name,
    id,
    email,
    raw_user_meta_data->>'role' as role_from_metadata,
    raw_user_meta_data
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'admin'
   OR email LIKE '%admin%'
   OR email LIKE '%trainer%';

/* 2. Update admin users to have correct role in metadata */
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'admin@freegym.gr' 
   OR email LIKE '%admin%';

/* 3. Update trainer users to have correct role in metadata */
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "trainer"}'::jsonb
WHERE email = 'trainer1@freegym.gr' 
   OR email LIKE '%trainer%';

/* 4. Check updated users */
SELECT 
    'Updated Users' as test_name,
    id,
    email,
    raw_user_meta_data->>'role' as role_from_metadata,
    raw_user_meta_data
FROM auth.users 
WHERE raw_user_meta_data->>'role' IN ('admin', 'trainer');

/* 5. Also update user_profiles table to match */
UPDATE user_profiles 
SET role = 'admin'
WHERE email = 'admin@freegym.gr' 
   OR email LIKE '%admin%';

UPDATE user_profiles 
SET role = 'trainer'
WHERE email = 'trainer1@freegym.gr' 
   OR email LIKE '%trainer%';

/* 6. Check updated profiles */
SELECT 
    'Updated Profiles' as test_name,
    user_id,
    email,
    role,
    first_name,
    last_name
FROM user_profiles 
WHERE role IN ('admin', 'trainer');

/* Success message */
SELECT 'Admin role fixed!' as message;
