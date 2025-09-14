-- Initial schema for the gym management system
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
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
CREATE TABLE IF NOT EXISTS personal_training_codes (
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
CREATE TABLE IF NOT EXISTS personal_training_schedules (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_personal_training_codes_code ON personal_training_codes(code);
CREATE INDEX IF NOT EXISTS idx_personal_training_codes_used_by ON personal_training_codes(used_by);
CREATE INDEX IF NOT EXISTS idx_personal_training_schedules_user_id ON personal_training_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_training_schedules_month_year ON personal_training_schedules(month, year);
CREATE INDEX IF NOT EXISTS idx_personal_training_schedules_status ON personal_training_schedules(status);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_training_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_training_schedules ENABLE ROW LEVEL SECURITY;

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
