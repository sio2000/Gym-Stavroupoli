/* TEST PERSONAL TRAINING SCHEDULES - ΔΟΚΙΜΗ PERSONAL TRAINING SCHEDULES
   Εκτέλεση στο Supabase SQL Editor */

/* Check current structure */
SELECT 
    'Table Structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'personal_training_schedules' 
AND table_schema = 'public'
ORDER BY ordinal_position;

/* Test insert a new schedule (like AdminPanel does) */
INSERT INTO personal_training_schedules (
    user_id,
    trainer_name,
    month,
    year,
    schedule_data,
    status,
    created_by
) VALUES (
    '00000000-0000-0000-0000-000000000004',
    'Mike',
    1,
    2025,
    '{"sessions": [{"date": "2025-01-07", "startTime": "10:00", "endTime": "11:00", "type": "Personal Training", "room": "Αίθουσα 3", "trainer": "Mike"}], "notes": "", "trainer": "Mike", "specialInstructions": ""}',
    'pending',
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;

/* Test query that AdminPanel uses */
SELECT 
    'AdminPanel Query Test' as test_name,
    user_id,
    trainer_name,
    month,
    year,
    status,
    created_by,
    schedule_data
FROM personal_training_schedules 
WHERE status = 'pending';

/* Test query with user info */
SELECT 
    'Schedules with User Info' as test_name,
    pts.user_id,
    up.first_name,
    up.last_name,
    up.email,
    pts.trainer_name,
    pts.month,
    pts.year,
    pts.status
FROM personal_training_schedules pts
JOIN user_profiles up ON pts.user_id = up.user_id
WHERE pts.status = 'pending';

/* Check RLS policies */
SELECT 
    'RLS Policies' as test_name,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'personal_training_schedules'
AND schemaname = 'public';

/* Success message */
SELECT 'Personal training schedules test completed!' as message;
