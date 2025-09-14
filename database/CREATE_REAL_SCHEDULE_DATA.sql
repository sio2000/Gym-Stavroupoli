/* CREATE REAL SCHEDULE DATA - ΔΗΜΙΟΥΡΓΙΑ ΠΡΑΓΜΑΤΙΚΩΝ ΔΕΔΟΜΕΝΩΝ ΠΡΟΓΡΑΜΜΑΤΟΣ
   Εκτέλεση στο Supabase SQL Editor */

/* 1. First, let's see what users we have */
SELECT 
    'Available Users' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    role
FROM user_profiles 
WHERE role = 'user'
ORDER BY created_at DESC;

/* 2. Create comprehensive schedule data for Mike */
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
    '{"sessions": [{"date": "2025-09-10", "startTime": "10:00", "endTime": "11:00", "type": "personal", "trainer": "Mike", "room": "Room 1"}, {"date": "2025-09-12", "startTime": "14:00", "endTime": "15:00", "type": "personal", "trainer": "Mike", "room": "Room 2"}, {"date": "2025-09-15", "startTime": "16:00", "endTime": "17:00", "type": "personal", "trainer": "Mike", "room": "Room 1"}]}',
    'accepted',
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1)
FROM user_profiles up
WHERE up.role = 'user'
LIMIT 3
ON CONFLICT DO NOTHING;

/* 3. Create comprehensive schedule data for Jordan */
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
    '{"sessions": [{"date": "2025-09-11", "startTime": "16:00", "endTime": "17:00", "type": "personal", "trainer": "Jordan", "room": "Room 3"}, {"date": "2025-09-13", "startTime": "18:00", "endTime": "19:00", "type": "personal", "trainer": "Jordan", "room": "Room 4"}, {"date": "2025-09-16", "startTime": "19:00", "endTime": "20:00", "type": "personal", "trainer": "Jordan", "room": "Room 3"}]}',
    'accepted',
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1)
FROM user_profiles up
WHERE up.role = 'user'
LIMIT 2
ON CONFLICT DO NOTHING;

/* 4. Verify the data was created */
SELECT 
    'Created Schedules' as test_name,
    id,
    user_id,
    trainer_name,
    status,
    created_at
FROM personal_training_schedules 
ORDER BY created_at DESC;

/* 5. Test the filtering logic that the frontend uses */
SELECT 
    'Mike Schedules Filter Test' as test_name,
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

/* 6. Test Jordan filtering */
SELECT 
    'Jordan Schedules Filter Test' as test_name,
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

/* 7. Test get_trainer_users function */
SELECT 
    'Mike Users Function Test' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    total_sessions
FROM public.get_trainer_users('Mike');

/* 8. Test Jordan users function */
SELECT 
    'Jordan Users Function Test' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    total_sessions
FROM public.get_trainer_users('Jordan');

/* Success message */
SELECT 'Real schedule data created and tested!' as message;
