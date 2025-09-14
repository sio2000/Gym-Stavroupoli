-- Check user_profiles table structure and data
-- This will help us understand why users are not found

-- 1. Check user_profiles table structure
SELECT 
    'User Profiles Structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check all users in user_profiles
SELECT 
    'All Users' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    role,
    created_at
FROM user_profiles 
ORDER BY created_at DESC;

-- 3. Check users with role 'user' (should be found by get_trainer_users)
SELECT 
    'Users with role=user' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    role
FROM user_profiles 
WHERE role = 'user'
ORDER BY first_name, last_name;

-- 4. Check if any of Jordan's schedule user_ids exist in user_profiles
SELECT 
    'Jordan Schedule Users in Profiles' as test_name,
    pts.user_id as schedule_user_id,
    up.user_id as profile_user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.role,
    pts.status as schedule_status
FROM personal_training_schedules pts
LEFT JOIN user_profiles up ON pts.user_id = up.user_id
WHERE pts.trainer_name = 'Jordan'
ORDER BY pts.created_at DESC;
