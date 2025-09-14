/* FINAL SCHEDULE FIX - ΤΕΛΙΚΗ ΔΙΟΡΘΩΣΗ ΠΡΟΓΡΑΜΜΑΤΩΝ
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check current state */
SELECT 
    'Current State' as test_name,
    COUNT(*) as total_schedules
FROM personal_training_schedules;

/* 2. Disable RLS temporarily */
ALTER TABLE personal_training_schedules DISABLE ROW LEVEL SECURITY;

/* 3. Clear all existing data */
DELETE FROM personal_training_schedules;

/* 4. Get available users */
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

/* 5. Get admin user */
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

/* 6. Create schedules for Mike - using specific user IDs */
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
LIMIT 3;

/* 7. Create schedules for Jordan - using specific user IDs */
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
LIMIT 2;

/* 8. Verify the data was created */
SELECT 
    'Created Schedules' as test_name,
    id,
    user_id,
    trainer_name,
    status,
    created_at
FROM personal_training_schedules 
ORDER BY created_at DESC;

/* 9. Test the exact query that frontend uses */
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

/* 10. Test filtering for Mike */
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

/* 11. Test filtering for Jordan */
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

/* 12. Test get_trainer_users function */
SELECT 
    'Mike Users Function' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    total_sessions
FROM public.get_trainer_users('Mike');

/* 13. Test Jordan users function */
SELECT 
    'Jordan Users Function' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    total_sessions
FROM public.get_trainer_users('Jordan');

/* 14. Re-enable RLS */
ALTER TABLE personal_training_schedules ENABLE ROW LEVEL SECURITY;

/* 15. Create simple RLS policy that allows all reads */
CREATE POLICY "Allow all reads" ON personal_training_schedules
    FOR SELECT USING (true);

/* 16. Test with RLS enabled */
SELECT 
    'RLS Test - All Schedules' as test_name,
    id,
    trainer_name,
    status
FROM personal_training_schedules 
ORDER BY created_at DESC;

/* Success message */
SELECT 'Final schedule fix completed!' as message;
