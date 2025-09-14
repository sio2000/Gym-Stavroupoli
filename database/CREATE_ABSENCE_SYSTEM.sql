-- Create absence_records table
CREATE TABLE IF NOT EXISTS absence_records (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_absence_records_user_id ON absence_records(user_id);
CREATE INDEX IF NOT EXISTS idx_absence_records_trainer_name ON absence_records(trainer_name);
CREATE INDEX IF NOT EXISTS idx_absence_records_session_date ON absence_records(session_date);

-- Enable RLS
ALTER TABLE absence_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for absence_records
CREATE POLICY "Trainers can view their own absence records" ON absence_records
    FOR SELECT USING (
        trainer_name IN ('Mike', 'Jordan') AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'trainer'
        )
    );

CREATE POLICY "Trainers can insert their own absence records" ON absence_records
    FOR INSERT WITH CHECK (
        trainer_name IN ('Mike', 'Jordan') AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'trainer'
        )
    );

CREATE POLICY "Trainers can update their own absence records" ON absence_records
    FOR UPDATE USING (
        trainer_name IN ('Mike', 'Jordan') AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'trainer'
        )
    );

CREATE POLICY "Trainers can delete their own absence records" ON absence_records
    FOR DELETE USING (
        trainer_name IN ('Mike', 'Jordan') AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'trainer'
        )
    );

-- Function to get users assigned to a specific trainer
CREATE OR REPLACE FUNCTION get_trainer_users(trainer_name_param VARCHAR(50))
RETURNS TABLE (
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
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
        COALESCE((jsonb_array_elements(pts.schedule_data->'sessions')->>'date'), '') as next_session_date,
        COALESCE((jsonb_array_elements(pts.schedule_data->'sessions')->>'startTime'), '') as next_session_time,
        COALESCE((jsonb_array_elements(pts.schedule_data->'sessions')->>'type'), '') as next_session_type,
        COALESCE((jsonb_array_elements(pts.schedule_data->'sessions')->>'room'), '') as next_session_room,
        COALESCE(jsonb_array_length(pts.schedule_data->'sessions'), 0) as total_sessions
    FROM user_profiles up
    JOIN personal_training_schedules pts ON up.user_id = pts.user_id
    WHERE
        pts.schedule_data->'sessions' @> ('[{"trainer": "' || trainer_name_param || '"}]')::jsonb
        AND up.role = 'user'
    ORDER BY up.first_name, up.last_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get absences for a specific user
CREATE OR REPLACE FUNCTION get_user_absences(user_id_param UUID, trainer_name_param VARCHAR(50))
RETURNS TABLE (
    id UUID,
    user_id UUID,
    trainer_name VARCHAR(50),
    session_id VARCHAR(100),
    session_date DATE,
    session_time TIME,
    absence_type VARCHAR(20),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
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
    WHERE 
        ar.user_id = user_id_param 
        AND ar.trainer_name = trainer_name_param
    ORDER BY ar.session_date DESC, ar.session_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add new absence
CREATE OR REPLACE FUNCTION add_absence(
    user_id_param UUID,
    trainer_name_param VARCHAR(50),
    session_id_param VARCHAR(100),
    session_date_param DATE,
    session_time_param TIME,
    absence_type_param VARCHAR(20),
    reason_param TEXT DEFAULT NULL,
    notes_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
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
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update absence
CREATE OR REPLACE FUNCTION update_absence(
    absence_id_param UUID,
    absence_type_param VARCHAR(20),
    reason_param TEXT DEFAULT NULL,
    notes_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE absence_records 
    SET 
        absence_type = absence_type_param,
        reason = reason_param,
        notes = notes_param,
        updated_at = NOW()
    WHERE id = absence_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete absence
CREATE OR REPLACE FUNCTION delete_absence(absence_id_param UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM absence_records WHERE id = absence_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_trainer_users(VARCHAR(50)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_absences(UUID, VARCHAR(50)) TO authenticated;
GRANT EXECUTE ON FUNCTION add_absence(UUID, VARCHAR(50), VARCHAR(100), DATE, TIME, VARCHAR(20), TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_absence(UUID, VARCHAR(20), TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_absence(UUID) TO authenticated;