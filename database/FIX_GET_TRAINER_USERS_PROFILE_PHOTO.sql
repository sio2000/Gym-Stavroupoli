/* FIX_GET_TRAINER_USERS_PROFILE_PHOTO - Διόρθωση get_trainer_users για profile_photo
   Εκτέλεση στο Supabase SQL Editor */

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_trainer_users(text);

-- Create updated function with profile_photo (existing column)
CREATE OR REPLACE FUNCTION public.get_trainer_users(trainer_name_param TEXT)
RETURNS TABLE (
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    profile_photo TEXT,
    next_session_date TEXT,
    next_session_time TEXT,
    next_session_type TEXT,
    next_session_room TEXT,
    total_sessions BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        up.user_id,
        up.first_name,
        up.last_name,
        up.email,
        up.profile_photo,
        COALESCE(
            (SELECT (session->>'date')::TEXT
             FROM personal_training_schedules pts2,
                  jsonb_array_elements(pts2.schedule_data->'sessions') as session
             WHERE pts2.user_id = up.user_id
               AND (pts2.trainer_name = trainer_name_param 
                    OR session->>'trainer' = trainer_name_param)
               AND (session->>'date')::DATE >= CURRENT_DATE
             ORDER BY (session->>'date')::DATE ASC
             LIMIT 1),
            'N/A'
        ) as next_session_date,
        COALESCE(
            (SELECT (session->>'startTime')::TEXT
             FROM personal_training_schedules pts3,
                  jsonb_array_elements(pts3.schedule_data->'sessions') as session
             WHERE pts3.user_id = up.user_id
               AND (pts3.trainer_name = trainer_name_param 
                    OR session->>'trainer' = trainer_name_param)
               AND (session->>'date')::DATE >= CURRENT_DATE
             ORDER BY (session->>'date')::DATE ASC
             LIMIT 1),
            'N/A'
        ) as next_session_time,
        COALESCE(
            (SELECT (session->>'type')::TEXT
             FROM personal_training_schedules pts4,
                  jsonb_array_elements(pts4.schedule_data->'sessions') as session
             WHERE pts4.user_id = up.user_id
               AND (pts4.trainer_name = trainer_name_param 
                    OR session->>'trainer' = trainer_name_param)
               AND (session->>'date')::DATE >= CURRENT_DATE
             ORDER BY (session->>'date')::DATE ASC
             LIMIT 1),
            'N/A'
        ) as next_session_type,
        COALESCE(
            (SELECT (session->>'room')::TEXT
             FROM personal_training_schedules pts5,
                  jsonb_array_elements(pts5.schedule_data->'sessions') as session
             WHERE pts5.user_id = up.user_id
               AND (pts5.trainer_name = trainer_name_param 
                    OR session->>'trainer' = trainer_name_param)
               AND (session->>'date')::DATE >= CURRENT_DATE
             ORDER BY (session->>'date')::DATE ASC
             LIMIT 1),
            'N/A'
        ) as next_session_room,
        COALESCE(
            (SELECT COUNT(*)
             FROM personal_training_schedules pts6,
                  jsonb_array_elements(pts6.schedule_data->'sessions') as session
             WHERE pts6.user_id = up.user_id
               AND (pts6.trainer_name = trainer_name_param 
                    OR session->>'trainer' = trainer_name_param)),
            0
        ) as total_sessions
    FROM user_profiles up
    INNER JOIN personal_training_schedules pts ON up.user_id = pts.user_id
    WHERE (pts.trainer_name = trainer_name_param 
           OR pts.schedule_data->'sessions' @> jsonb_build_array(jsonb_build_object('trainer', trainer_name_param)))
      AND up.role = 'user'
    ORDER BY up.first_name, up.last_name;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_trainer_users(text) TO authenticated;

-- Test the function
SELECT 
    'Function Test' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    profile_photo,
    total_sessions
FROM public.get_trainer_users('Mike')
LIMIT 5;

-- Success message
SELECT 'get_trainer_users function updated with profile_photo!' as message;
