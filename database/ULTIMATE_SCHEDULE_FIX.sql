/* ULTIMATE SCHEDULE FIX - ΤΕΛΙΚΗ ΔΙΟΡΘΩΣΗ ΠΡΟΓΡΑΜΜΑΤΩΝ
   Εκτέλεση στο Supabase SQL Editor */

/* 1. First, let's check what we have */
SELECT 
    'Current State' as test_name,
    COUNT(*) as total_schedules
FROM personal_training_schedules;

/* 2. Check RLS policies on personal_training_schedules */
SELECT 
    'RLS Policies' as test_name,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'personal_training_schedules';

/* 3. Temporarily disable RLS to test */
ALTER TABLE personal_training_schedules DISABLE ROW LEVEL SECURITY;

/* 4. Clear existing data */
DELETE FROM personal_training_schedules WHERE trainer_name IN ('Mike', 'Jordan');

/* 5. Get available users */
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

/* 6. Get admin user */
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

/* 7. Create schedules for Mike */
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

/* 8. Create schedules for Jordan */
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

/* 9. Verify the data was created */
SELECT 
    'Created Schedules' as test_name,
    id,
    user_id,
    trainer_name,
    status,
    created_at
FROM personal_training_schedules 
ORDER BY created_at DESC;

/* 10. Test the exact query that frontend uses */
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

/* 11. Test filtering for Mike */
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

/* 12. Test filtering for Jordan */
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

/* 13. Test get_trainer_users function */
SELECT 
    'Mike Users Function' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    total_sessions
FROM public.get_trainer_users('Mike');

/* 14. Test Jordan users function */
SELECT 
    'Jordan Users Function' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    total_sessions
FROM public.get_trainer_users('Jordan');

/* 15. Re-enable RLS with proper policies */
ALTER TABLE personal_training_schedules ENABLE ROW LEVEL SECURITY;

/* 16. Drop existing policies */
DROP POLICY IF EXISTS "Users can view own schedules" ON personal_training_schedules;
DROP POLICY IF EXISTS "Trainers can view their schedules" ON personal_training_schedules;
DROP POLICY IF EXISTS "Admins can view all schedules" ON personal_training_schedules;

/* 17. Create new RLS policies */
CREATE POLICY "Trainers can view their schedules" ON personal_training_schedules
    FOR SELECT USING (
        trainer_name = (
            SELECT first_name 
            FROM user_profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all schedules" ON personal_training_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Users can view own schedules" ON personal_training_schedules
    FOR SELECT USING (
        user_id = auth.uid()
    );

/* 18. Test with RLS enabled */
SELECT 
    'RLS Test - Mike' as test_name,
    id,
    trainer_name,
    status
FROM personal_training_schedules 
WHERE trainer_name = 'Mike';

/* 19. Test with RLS enabled for Jordan */
SELECT 
    'RLS Test - Jordan' as test_name,
    id,
    trainer_name,
    status
FROM personal_training_schedules 
WHERE trainer_name = 'Jordan';

/* Success message */
SELECT 'Ultimate schedule fix completed!' as message;
