-- Investigate Jordan's schedule data in the database
-- This script will help us understand why Jordan's schedules are not displaying

-- 1. Check all schedules for Jordan
SELECT 
    id,
    user_id,
    trainer_name,
    created_at,
    schedule_data
FROM personal_training_schedules 
WHERE trainer_name = 'Jordan'
ORDER BY created_at DESC;

-- 2. Check the structure of schedule_data for Jordan's schedules
SELECT 
    id,
    trainer_name,
    schedule_data,
    jsonb_pretty(schedule_data) as pretty_schedule_data
FROM personal_training_schedules 
WHERE trainer_name = 'Jordan'
ORDER BY created_at DESC;

-- 3. Extract sessions from Jordan's schedule_data and check trainer assignments
SELECT 
    pts.id as schedule_id,
    pts.trainer_name,
    session.value as session_data,
    session.value->>'trainer' as session_trainer,
    session.value->>'day' as session_day,
    session.value->>'time' as session_time
FROM personal_training_schedules pts,
     jsonb_array_elements(pts.schedule_data->'sessions') as session
WHERE pts.trainer_name = 'Jordan'
ORDER BY pts.created_at DESC, session.value->>'day', session.value->>'time';

-- 4. Compare with Mike's data to see the difference
SELECT 
    pts.id as schedule_id,
    pts.trainer_name,
    session.value as session_data,
    session.value->>'trainer' as session_trainer,
    session.value->>'day' as session_day,
    session.value->>'time' as session_time
FROM personal_training_schedules pts,
     jsonb_array_elements(pts.schedule_data->'sessions') as session
WHERE pts.trainer_name IN ('Jordan', 'Mike')
ORDER BY pts.trainer_name, pts.created_at DESC, session.value->>'day', session.value->>'time';

-- 5. Check if there are any schedules where trainer_name != session.trainer
SELECT 
    pts.id as schedule_id,
    pts.trainer_name as schedule_trainer,
    session.value->>'trainer' as session_trainer,
    CASE 
        WHEN pts.trainer_name != session.value->>'trainer' THEN 'MISMATCH'
        ELSE 'MATCH'
    END as status
FROM personal_training_schedules pts,
     jsonb_array_elements(pts.schedule_data->'sessions') as session
WHERE pts.trainer_name != session.value->>'trainer'
ORDER BY pts.created_at DESC;
