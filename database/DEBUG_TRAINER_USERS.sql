-- Debug script to understand why trainer users are not found
-- This will help us fix the Jordan trainer panel issue

-- 1. Check all schedules for Jordan with their status
SELECT 
    'Jordan Schedules Status' as test_name,
    id,
    user_id,
    trainer_name,
    status,
    created_at
FROM personal_training_schedules 
WHERE trainer_name = 'Jordan'
ORDER BY created_at DESC;

-- 2. Check what users exist in user_profiles for Jordan's user_ids
SELECT 
    'Users for Jordan Schedules' as test_name,
    up.user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.role
FROM user_profiles up
WHERE up.user_id IN (
    SELECT DISTINCT user_id 
    FROM personal_training_schedules 
    WHERE trainer_name = 'Jordan'
);

-- 3. Test the get_trainer_users function for Jordan
SELECT 
    'get_trainer_users for Jordan' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    total_sessions
FROM get_trainer_users('Jordan');

-- 4. Check what the function should return (manual query)
SELECT 
    'Manual Query for Jordan Users' as test_name,
    up.user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.role,
    pts.status as schedule_status
FROM user_profiles up
JOIN personal_training_schedules pts ON up.user_id = pts.user_id
WHERE pts.trainer_name = 'Jordan'
ORDER BY up.first_name, up.last_name;

-- 5. Check if there are any accepted schedules for Jordan
SELECT 
    'Accepted Schedules for Jordan' as test_name,
    COUNT(*) as total_accepted,
    COUNT(DISTINCT user_id) as unique_users_accepted
FROM personal_training_schedules 
WHERE trainer_name = 'Jordan' 
AND status = 'accepted';

-- 6. Check if there are any pending schedules for Jordan
SELECT 
    'Pending Schedules for Jordan' as test_name,
    COUNT(*) as total_pending,
    COUNT(DISTINCT user_id) as unique_users_pending
FROM personal_training_schedules 
WHERE trainer_name = 'Jordan' 
AND status = 'pending';
