-- Fix existing profiles with correct email and names from auth.users
-- This script will update all profiles that have "unknown@example.com" or "User" 
-- with the correct data from the auth.users table

-- Update user_profiles with correct data from auth.users
UPDATE public.user_profiles 
SET 
    email = COALESCE(auth_users.email, user_profiles.email),
    first_name = COALESCE(auth_users.raw_user_meta_data->>'first_name', user_profiles.first_name),
    last_name = COALESCE(auth_users.raw_user_meta_data->>'last_name', user_profiles.last_name),
    phone = COALESCE(auth_users.raw_user_meta_data->>'phone', user_profiles.phone),
    updated_at = NOW()
FROM auth.users as auth_users
WHERE 
    public.user_profiles.user_id = auth_users.id
    AND (
        public.user_profiles.email = 'unknown@example.com' 
        OR public.user_profiles.first_name = 'User'
        OR public.user_profiles.last_name = ''
    )
    AND auth_users.email IS NOT NULL;

-- Show the updated profiles
SELECT 
    up.user_id,
    up.email as profile_email,
    au.email as auth_email,
    up.first_name as profile_first_name,
    au.raw_user_meta_data->>'first_name' as auth_first_name,
    up.last_name as profile_last_name,
    au.raw_user_meta_data->>'last_name' as auth_last_name,
    up.created_at
FROM public.user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE up.email != 'unknown@example.com'
ORDER BY up.created_at DESC
LIMIT 10;

-- Show any remaining profiles with unknown data
SELECT 
    up.user_id,
    up.email as profile_email,
    au.email as auth_email,
    up.first_name as profile_first_name,
    au.raw_user_meta_data->>'first_name' as auth_first_name,
    up.last_name as profile_last_name,
    au.raw_user_meta_data->>'last_name' as auth_last_name,
    up.created_at
FROM public.user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE up.email = 'unknown@example.com' OR up.first_name = 'User'
ORDER BY up.created_at DESC;

