-- COMPLETE DATABASE RESTORE - ΟΛΟΚΛΗΡΗ ΕΠΑΝΑΦΟΡΑ
-- Επαναφορά πλήρους σχήματος και δεδομένων

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS absence_records CASCADE;
DROP TABLE IF EXISTS personal_training_schedules CASCADE;
DROP TABLE IF EXISTS personal_training_codes CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    date_of_birth DATE,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    language TEXT DEFAULT 'el',
    notification_preferences JSONB DEFAULT '{"sms": false, "push": true, "email": true}',
    avatar_url TEXT,
    referral_code TEXT UNIQUE,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'trainer', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    dob DATE,
    emergency_contact TEXT,
    profile_photo TEXT,
    profile_photo_locked BOOLEAN DEFAULT FALSE,
    dob_locked BOOLEAN DEFAULT FALSE
);

-- Create personal_training_codes table
CREATE TABLE personal_training_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    package_type TEXT NOT NULL DEFAULT 'personal',
    created_by UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    used_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create personal_training_schedules table
CREATE TABLE personal_training_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    schedule_data JSONB NOT NULL DEFAULT '{"sessions": [], "notes": "", "specialInstructions": ""}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_by UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ
);

-- Create absence_records table
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

-- Create indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_personal_training_codes_code ON personal_training_codes(code);
CREATE INDEX idx_personal_training_codes_used_by ON personal_training_codes(used_by);
CREATE INDEX idx_personal_training_schedules_user_id ON personal_training_schedules(user_id);
CREATE INDEX idx_personal_training_schedules_month_year ON personal_training_schedules(month, year);
CREATE INDEX idx_personal_training_schedules_status ON personal_training_schedules(status);
CREATE INDEX idx_absence_records_user_id ON absence_records(user_id);
CREATE INDEX idx_absence_records_trainer_name ON absence_records(trainer_name);
CREATE INDEX idx_absence_records_session_date ON absence_records(session_date);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_training_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_training_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for personal_training_codes
CREATE POLICY "Users can view their own codes" ON personal_training_codes
    FOR SELECT USING (used_by = auth.uid());

CREATE POLICY "Admins can manage all codes" ON personal_training_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for personal_training_schedules
CREATE POLICY "Users can view their own schedules" ON personal_training_schedules
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all schedules" ON personal_training_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Trainers can view schedules for their users" ON personal_training_schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'trainer'
        )
    );

-- RLS Policies for absence_records
CREATE POLICY "Trainers can view their own absence records" ON absence_records
    FOR SELECT USING (
        trainer_name IN ('Mike', 'Jordan') AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'trainer'
        )
    );

CREATE POLICY "Trainers can insert their own absence records" ON absence_records
    FOR INSERT WITH CHECK (
        trainer_name IN ('Mike', 'Jordan') AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'trainer'
        )
    );

CREATE POLICY "Trainers can update their own absence records" ON absence_records
    FOR UPDATE USING (
        trainer_name IN ('Mike', 'Jordan') AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'trainer'
        )
    );

CREATE POLICY "Trainers can delete their own absence records" ON absence_records
    FOR DELETE USING (
        trainer_name IN ('Mike', 'Jordan') AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'trainer'
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_training_schedules_updated_at
    BEFORE UPDATE ON personal_training_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_absence_records_updated_at
    BEFORE UPDATE ON absence_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Ultra simple function for absence system
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
        '' as next_session_date,
        '' as next_session_time,
        '' as next_session_type,
        '' as next_session_room,
        0 as total_sessions
    FROM user_profiles up
    JOIN personal_training_schedules pts ON up.user_id = pts.user_id
    WHERE 
        up.role = 'user'
        AND pts.schedule_data->'sessions' IS NOT NULL
        AND jsonb_typeof(pts.schedule_data->'sessions') = 'array'
        AND jsonb_array_length(pts.schedule_data->'sessions') > 0
        AND EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(pts.schedule_data->'sessions') session
            WHERE session->>'trainer' = trainer_name_param
        )
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

-- Success message
SELECT 'COMPLETE DATABASE RESTORED SUCCESSFULLY!' as status;
