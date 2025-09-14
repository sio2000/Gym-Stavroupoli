/* COMPLETE ABSENCE SYSTEM FIX - ΠΛΗΡΗΣ ΔΙΟΡΘΩΣΗ ABSENCE SYSTEM
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check current state */
SELECT 'Current absence_records table check:' as step;
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'absence_records' 
AND table_schema = 'public'
ORDER BY ordinal_position;

/* 2. Drop and recreate absence_records table */
DROP TABLE IF EXISTS absence_records CASCADE;

CREATE TABLE absence_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    trainer_name VARCHAR(50) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    absence_type VARCHAR(20) NOT NULL CHECK (absence_type IN ('absent', 'late', 'excused')),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* 3. Create indexes */
CREATE INDEX idx_absence_records_user_id ON absence_records(user_id);
CREATE INDEX idx_absence_records_trainer_name ON absence_records(trainer_name);
CREATE INDEX idx_absence_records_session_date ON absence_records(session_date);
CREATE INDEX idx_absence_records_session_id ON absence_records(session_id);

/* 4. Enable RLS */
ALTER TABLE absence_records ENABLE ROW LEVEL SECURITY;

/* 5. Create RLS policies */
CREATE POLICY "Trainers can view their own absence records" ON absence_records
    FOR SELECT USING (
        trainer_name IN (
            SELECT CASE 
                WHEN up.email LIKE '%mike%' THEN 'Mike'
                WHEN up.email LIKE '%jordan%' THEN 'Jordan'
                ELSE up.email
            END
            FROM user_profiles up 
            WHERE up.user_id = auth.uid()
        )
    );

CREATE POLICY "Trainers can insert their own absence records" ON absence_records
    FOR INSERT WITH CHECK (
        trainer_name IN (
            SELECT CASE 
                WHEN up.email LIKE '%mike%' THEN 'Mike'
                WHEN up.email LIKE '%jordan%' THEN 'Jordan'
                ELSE up.email
            END
            FROM user_profiles up 
            WHERE up.user_id = auth.uid()
        )
    );

CREATE POLICY "Trainers can update their own absence records" ON absence_records
    FOR UPDATE USING (
        trainer_name IN (
            SELECT CASE 
                WHEN up.email LIKE '%mike%' THEN 'Mike'
                WHEN up.email LIKE '%jordan%' THEN 'Jordan'
                ELSE up.email
            END
            FROM user_profiles up 
            WHERE up.user_id = auth.uid()
        )
    );

CREATE POLICY "Trainers can delete their own absence records" ON absence_records
    FOR DELETE USING (
        trainer_name IN (
            SELECT CASE 
                WHEN up.email LIKE '%mike%' THEN 'Mike'
                WHEN up.email LIKE '%jordan%' THEN 'Jordan'
                ELSE up.email
            END
            FROM user_profiles up 
            WHERE up.user_id = auth.uid()
        )
    );

/* 6. Drop and recreate all absence functions */
DROP FUNCTION IF EXISTS get_trainer_users(VARCHAR(50));
DROP FUNCTION IF EXISTS get_user_absences(UUID, VARCHAR(50));
DROP FUNCTION IF EXISTS add_absence(UUID, VARCHAR(50), VARCHAR(100), DATE, TIME, VARCHAR(20), TEXT, TEXT);
DROP FUNCTION IF EXISTS update_absence(UUID, VARCHAR(20), TEXT, TEXT);
DROP FUNCTION IF EXISTS delete_absence(UUID);

/* 7. Create get_trainer_users function */
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

/* 8. Create get_user_absences function */
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

/* 9. Create add_absence function */
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

/* 10. Create update_absence function */
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

/* 11. Create delete_absence function */
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

/* 12. Test the system */
SELECT 'Testing absence system:' as step;

-- Test get_trainer_users
SELECT 'Testing get_trainer_users for Jordan:' as test;
SELECT * FROM get_trainer_users('Jordan') LIMIT 2;

-- Test add_absence
SELECT 'Testing add_absence:' as test;
SELECT add_absence(
    (SELECT user_id FROM user_profiles WHERE role = 'user' LIMIT 1),
    'Jordan',
    'test-session-789',
    CURRENT_DATE + INTERVAL '2 days',
    '16:00:00',
    'absent',
    'Test absence reason',
    'Test absence notes'
) as new_absence_id;

-- Test get_user_absences
SELECT 'Testing get_user_absences:' as test;
SELECT * FROM get_user_absences(
    (SELECT user_id FROM user_profiles WHERE role = 'user' LIMIT 1),
    'Jordan'
) LIMIT 2;

/* 13. Verify final table structure */
SELECT 'Final absence_records structure:' as step;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'absence_records' 
AND table_schema = 'public'
ORDER BY ordinal_position;

/* Success message */
SELECT 'Complete absence system fixed and ready!' as message;
