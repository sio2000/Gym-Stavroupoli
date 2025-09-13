-- Final fix for get_trainer_users function to work for both Mike and Jordan
-- This will ensure both trainers can see user names and emails

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_trainer_users(TEXT);

-- Create the final fixed function that works for both trainers
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
    WHERE (
        pts.trainer_name = trainer_name_param 
        OR pts.schedule_data->'sessions' @> ('[{"trainer": "' || trainer_name_param || '"}]')::jsonb
    )
    ORDER BY up.first_name, up.last_name;
END;
$$;

-- Test the fixed function for Jordan
SELECT 
    'Final get_trainer_users for Jordan' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    total_sessions
FROM get_trainer_users('Jordan');

-- Test the fixed function for Mike
SELECT 
    'Final get_trainer_users for Mike' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    total_sessions
FROM get_trainer_users('Mike');

-- Check what trainer_name values exist in the database
SELECT 
    'All trainer names in schedules' as test_name,
    trainer_name,
    COUNT(*) as schedule_count,
    COUNT(DISTINCT user_id) as unique_users
FROM personal_training_schedules 
GROUP BY trainer_name
ORDER BY trainer_name;

-- Check what trainer values exist in schedule_data.sessions
SELECT 
    'Trainer values in schedule_data' as test_name,
    session.value->>'trainer' as session_trainer,
    COUNT(*) as session_count
FROM personal_training_schedules pts,
     jsonb_array_elements(pts.schedule_data->'sessions') as session
GROUP BY session.value->>'trainer'
ORDER BY session.value->>'trainer';
