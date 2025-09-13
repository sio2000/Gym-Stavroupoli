-- Clean up test data from personal_training_schedules
-- This script should be run in Supabase SQL Editor with admin privileges

-- First, let's see what data we have
SELECT 
    id,
    user_id,
    month,
    year,
    status,
    created_at,
    schedule_data->'sessions' as sessions
FROM personal_training_schedules 
ORDER BY created_at DESC 
LIMIT 10;

-- Delete test data (schedules created for testing)
-- We'll delete schedules that have test users or test content
DELETE FROM personal_training_schedules 
WHERE 
    -- Delete schedules with test users
    user_id IN (
        SELECT user_id FROM user_profiles 
        WHERE email LIKE '%test%' 
        OR email LIKE '%example%'
        OR first_name = 'Test'
        OR last_name = 'User'
    )
    OR
    -- Delete schedules with test session IDs
    schedule_data->'sessions' @> '[{"id": "mike-session-1"}]'
    OR schedule_data->'sessions' @> '[{"id": "jordan-session-1"}]'
    OR schedule_data->'sessions' @> '[{"id": "mike-session-2"}]'
    OR schedule_data->'sessions' @> '[{"id": "jordan-session-2"}]'
    OR schedule_data->'sessions' @> '[{"id": "mike-session-3"}]'
    OR schedule_data->'sessions' @> '[{"id": "jordan-session-3"}]'
    OR schedule_data->'sessions' @> '[{"id": "mike-session-4"}]'
    OR schedule_data->'sessions' @> '[{"id": "session-3"}]'
    OR schedule_data->'sessions' @> '[{"id": "tmp-1"}]'
    OR
    -- Delete schedules with test notes
    schedule_data->>'notes' LIKE '%test%'
    OR schedule_data->>'notes' LIKE '%Test%'
    OR schedule_data->>'specialInstructions' LIKE '%test%'
    OR schedule_data->>'specialInstructions' LIKE '%Test%';

-- Also clean up test users if they exist
DELETE FROM user_profiles 
WHERE 
    email LIKE '%test%' 
    OR email LIKE '%example%'
    OR (first_name = 'Test' AND last_name = 'User')
    OR (first_name = 'New' AND last_name = 'User');

-- Verify cleanup
SELECT 
    id,
    user_id,
    month,
    year,
    status,
    created_at,
    schedule_data->'sessions' as sessions
FROM personal_training_schedules 
ORDER BY created_at DESC 
LIMIT 10;

-- Check remaining schedules for Mike and Jordan
SELECT 
    id,
    user_id,
    month,
    year,
    status,
    jsonb_array_elements(schedule_data->'sessions')->>'trainer' as trainer,
    jsonb_array_elements(schedule_data->'sessions')->>'startTime' as start_time,
    jsonb_array_elements(schedule_data->'sessions')->>'endTime' as end_time,
    jsonb_array_elements(schedule_data->'sessions')->>'date' as session_date
FROM personal_training_schedules 
WHERE schedule_data->'sessions' @> '[{"trainer": "Mike"}]' 
   OR schedule_data->'sessions' @> '[{"trainer": "Jordan"}]'
ORDER BY created_at DESC;
