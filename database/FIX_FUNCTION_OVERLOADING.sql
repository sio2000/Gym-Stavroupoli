/* FIX FUNCTION OVERLOADING - ΔΙΟΡΘΩΣΗ FUNCTION OVERLOADING
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Drop all existing get_trainer_users functions */
DROP FUNCTION IF EXISTS public.get_trainer_users(character varying);
DROP FUNCTION IF EXISTS public.get_trainer_users(text);
DROP FUNCTION IF EXISTS public.get_trainer_users(varchar);

/* 2. Create a single, clean get_trainer_users function */
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
    WHERE pts.schedule_data->'sessions' @> ('[{"trainer": "' || trainer_name_param || '"}]')::jsonb
      AND pts.status = 'accepted'
      AND up.role = 'user'
    ORDER BY up.first_name, up.last_name;
END;
$$;

/* 3. Test the function */
SELECT 
    'Function Test' as test_name,
    user_id,
    first_name,
    last_name,
    email
FROM public.get_trainer_users('Mike')
LIMIT 5;

/* 4. Check function exists */
SELECT 
    'Function Check' as test_name,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'get_trainer_users'
  AND routine_schema = 'public';

/* Success message */
SELECT 'Function overloading fixed!' as message;
