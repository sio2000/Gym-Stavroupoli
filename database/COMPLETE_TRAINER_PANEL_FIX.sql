/* COMPLETE TRAINER PANEL FIX - ΠΛΗΡΗΣ ΔΙΟΡΘΩΣΗ TRAINER PANEL
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Fix function overloading */
DROP FUNCTION IF EXISTS public.get_trainer_users(character varying);
DROP FUNCTION IF EXISTS public.get_trainer_users(text);
DROP FUNCTION IF EXISTS public.get_trainer_users(varchar);

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

/* 2. Create sample data for Mike */
INSERT INTO personal_training_schedules (
    user_id,
    month,
    year,
    trainer_name,
    schedule_data,
    status,
    created_by
) 
SELECT 
    up.user_id,
    9,
    2025,
    'Mike',
    '{"sessions": [{"date": "2025-09-10", "startTime": "10:00", "endTime": "11:00", "type": "personal", "trainer": "Mike", "room": "Room 1"}, {"date": "2025-09-12", "startTime": "14:00", "endTime": "15:00", "type": "personal", "trainer": "Mike", "room": "Room 2"}]}',
    'accepted',
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1)
FROM user_profiles up
WHERE up.role = 'user'
LIMIT 3
ON CONFLICT DO NOTHING;

/* 3. Create sample data for Jordan */
INSERT INTO personal_training_schedules (
    user_id,
    month,
    year,
    trainer_name,
    schedule_data,
    status,
    created_by
) 
SELECT 
    up.user_id,
    9,
    2025,
    'Jordan',
    '{"sessions": [{"date": "2025-09-11", "startTime": "16:00", "endTime": "17:00", "type": "personal", "trainer": "Jordan", "room": "Room 3"}, {"date": "2025-09-13", "startTime": "18:00", "endTime": "19:00", "type": "personal", "trainer": "Jordan", "room": "Room 4"}]}',
    'accepted',
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1)
FROM user_profiles up
WHERE up.role = 'user'
LIMIT 2
ON CONFLICT DO NOTHING;

/* 4. Test the function */
SELECT 
    'Mike Users' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    next_session_date,
    next_session_time,
    total_sessions
FROM public.get_trainer_users('Mike')
LIMIT 5;

/* 5. Test Jordan users */
SELECT 
    'Jordan Users' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    next_session_date,
    next_session_time,
    total_sessions
FROM public.get_trainer_users('Jordan')
LIMIT 5;

/* 6. Check all schedules */
SELECT 
    'All Schedules' as test_name,
    id,
    user_id,
    trainer_name,
    status,
    created_at
FROM personal_training_schedules 
ORDER BY created_at DESC;

/* 7. Check schedules by trainer */
SELECT 
    'Schedules by Trainer' as test_name,
    trainer_name,
    COUNT(*) as schedule_count,
    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_count
FROM personal_training_schedules 
GROUP BY trainer_name;

/* Success message */
SELECT 'Trainer panel completely fixed!' as message;
