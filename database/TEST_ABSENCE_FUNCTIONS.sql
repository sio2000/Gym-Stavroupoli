-- Test the absence system functions
-- First, let's check if we have any schedules with trainers

SELECT 'Checking schedules with trainers...' as status;

SELECT 
    pts.id,
    pts.user_id,
    up.first_name,
    up.last_name,
    up.email,
    pts.schedule_data->'sessions' as sessions
FROM personal_training_schedules pts
JOIN user_profiles up ON pts.user_id = up.user_id
WHERE pts.schedule_data->'sessions' IS NOT NULL
LIMIT 5;

-- Test get_trainer_users function for Mike
SELECT 'Testing get_trainer_users for Mike...' as status;

SELECT * FROM get_trainer_users('Mike') LIMIT 5;

-- Test get_trainer_users function for Jordan
SELECT 'Testing get_trainer_users for Jordan...' as status;

SELECT * FROM get_trainer_users('Jordan') LIMIT 5;

-- Check if we have any schedules with specific trainer names
SELECT 'Checking schedules with specific trainer names...' as status;

SELECT 
    pts.id,
    pts.user_id,
    up.first_name,
    up.last_name,
    up.email,
    jsonb_array_elements(pts.schedule_data->'sessions')->>'trainer' as trainer_name
FROM personal_training_schedules pts
JOIN user_profiles up ON pts.user_id = up.user_id
WHERE pts.schedule_data->'sessions' IS NOT NULL
AND jsonb_array_elements(pts.schedule_data->'sessions')->>'trainer' IS NOT NULL
LIMIT 10;
