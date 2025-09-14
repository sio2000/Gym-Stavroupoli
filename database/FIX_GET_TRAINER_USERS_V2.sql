-- Fix get_trainer_users function to return ALL users with schedules for a trainer
-- This will ensure Jordan's panel displays user names and emails correctly

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_trainer_users(TEXT);

-- Create the fixed function that returns ALL users (not just role='user')
CREATE OR REPLACE FUNCTION public.get_trainer_users(trainer_name_param TEXT)
RETURNS TABLE (
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    next_session_date DATE,
    next_session_time TIME,
    next_session_type TEXT,
    next_session_room TEXT,
    total_sessions INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT 
        up.user_id,
        up.first_name,
        up.last_name,
        up.email,
        (pts.schedule_data->'sessions'->0->>'date')::DATE as next_session_date,
        (pts.schedule_data->'sessions'->0->>'startTime')::TIME as next_session_time,
        (pts.schedule_data->'sessions'->0->>'type')::TEXT as next_session_type,
        (pts.schedule_data->'sessions'->0->>'room')::TEXT as next_session_room,
        jsonb_array_length(pts.schedule_data->'sessions')::INTEGER as total_sessions
    FROM user_profiles up
    JOIN personal_training_schedules pts ON up.user_id = pts.user_id
    WHERE pts.trainer_name = trainer_name_param
    ORDER BY up.first_name, up.last_name;
END;
$$;

-- Test the fixed function for Jordan
SELECT 
    'Fixed get_trainer_users for Jordan (ALL users)' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    total_sessions
FROM get_trainer_users('Jordan');

-- Test the fixed function for Mike
SELECT 
    'Fixed get_trainer_users for Mike (ALL users)' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    total_sessions
FROM get_trainer_users('Mike');

-- Check what users exist for Jordan's schedules
SELECT 
    'Manual check for Jordan users' as test_name,
    up.user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.role,
    COUNT(pts.id) as schedule_count
FROM user_profiles up
JOIN personal_training_schedules pts ON up.user_id = pts.user_id
WHERE pts.trainer_name = 'Jordan'
GROUP BY up.user_id, up.first_name, up.last_name, up.email, up.role
ORDER BY up.first_name, up.last_name;
