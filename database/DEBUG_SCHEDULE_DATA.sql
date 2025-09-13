/* DEBUG SCHEDULE DATA - ΑΠΟΣΑΦΑΛΙΣΜΟΣ ΔΕΔΟΜΕΝΩΝ ΠΡΟΓΡΑΜΜΑΤΟΣ
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check all personal training schedules */
SELECT 
    'All Schedules' as test_name,
    id,
    user_id,
    trainer_name,
    month,
    year,
    status,
    created_at
FROM personal_training_schedules 
ORDER BY created_at DESC;

/* 2. Check specific schedules for Mike */
SELECT 
    'Mike Schedules' as test_name,
    id,
    user_id,
    trainer_name,
    status,
    schedule_data
FROM personal_training_schedules 
WHERE trainer_name = 'Mike'
ORDER BY created_at DESC;

/* 3. Check specific schedules for Jordan */
SELECT 
    'Jordan Schedules' as test_name,
    id,
    user_id,
    trainer_name,
    status,
    schedule_data
FROM personal_training_schedules 
WHERE trainer_name = 'Jordan'
ORDER BY created_at DESC;

/* 4. Check if schedules have the right structure */
SELECT 
    'Schedule Structure Check' as test_name,
    id,
    trainer_name,
    schedule_data->'sessions' as sessions,
    jsonb_array_length(schedule_data->'sessions') as session_count
FROM personal_training_schedules 
WHERE trainer_name IN ('Mike', 'Jordan')
LIMIT 5;

/* 5. Test the exact filtering logic used in frontend */
SELECT 
    'Frontend Filter Test - Mike' as test_name,
    id,
    trainer_name,
    CASE 
        WHEN trainer_name = 'Mike' THEN 'MATCHES_COLUMN'
        WHEN schedule_data->'sessions' @> '[{"trainer": "Mike"}]' THEN 'MATCHES_JSON'
        ELSE 'NO_MATCH'
    END as match_type,
    schedule_data->'sessions' as sessions
FROM personal_training_schedules 
WHERE trainer_name = 'Mike' 
   OR schedule_data->'sessions' @> '[{"trainer": "Mike"}]';

/* 6. Test Jordan filtering */
SELECT 
    'Frontend Filter Test - Jordan' as test_name,
    id,
    trainer_name,
    CASE 
        WHEN trainer_name = 'Jordan' THEN 'MATCHES_COLUMN'
        WHEN schedule_data->'sessions' @> '[{"trainer": "Jordan"}]' THEN 'MATCHES_JSON'
        ELSE 'NO_MATCH'
    END as match_type,
    schedule_data->'sessions' as sessions
FROM personal_training_schedules 
WHERE trainer_name = 'Jordan' 
   OR schedule_data->'sessions' @> '[{"trainer": "Jordan"}]';

/* 7. Check users that should have schedules */
SELECT 
    'Users with Schedules' as test_name,
    up.first_name,
    up.last_name,
    up.email,
    pts.trainer_name,
    pts.status,
    jsonb_array_length(pts.schedule_data->'sessions') as session_count
FROM user_profiles up
JOIN personal_training_schedules pts ON up.user_id = pts.user_id
WHERE pts.trainer_name IN ('Mike', 'Jordan')
ORDER BY pts.created_at DESC;

/* 8. Test get_trainer_users function */
SELECT 
    'Function Test - Mike' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    total_sessions
FROM public.get_trainer_users('Mike');

/* 9. Test Jordan function */
SELECT 
    'Function Test - Jordan' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    total_sessions
FROM public.get_trainer_users('Jordan');

/* Success message */
SELECT 'Schedule data debugging completed!' as message;
