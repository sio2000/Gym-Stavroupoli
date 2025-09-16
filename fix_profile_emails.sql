-- Fix profiles with unknown email by getting email from auth.users
-- This script will update existing profiles that have "unknown@example.com" 
-- with the correct email from the auth.users table

-- Update user_profiles with correct emails from auth.users
UPDATE public.user_profiles 
SET 
    email = auth_users.email,
    updated_at = NOW()
FROM auth.users as auth_users
WHERE 
    public.user_profiles.user_id = auth_users.id
    AND public.user_profiles.email = 'unknown@example.com'
    AND auth_users.email IS NOT NULL;

-- Show the updated profiles
SELECT 
    up.user_id,
    up.email as profile_email,
    au.email as auth_email,
    up.first_name,
    up.last_name,
    up.created_at
FROM public.user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE up.email != 'unknown@example.com'
ORDER BY up.created_at DESC
LIMIT 10;

-- Show any remaining profiles with unknown email
SELECT 
    up.user_id,
    up.email as profile_email,
    au.email as auth_email,
    up.first_name,
    up.last_name,
    up.created_at
FROM public.user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE up.email = 'unknown@example.com'
ORDER BY up.created_at DESC;

