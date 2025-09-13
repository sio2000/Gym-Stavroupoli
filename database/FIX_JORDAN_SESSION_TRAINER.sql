-- Fix Jordan's session trainer data in schedule_data JSONB
-- This will update all sessions within Jordan's schedules to have trainer: "Jordan"

-- 1. First, let's see what we have for Jordan
SELECT 
    'Current Jordan Data' as test_name,
    id,
    trainer_name,
    schedule_data->'sessions' as sessions,
    jsonb_array_length(schedule_data->'sessions') as session_count
FROM personal_training_schedules 
WHERE trainer_name = 'Jordan'
ORDER BY created_at DESC;

-- 2. Update all Jordan's schedules to have correct trainer in sessions
UPDATE personal_training_schedules 
SET schedule_data = jsonb_set(
    schedule_data, 
    '{sessions}', 
    (
        SELECT jsonb_agg(
            jsonb_set(
                session, 
                '{trainer}', 
                '"Jordan"'
            )
        )
        FROM jsonb_array_elements(schedule_data->'sessions') as session
    )
)
WHERE trainer_name = 'Jordan' 
AND schedule_data->'sessions' IS NOT NULL;

-- 3. Also update the main trainer field in schedule_data if it exists
UPDATE personal_training_schedules 
SET schedule_data = jsonb_set(
    schedule_data, 
    '{trainer}', 
    '"Jordan"'
)
WHERE trainer_name = 'Jordan' 
AND schedule_data ? 'trainer';

-- 4. Verify the fix
SELECT 
    'Fixed Jordan Data' as test_name,
    id,
    trainer_name,
    schedule_data->'sessions' as sessions,
    jsonb_array_length(schedule_data->'sessions') as session_count
FROM personal_training_schedules 
WHERE trainer_name = 'Jordan'
ORDER BY created_at DESC;

-- 5. Test the filtering logic that frontend uses
SELECT 
    'Jordan Filter Test' as test_name,
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

-- 6. Test get_trainer_users function for Jordan
SELECT 
    'Jordan Users Function Test' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    total_sessions
FROM public.get_trainer_users('Jordan');

-- Success message
SELECT 'Jordan session trainer data fixed!' as message;
