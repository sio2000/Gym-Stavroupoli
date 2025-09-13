-- Simple version of get_trainer_users function
-- This script should be run in Supabase SQL Editor

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_trainer_users(VARCHAR(50));

-- Create a simpler version that returns basic user info
CREATE OR REPLACE FUNCTION get_trainer_users(trainer_name_param VARCHAR(50))
RETURNS TABLE (
    user_id UUID,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    next_session_date TEXT,
    next_session_time TEXT,
    next_session_type TEXT,
    next_session_room TEXT,
    total_sessions INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        up.user_id,
        up.first_name,
        up.last_name,
        up.email,
        COALESCE(jsonb_array_elements(pts.schedule_data->'sessions')->>'date', '') as next_session_date,
        COALESCE(jsonb_array_elements(pts.schedule_data->'sessions')->>'startTime', '') as next_session_time,
        COALESCE(jsonb_array_elements(pts.schedule_data->'sessions')->>'type', '') as next_session_type,
        COALESCE(jsonb_array_elements(pts.schedule_data->'sessions')->>'room', '') as next_session_room,
        COALESCE(jsonb_array_length(pts.schedule_data->'sessions'), 0) as total_sessions
    FROM user_profiles up
    JOIN personal_training_schedules pts ON up.user_id = pts.user_id
    WHERE 
        pts.schedule_data->'sessions' @> ('[{"trainer": "' || trainer_name_param || '"}]')::jsonb
        AND pts.status = 'accepted'
        AND up.role = 'user'
    ORDER BY up.first_name, up.last_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT 'Testing simple get_trainer_users function...' as status;

-- Test for Mike
SELECT * FROM get_trainer_users('Mike') LIMIT 3;

-- Test for Jordan  
SELECT * FROM get_trainer_users('Jordan') LIMIT 3;

-- Check if there are any schedules at all
SELECT 'Checking all schedules...' as status;
SELECT 
    id,
    user_id,
    status,
    schedule_data->'sessions' as sessions
FROM personal_training_schedules 
LIMIT 5;
