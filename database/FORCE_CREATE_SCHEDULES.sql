/* FORCE CREATE SCHEDULES - ΕΠΙΒΙΑΣΗ ΔΗΜΙΟΥΡΓΙΑΣ ΠΡΟΓΡΑΜΜΑΤΩΝ
   Εκτέλεση στο Supabase SQL Editor */

/* 1. First, let's see what we have */
SELECT 
    'Current State' as test_name,
    COUNT(*) as total_schedules
FROM personal_training_schedules;

/* 2. Get available users */
SELECT 
    'Available Users' as test_name,
    user_id,
    first_name,
    last_name,
    email
FROM user_profiles 
WHERE role = 'user'
ORDER BY created_at DESC
LIMIT 5;

/* 3. Get admin user */
SELECT 
    'Admin User' as test_name,
    user_id,
    first_name,
    last_name,
    email
FROM user_profiles 
WHERE role = 'admin'
ORDER BY created_at DESC
LIMIT 1;

/* 4. Force create schedules for Mike - using specific user IDs */
INSERT INTO personal_training_schedules (
    user_id,
    month,
    year,
    trainer_name,
    schedule_data,
    status,
    created_by
) 
SELECT 
    up.user_id,
    9,
    2025,
    'Mike',
    '{"sessions": [{"date": "2025-09-10", "startTime": "10:00", "endTime": "11:00", "type": "personal", "trainer": "Mike", "room": "Room 1"}, {"date": "2025-09-12", "startTime": "14:00", "endTime": "15:00", "type": "personal", "trainer": "Mike", "room": "Room 2"}]}',
    'accepted',
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1)
FROM user_profiles up
WHERE up.role = 'user'
LIMIT 3;

/* 5. Force create schedules for Jordan */
INSERT INTO personal_training_schedules (
    user_id,
    month,
    year,
    trainer_name,
    schedule_data,
    status,
    created_by
) 
SELECT 
    up.user_id,
    9,
    2025,
    'Jordan',
    '{"sessions": [{"date": "2025-09-11", "startTime": "16:00", "endTime": "17:00", "type": "personal", "trainer": "Jordan", "room": "Room 3"}, {"date": "2025-09-13", "startTime": "18:00", "endTime": "19:00", "type": "personal", "trainer": "Jordan", "room": "Room 4"}]}',
    'accepted',
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1)
FROM user_profiles up
WHERE up.role = 'user'
LIMIT 2;

/* 6. Verify the data was created */
SELECT 
    'Created Schedules' as test_name,
    id,
    user_id,
    trainer_name,
    status,
    created_at
FROM personal_training_schedules 
ORDER BY created_at DESC;

/* 7. Test the exact query that frontend uses */
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

/* 8. Test filtering for Mike */
SELECT 
    'Mike Filter Test' as test_name,
    id,
    trainer_name,
    CASE 
        WHEN trainer_name = 'Mike' THEN 'MATCHES_COLUMN'
        WHEN schedule_data->'sessions' @> '[{"trainer": "Mike"}]' THEN 'MATCHES_JSON'
        ELSE 'NO_MATCH'
    END as match_type
FROM personal_training_schedules 
WHERE trainer_name = 'Mike' 
   OR schedule_data->'sessions' @> '[{"trainer": "Mike"}]';

/* 9. Test filtering for Jordan */
SELECT 
    'Jordan Filter Test' as test_name,
    id,
    trainer_name,
    CASE 
        WHEN trainer_name = 'Jordan' THEN 'MATCHES_COLUMN'
        WHEN schedule_data->'sessions' @> '[{"trainer": "Jordan"}]' THEN 'MATCHES_JSON'
        ELSE 'NO_MATCH'
    END as match_type
FROM personal_training_schedules 
WHERE trainer_name = 'Jordan' 
   OR schedule_data->'sessions' @> '[{"trainer": "Jordan"}]';

/* 10. Test get_trainer_users function */
SELECT 
    'Mike Users Function' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    total_sessions
FROM public.get_trainer_users('Mike');

/* 11. Test Jordan users function */
SELECT 
    'Jordan Users Function' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    total_sessions
FROM public.get_trainer_users('Jordan');

/* Success message */
SELECT 'Force create schedules completed!' as message;
