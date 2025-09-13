/* TEST TRAINER PANEL - ΔΟΚΙΜΗ TRAINER PANEL
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check if Mike trainer exists */
SELECT 
    'Mike Trainer Check' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    role
FROM user_profiles 
WHERE email = 'mike@freegym.gr' 
   OR first_name = 'Mike';

/* 2. Check if Jordan trainer exists */
SELECT 
    'Jordan Trainer Check' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    role
FROM user_profiles 
WHERE email = 'jordan@freegym.gr' 
   OR first_name = 'Jordan';

/* 3. Create sample personal training schedules for Mike */
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
LIMIT 3
ON CONFLICT DO NOTHING;

/* 4. Create sample personal training schedules for Jordan */
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
LIMIT 2
ON CONFLICT DO NOTHING;

/* 5. Test get_trainer_users function for Mike */
SELECT 
    'Mike Users Test' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    next_session_date,
    next_session_time,
    total_sessions
FROM public.get_trainer_users('Mike')
LIMIT 5;

/* 6. Test get_trainer_users function for Jordan */
SELECT 
    'Jordan Users Test' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    next_session_date,
    next_session_time,
    total_sessions
FROM public.get_trainer_users('Jordan')
LIMIT 5;

/* 7. Check all personal training schedules */
SELECT 
    'All Schedules' as test_name,
    id,
    user_id,
    trainer_name,
    status,
    created_at
FROM personal_training_schedules 
ORDER BY created_at DESC;

/* 8. Check schedules by trainer */
SELECT 
    'Schedules by Trainer' as test_name,
    trainer_name,
    COUNT(*) as schedule_count,
    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_count
FROM personal_training_schedules 
GROUP BY trainer_name;

/* Success message */
SELECT 'Trainer panel test completed!' as message;
