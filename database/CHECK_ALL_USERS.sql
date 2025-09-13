-- CHECK ALL USERS - ΕΛΕΓΧΟΣ ΟΛΩΝ ΤΩΝ ΧΡΗΣΤΩΝ
-- Εκτέλεση στο Supabase SQL Editor

-- Check all users in auth.users
SELECT 
    'Auth Users' as table_name,
    COUNT(*) as count
FROM auth.users;

-- Check all profiles in user_profiles
SELECT 
    'User Profiles' as table_name,
    COUNT(*) as count
FROM user_profiles;

-- Check users without profiles
SELECT 
    'Users Without Profiles' as issue,
    u.id,
    u.email,
    u.created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL;

-- Check profiles without users (shouldn't happen)
SELECT 
    'Profiles Without Users' as issue,
    up.user_id,
    up.email,
    up.created_at
FROM user_profiles up
LEFT JOIN auth.users u ON up.user_id = u.id
WHERE u.id IS NULL;

-- Show all users with their profiles
SELECT 
    'All Users and Profiles' as summary,
    u.email,
    u.created_at as auth_created,
    up.first_name,
    up.last_name,
    up.role,
    up.created_at as profile_created,
    CASE 
        WHEN up.user_id IS NOT NULL THEN 'Profile Exists'
        ELSE 'Missing Profile'
    END as status
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
ORDER BY u.created_at DESC;

-- Success message
SELECT 'User check completed!' as message;
