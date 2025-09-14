-- Test ultra simple absence functions
-- First, let's check what schedules we have

SELECT 'Current schedules with trainers:' as status;

SELECT 
    pts.id,
    pts.user_id,
    up.first_name,
    up.last_name,
    up.email,
    jsonb_array_elements(pts.schedule_data->'sessions')->>'trainer' as trainer_name,
    jsonb_array_elements(pts.schedule_data->'sessions')->>'date' as session_date,
    jsonb_array_elements(pts.schedule_data->'sessions')->>'startTime' as session_time
FROM personal_training_schedules pts
JOIN user_profiles up ON pts.user_id = up.user_id
WHERE pts.schedule_data->'sessions' IS NOT NULL
ORDER BY pts.created_at DESC
LIMIT 10;

-- Test the ultra simple get_trainer_users function
SELECT 'Testing get_trainer_users for Mike:' as status;
SELECT * FROM get_trainer_users('Mike') LIMIT 5;

SELECT 'Testing get_trainer_users for Jordan:' as status;
SELECT * FROM get_trainer_users('Jordan') LIMIT 5;