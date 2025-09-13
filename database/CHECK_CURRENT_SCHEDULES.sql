-- CHECK CURRENT SCHEDULES - See what trainer names exist in the database

-- Step 1: Check all schedules and their trainer names
SELECT 'Current schedules with trainer names:' as step,
       id,
       user_id,
       schedule_data->'sessions'->0->>'trainer' as first_session_trainer,
       schedule_data->'sessions'->0->>'date' as first_session_date,
       schedule_data->'sessions'->0->>'startTime' as first_session_start_time,
       schedule_data->'sessions'->0->>'endTime' as first_session_end_time
FROM personal_training_schedules 
WHERE schedule_data->'sessions' IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Step 2: Count schedules by trainer name
SELECT 'Schedules by trainer name:' as step,
       schedule_data->'sessions'->0->>'trainer' as trainer_name,
       COUNT(*) as count
FROM personal_training_schedules 
WHERE schedule_data->'sessions' IS NOT NULL
GROUP BY schedule_data->'sessions'->0->>'trainer'
ORDER BY count DESC;

-- Step 3: Check if there are any schedules at all
SELECT 'Total schedules count:' as step,
       COUNT(*) as total_schedules
FROM personal_training_schedules;

-- Step 4: Check schedules with any trainer name (not just first session)
SELECT 'All trainer names in all sessions:' as step,
       session->>'trainer' as trainer_name,
       COUNT(*) as count
FROM personal_training_schedules,
     jsonb_array_elements(schedule_data->'sessions') as session
GROUP BY session->>'trainer'
ORDER BY count DESC;
