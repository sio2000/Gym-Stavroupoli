/* CREATE ABSENCE FUNCTIONS - ΔΗΜΙΟΥΡΓΙΑ FUNCTIONS ΓΙΑ ABSENCE SYSTEM
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Drop existing functions first */
DROP FUNCTION IF EXISTS get_trainer_users(VARCHAR(50));
DROP FUNCTION IF EXISTS get_user_absences(UUID, VARCHAR(50));
DROP FUNCTION IF EXISTS add_absence(UUID, VARCHAR(50), VARCHAR(100), DATE, TIME, VARCHAR(20), TEXT, TEXT);
DROP FUNCTION IF EXISTS update_absence(UUID, VARCHAR(20), TEXT, TEXT);
DROP FUNCTION IF EXISTS delete_absence(UUID);

/* 2. Create get_trainer_users function */
CREATE OR REPLACE FUNCTION get_trainer_users(trainer_name_param TEXT)
RETURNS TABLE (
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    next_session_date TEXT,
    next_session_time TEXT,
    next_session_type TEXT,
    next_session_room TEXT,
    total_sessions BIGINT
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
        COALESCE(
            (SELECT (session->>'date')::TEXT 
             FROM personal_training_schedules pts,
                  jsonb_array_elements(pts.schedule_data->'sessions') as session
             WHERE pts.user_id = up.user_id 
             AND session->>'trainer' = trainer_name_param
             ORDER BY (session->>'date')::DATE ASC
             LIMIT 1), 
            'N/A'
        ) as next_session_date,
        COALESCE(
            (SELECT (session->>'startTime')::TEXT 
             FROM personal_training_schedules pts,
                  jsonb_array_elements(pts.schedule_data->'sessions') as session
             WHERE pts.user_id = up.user_id 
             AND session->>'trainer' = trainer_name_param
             ORDER BY (session->>'date')::DATE ASC
             LIMIT 1), 
            'N/A'
        ) as next_session_time,
        COALESCE(
            (SELECT (session->>'type')::TEXT 
             FROM personal_training_schedules pts,
                  jsonb_array_elements(pts.schedule_data->'sessions') as session
             WHERE pts.user_id = up.user_id 
             AND session->>'trainer' = trainer_name_param
             ORDER BY (session->>'date')::DATE ASC
             LIMIT 1), 
            'N/A'
        ) as next_session_type,
        COALESCE(
            (SELECT (session->>'room')::TEXT 
             FROM personal_training_schedules pts,
                  jsonb_array_elements(pts.schedule_data->'sessions') as session
             WHERE pts.user_id = up.user_id 
             AND session->>'trainer' = trainer_name_param
             ORDER BY (session->>'date')::DATE ASC
             LIMIT 1), 
            'N/A'
        ) as next_session_room,
        COALESCE(
            (SELECT COUNT(*)
             FROM personal_training_schedules pts,
                  jsonb_array_elements(pts.schedule_data->'sessions') as session
             WHERE pts.user_id = up.user_id 
             AND session->>'trainer' = trainer_name_param), 
            0
        ) as total_sessions
    FROM user_profiles up
    WHERE up.role = 'user'
    AND EXISTS (
        SELECT 1 
        FROM personal_training_schedules pts
        WHERE pts.user_id = up.user_id
        AND (
            pts.trainer_name = trainer_name_param
            OR pts.schedule_data->'sessions' @> jsonb_build_array(
                jsonb_build_object('trainer', trainer_name_param)
            )
        )
    )
    ORDER BY up.first_name, up.last_name;
END;
$$;

/* 3. Create get_user_absences function */
CREATE OR REPLACE FUNCTION get_user_absences(user_id_param UUID, trainer_name_param TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    trainer_name TEXT,
    session_id TEXT,
    session_date DATE,
    session_time TIME,
    absence_type TEXT,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id,
        ar.user_id,
        ar.trainer_name,
        ar.session_id,
        ar.session_date,
        ar.session_time,
        ar.absence_type,
        ar.reason,
        ar.notes,
        ar.created_at,
        ar.updated_at
    FROM absence_records ar
    WHERE ar.user_id = user_id_param
    AND ar.trainer_name = trainer_name_param
    ORDER BY ar.session_date DESC, ar.session_time DESC;
END;
$$;

/* 4. Create add_absence function */
CREATE OR REPLACE FUNCTION add_absence(
    user_id_param UUID,
    trainer_name_param TEXT,
    session_id_param TEXT,
    session_date_param DATE,
    session_time_param TIME,
    absence_type_param TEXT,
    reason_param TEXT DEFAULT NULL,
    notes_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO absence_records (
        user_id,
        trainer_name,
        session_id,
        session_date,
        session_time,
        absence_type,
        reason,
        notes
    ) VALUES (
        user_id_param,
        trainer_name_param,
        session_id_param,
        session_date_param,
        session_time_param,
        absence_type_param,
        reason_param,
        notes_param
    ) RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$;

/* 5. Create update_absence function */
CREATE OR REPLACE FUNCTION update_absence(
    absence_id_param UUID,
    absence_type_param TEXT,
    reason_param TEXT DEFAULT NULL,
    notes_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE absence_records 
    SET 
        absence_type = absence_type_param,
        reason = reason_param,
        notes = notes_param,
        updated_at = NOW()
    WHERE id = absence_id_param;
    
    RETURN FOUND;
END;
$$;

/* 6. Create delete_absence function */
CREATE OR REPLACE FUNCTION delete_absence(absence_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM absence_records 
    WHERE id = absence_id_param;
    
    RETURN FOUND;
END;
$$;

/* 7. Test the functions */
SELECT 'Testing get_trainer_users function:' as test_name;
SELECT * FROM get_trainer_users('Jordan') LIMIT 3;

SELECT 'Testing add_absence function:' as test_name;
SELECT add_absence(
    (SELECT user_id FROM user_profiles WHERE role = 'user' LIMIT 1),
    'Jordan',
    'test-session-456',
    CURRENT_DATE + INTERVAL '1 day',
    '14:00:00',
    'late',
    'Test reason',
    'Test notes'
) as new_absence_id;

SELECT 'Testing get_user_absences function:' as test_name;
SELECT * FROM get_user_absences(
    (SELECT user_id FROM user_profiles WHERE role = 'user' LIMIT 1),
    'Jordan'
) LIMIT 3;

/* Success message */
SELECT 'Absence functions created and tested successfully!' as message;
