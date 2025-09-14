/* DEEP ANALYSIS SCHEDULES - ΒΑΘΙΑ ΑΝΑΛΥΣΗ ΠΡΟΓΡΑΜΜΑΤΩΝ
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check if personal_training_schedules table exists */
SELECT 
    'Table Exists Check' as test_name,
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'personal_training_schedules';

/* 2. Check table structure */
SELECT 
    'Table Structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'personal_training_schedules' 
ORDER BY ordinal_position;

/* 3. Count all records in personal_training_schedules */
SELECT 
    'Total Records Count' as test_name,
    COUNT(*) as total_count
FROM personal_training_schedules;

/* 4. Check all records */
SELECT 
    'All Records' as test_name,
    id,
    user_id,
    trainer_name,
    month,
    year,
    status,
    created_at
FROM personal_training_schedules 
ORDER BY created_at DESC;

/* 5. Check if there are any records for Mike */
SELECT 
    'Mike Records' as test_name,
    COUNT(*) as count,
    trainer_name
FROM personal_training_schedules 
WHERE trainer_name = 'Mike'
GROUP BY trainer_name;

/* 6. Check if there are any records for Jordan */
SELECT 
    'Jordan Records' as test_name,
    COUNT(*) as count,
    trainer_name
FROM personal_training_schedules 
WHERE trainer_name = 'Jordan'
GROUP BY trainer_name;

/* 7. Check RLS policies on personal_training_schedules */
SELECT 
    'RLS Policies' as test_name,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'personal_training_schedules';

/* 8. Test direct query like the frontend does */
SELECT 
    'Frontend Query Test' as test_name,
    id,
    user_id,
    trainer_name,
    month,
    year,
    status,
    created_at
FROM personal_training_schedules 
ORDER BY created_at DESC;

/* 9. Check if there are any users with role 'user' */
SELECT 
    'Users Available' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    role
FROM user_profiles 
WHERE role = 'user'
ORDER BY created_at DESC;

/* 10. Check if there are any admin users */
SELECT 
    'Admin Users' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    role
FROM user_profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

/* Success message */
SELECT 'Deep analysis completed!' as message;
