-- Lesson Deposit System for Paspartu Users
-- This system allows Paspartu users to have a deposit of lessons that they can use to book flexible sessions

-- Create lesson_deposits table to track user lesson balances
CREATE TABLE lesson_deposits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    total_lessons INTEGER NOT NULL DEFAULT 0,
    used_lessons INTEGER NOT NULL DEFAULT 0,
    remaining_lessons INTEGER GENERATED ALWAYS AS (total_lessons - used_lessons) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    
    -- Ensure one deposit record per user
    UNIQUE(user_id)
);

-- Create lesson_bookings table to track individual lesson bookings by Paspartu users
CREATE TABLE lesson_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES personal_training_schedules(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL, -- References the session ID in the schedule_data
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    trainer_name VARCHAR(50) NOT NULL,
    room VARCHAR(100),
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'cancelled', 'no_show')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate bookings for same session
    UNIQUE(schedule_id, session_id)
);

-- Add user_type field to personal_training_schedules to distinguish Personal vs Paspartu
ALTER TABLE personal_training_schedules 
ADD COLUMN user_type VARCHAR(20) NOT NULL DEFAULT 'personal' CHECK (user_type IN ('personal', 'paspartu'));

-- Add is_flexible field to indicate if schedule allows flexible booking
ALTER TABLE personal_training_schedules 
ADD COLUMN is_flexible BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for performance
CREATE INDEX idx_lesson_deposits_user_id ON lesson_deposits(user_id);
CREATE INDEX idx_lesson_deposits_remaining ON lesson_deposits(remaining_lessons);
CREATE INDEX idx_lesson_bookings_user_id ON lesson_bookings(user_id);
CREATE INDEX idx_lesson_bookings_schedule_id ON lesson_bookings(schedule_id);
CREATE INDEX idx_lesson_bookings_date ON lesson_bookings(booking_date);
CREATE INDEX idx_personal_training_schedules_user_type ON personal_training_schedules(user_type);
CREATE INDEX idx_personal_training_schedules_is_flexible ON personal_training_schedules(is_flexible);

-- Enable RLS
ALTER TABLE lesson_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_deposits
CREATE POLICY "Users can view their own lesson deposits" ON lesson_deposits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all lesson deposits" ON lesson_deposits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for lesson_bookings
CREATE POLICY "Users can view their own lesson bookings" ON lesson_bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lesson bookings" ON lesson_bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson bookings" ON lesson_bookings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all lesson bookings" ON lesson_bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Function to automatically update remaining_lessons when total_lessons or used_lessons change
CREATE OR REPLACE FUNCTION update_remaining_lessons()
RETURNS TRIGGER AS $$
BEGIN
    NEW.remaining_lessons = NEW.total_lessons - NEW.used_lessons;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update remaining_lessons
CREATE TRIGGER trigger_update_remaining_lessons
    BEFORE INSERT OR UPDATE ON lesson_deposits
    FOR EACH ROW
    EXECUTE FUNCTION update_remaining_lessons();

-- Function to automatically update used_lessons when a booking is created/cancelled
CREATE OR REPLACE FUNCTION update_deposit_on_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment used_lessons when booking is created
        UPDATE lesson_deposits 
        SET used_lessons = used_lessons + 1, updated_at = NOW()
        WHERE user_id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement used_lessons when booking is deleted
        UPDATE lesson_deposits 
        SET used_lessons = GREATEST(used_lessons - 1, 0), updated_at = NOW()
        WHERE user_id = OLD.user_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update used_lessons on booking changes
CREATE TRIGGER trigger_update_deposit_on_booking
    AFTER INSERT OR DELETE ON lesson_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_deposit_on_booking();

-- Insert initial data for existing users (optional - can be run separately)
-- This would give existing users 0 lessons by default
-- INSERT INTO lesson_deposits (user_id, total_lessons, used_lessons)
-- SELECT user_id, 0, 0 FROM user_profiles WHERE role = 'user'
-- ON CONFLICT (user_id) DO NOTHING;
