-- TEST USERS - ΔΟΚΙΜΗ ΧΡΗΣΤΩΝ
-- Εκτέλεση στο Supabase SQL Editor

-- Check all users
SELECT 
    u.id,
    u.email,
    up.first_name,
    up.last_name,
    up.role,
    u.created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
ORDER BY up.role, up.first_name;

-- Check personal training schedules
SELECT 
    pts.id,
    up.first_name,
    up.last_name,
    pts.trainer_name,
    pts.status,
    pts.schedule_data
FROM personal_training_schedules pts
JOIN user_profiles up ON pts.user_id = up.user_id;

-- Check if RLS policies are working
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test simple query
SELECT COUNT(*) as total_users FROM user_profiles;
SELECT COUNT(*) as total_schedules FROM personal_training_schedules;

-- Success message
SELECT 'User test completed!' as message;
