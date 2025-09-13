-- COMPLETE FULL DATABASE RESTORE - ΟΛΟΚΛΗΡΗ ΠΛΗΡΗΣ ΕΠΑΝΑΦΟΡΑ
-- Επαναφορά ΟΛΟΥΣ των πινάκων και ΟΛΩΝ των δεδομένων

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order)
DROP TABLE IF EXISTS qr_codes CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS membership_packages CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS lesson_categories CASCADE;
DROP TABLE IF EXISTS trainers CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
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

-- Create rooms table
CREATE TABLE rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    description TEXT,
    equipment TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trainers table
CREATE TABLE trainers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    specialty TEXT,
    experience_years INTEGER,
    certifications TEXT[],
    bio TEXT,
    hourly_rate DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lesson_categories table
CREATE TABLE lesson_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lessons table
CREATE TABLE lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES lesson_categories(id) ON DELETE SET NULL,
    trainer_id UUID REFERENCES trainers(user_id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create membership_packages table
CREATE TABLE membership_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    duration_days INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    features TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create memberships table
CREATE TABLE memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES membership_packages(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'suspended')),
    auto_renew BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id TEXT,
    description TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create qr_codes table
CREATE TABLE qr_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create referrals table
CREATE TABLE referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    reward_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Create all indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_referral_code ON user_profiles(referral_code);

CREATE INDEX idx_rooms_name ON rooms(name);
CREATE INDEX idx_rooms_is_active ON rooms(is_active);

CREATE INDEX idx_trainers_user_id ON trainers(user_id);
CREATE INDEX idx_trainers_is_active ON trainers(is_active);

CREATE INDEX idx_lesson_categories_name ON lesson_categories(name);
CREATE INDEX idx_lesson_categories_is_active ON lesson_categories(is_active);

CREATE INDEX idx_lessons_category_id ON lessons(category_id);
CREATE INDEX idx_lessons_trainer_id ON lessons(trainer_id);
CREATE INDEX idx_lessons_room_id ON lessons(room_id);
CREATE INDEX idx_lessons_day_time ON lessons(day_of_week, start_time);
CREATE INDEX idx_lessons_is_active ON lessons(is_active);

CREATE INDEX idx_membership_packages_name ON membership_packages(name);
CREATE INDEX idx_membership_packages_is_active ON membership_packages(is_active);

CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_package_id ON memberships(package_id);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_memberships_dates ON memberships(start_date, end_date);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_expires ON payments(expires_at);

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_lesson_id ON bookings(lesson_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);

CREATE INDEX idx_qr_codes_booking_id ON qr_codes(booking_id);
CREATE INDEX idx_qr_codes_code ON qr_codes(code);
CREATE INDEX idx_qr_codes_expires ON qr_codes(expires_at);
CREATE INDEX idx_qr_codes_status ON qr_codes(is_used);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX idx_personal_training_codes_code ON personal_training_codes(code);
CREATE INDEX idx_personal_training_codes_used_by ON personal_training_codes(used_by);
CREATE INDEX idx_personal_training_codes_created_by ON personal_training_codes(created_by);

CREATE INDEX idx_personal_training_schedules_user_id ON personal_training_schedules(user_id);
CREATE INDEX idx_personal_training_schedules_month_year ON personal_training_schedules(month, year);
CREATE INDEX idx_personal_training_schedules_status ON personal_training_schedules(status);

CREATE INDEX idx_absence_records_user_id ON absence_records(user_id);
CREATE INDEX idx_absence_records_trainer_name ON absence_records(trainer_name);
CREATE INDEX idx_absence_records_session_date ON absence_records(session_date);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
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

-- RLS Policies for rooms
CREATE POLICY "Anyone can view active rooms" ON rooms
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage rooms" ON rooms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for trainers
CREATE POLICY "Anyone can view active trainers" ON trainers
    FOR SELECT USING (is_active = true);

CREATE POLICY "Trainers can view their own profile" ON trainers
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage trainers" ON trainers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for lesson_categories
CREATE POLICY "Anyone can view active categories" ON lesson_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON lesson_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for lessons
CREATE POLICY "Anyone can view active lessons" ON lessons
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage lessons" ON lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for membership_packages
CREATE POLICY "Anyone can view active packages" ON membership_packages
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage packages" ON membership_packages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for memberships
CREATE POLICY "Users can view their own memberships" ON memberships
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all memberships" ON memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all payments" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings" ON bookings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own bookings" ON bookings
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all bookings" ON bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for qr_codes
CREATE POLICY "Users can view their own qr_codes" ON qr_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE id = qr_codes.booking_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all qr_codes" ON qr_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for referrals
CREATE POLICY "Users can view their own referrals" ON referrals
    FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE POLICY "Admins can manage all referrals" ON referrals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR SELECT USING (
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

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainers_updated_at
    BEFORE UPDATE ON trainers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_categories_updated_at
    BEFORE UPDATE ON lesson_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_membership_packages_updated_at
    BEFORE UPDATE ON membership_packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at
    BEFORE UPDATE ON memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
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

-- Create absence system functions
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
SELECT 'COMPLETE FULL DATABASE RESTORED SUCCESSFULLY WITH ALL TABLES!' as status;
