-- Lesson Management System Database Schema
-- This schema extends the existing database to support comprehensive lesson management

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create lesson_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS lesson_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rooms table if it doesn't exist
CREATE TABLE IF NOT EXISTS rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    capacity INTEGER NOT NULL,
    description TEXT,
    equipment TEXT[],
    floor INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trainers table if it doesn't exist
CREATE TABLE IF NOT EXISTS trainers (
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

-- Create lessons table if it doesn't exist
CREATE TABLE IF NOT EXISTS lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES lesson_categories(id) ON DELETE SET NULL,
    trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER NOT NULL,
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    price DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to lessons if they don't exist
DO $$
BEGIN
    -- Add day_of_week column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lessons' AND column_name = 'day_of_week') THEN
        ALTER TABLE lessons ADD COLUMN day_of_week INTEGER;
    END IF;
    
    -- Add start_time column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lessons' AND column_name = 'start_time') THEN
        ALTER TABLE lessons ADD COLUMN start_time TIME;
    END IF;
    
    -- Add end_time column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lessons' AND column_name = 'end_time') THEN
        ALTER TABLE lessons ADD COLUMN end_time TIME;
    END IF;
    
    -- Add capacity column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lessons' AND column_name = 'capacity') THEN
        ALTER TABLE lessons ADD COLUMN capacity INTEGER;
    END IF;
    
    -- Add difficulty column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lessons' AND column_name = 'difficulty') THEN
        ALTER TABLE lessons ADD COLUMN difficulty TEXT DEFAULT 'beginner';
    END IF;
    
    -- Add price column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lessons' AND column_name = 'price') THEN
        ALTER TABLE lessons ADD COLUMN price DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lessons' AND column_name = 'is_active') THEN
        ALTER TABLE lessons ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lessons' AND column_name = 'created_at') THEN
        ALTER TABLE lessons ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lessons' AND column_name = 'updated_at') THEN
        ALTER TABLE lessons ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Create lesson_schedules table for recurring lessons
CREATE TABLE IF NOT EXISTS lesson_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to lesson_schedules if they don't exist
DO $$
BEGIN
    -- Add day_of_week column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_schedules' AND column_name = 'day_of_week') THEN
        ALTER TABLE lesson_schedules ADD COLUMN day_of_week INTEGER;
    END IF;
    
    -- Add start_time column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_schedules' AND column_name = 'start_time') THEN
        ALTER TABLE lesson_schedules ADD COLUMN start_time TIME;
    END IF;
    
    -- Add end_time column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_schedules' AND column_name = 'end_time') THEN
        ALTER TABLE lesson_schedules ADD COLUMN end_time TIME;
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_schedules' AND column_name = 'is_active') THEN
        ALTER TABLE lesson_schedules ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_schedules' AND column_name = 'created_at') THEN
        ALTER TABLE lesson_schedules ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_schedules' AND column_name = 'updated_at') THEN
        ALTER TABLE lesson_schedules ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Create lesson_bookings table for individual lesson bookings
CREATE TABLE IF NOT EXISTS lesson_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate bookings for same user, lesson, and date
    UNIQUE(user_id, lesson_id, booking_date)
);

-- Add missing columns to lesson_bookings if they don't exist
DO $$
BEGIN
    -- Add lesson_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_bookings' AND column_name = 'lesson_id') THEN
        ALTER TABLE lesson_bookings ADD COLUMN lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE;
    END IF;
    
    -- Add booking_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_bookings' AND column_name = 'booking_date') THEN
        ALTER TABLE lesson_bookings ADD COLUMN booking_date DATE;
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_bookings' AND column_name = 'status') THEN
        ALTER TABLE lesson_bookings ADD COLUMN status TEXT DEFAULT 'confirmed';
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_bookings' AND column_name = 'notes') THEN
        ALTER TABLE lesson_bookings ADD COLUMN notes TEXT;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_bookings' AND column_name = 'created_at') THEN
        ALTER TABLE lesson_bookings ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_bookings' AND column_name = 'updated_at') THEN
        ALTER TABLE lesson_bookings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Create lesson_attendance table for tracking attendance
CREATE TABLE IF NOT EXISTS lesson_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES lesson_bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to lesson_attendance if they don't exist
DO $$
BEGIN
    -- Add booking_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_attendance' AND column_name = 'booking_id') THEN
        ALTER TABLE lesson_attendance ADD COLUMN booking_id UUID REFERENCES lesson_bookings(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_attendance' AND column_name = 'user_id') THEN
        ALTER TABLE lesson_attendance ADD COLUMN user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE;
    END IF;
    
    -- Add lesson_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_attendance' AND column_name = 'lesson_id') THEN
        ALTER TABLE lesson_attendance ADD COLUMN lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE;
    END IF;
    
    -- Add attendance_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_attendance' AND column_name = 'attendance_date') THEN
        ALTER TABLE lesson_attendance ADD COLUMN attendance_date DATE;
    END IF;
    
    -- Add check_in_time column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_attendance' AND column_name = 'check_in_time') THEN
        ALTER TABLE lesson_attendance ADD COLUMN check_in_time TIMESTAMPTZ;
    END IF;
    
    -- Add check_out_time column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_attendance' AND column_name = 'check_out_time') THEN
        ALTER TABLE lesson_attendance ADD COLUMN check_out_time TIMESTAMPTZ;
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_attendance' AND column_name = 'status') THEN
        ALTER TABLE lesson_attendance ADD COLUMN status TEXT DEFAULT 'present';
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_attendance' AND column_name = 'notes') THEN
        ALTER TABLE lesson_attendance ADD COLUMN notes TEXT;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_attendance' AND column_name = 'created_at') THEN
        ALTER TABLE lesson_attendance ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lesson_attendance' AND column_name = 'updated_at') THEN
        ALTER TABLE lesson_attendance ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Insert default lesson categories (using safe insert method)
INSERT INTO lesson_categories (name, description, color) 
SELECT * FROM (VALUES
('Pilates', 'Μαθήματα Pilates για ενδυνάμωση κορμού και ευλυγισία', '#FF6B9D'),
('Personal Training', 'Ατομικές προπονήσεις προσαρμοσμένες στους στόχους', '#8B5CF6'),
('Kick Boxing', 'Δυναμικό Kick Boxing για τεχνική και φυσική κατάσταση', '#F59E0B'),
('Free Gym', 'Χρήση εξοπλισμού γυμναστηρίου χωρίς προγραμματισμένο μάθημα', '#10B981'),
('Yoga', 'Μαθήματα Yoga για ευλυγισία και χαλάρωση', '#06B6D4'),
('Cardio', 'Καρδιαγγειακή προπόνηση και αερόβια άσκηση', '#EF4444')
) AS v(name, description, color)
WHERE NOT EXISTS (SELECT 1 FROM lesson_categories WHERE lesson_categories.name = v.name);

-- Insert default rooms (using safe insert method - check for all possible columns)
DO $$
DECLARE
    has_description BOOLEAN;
    has_floor BOOLEAN;
    has_equipment BOOLEAN;
BEGIN
    -- Check which columns exist
    SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rooms' AND column_name = 'description') INTO has_description;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rooms' AND column_name = 'floor') INTO has_floor;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rooms' AND column_name = 'equipment') INTO has_equipment;
    
    -- Insert based on available columns
    IF has_description AND has_floor AND has_equipment THEN
        -- Full insert with all columns
        INSERT INTO rooms (name, capacity, description, equipment, floor) 
        SELECT * FROM (VALUES
        ('Κύρια Αίθουσα', 30, 'Η κύρια αίθουσα του γυμναστηρίου', ARRAY['Τροχοί', 'Βάρη', 'Σχοινιά'], 1),
        ('Αίθουσα Pilates', 20, 'Εξειδικευμένη αίθουσα για Pilates', ARRAY['Ματς Pilates', 'Καυκάσια', 'Σχοινιά'], 1),
        ('Αίθουσα Martial Arts', 18, 'Αίθουσα για Kick Boxing και Martial Arts', ARRAY['Σακούλια', 'Γάντια', 'Προστατευτικά'], 2),
        ('Αίθουσα Yoga', 15, 'Αίθουσα για Yoga και χαλάρωση', ARRAY['Ματς Yoga', 'Μπλοκ', 'Σχοινιά'], 2),
        ('Αίθουσα Cardio', 25, 'Αίθουσα καρδιαγγειακής προπόνησης', ARRAY['Τροχοί', 'Σχοινιά', 'Battle Ropes'], 1)
        ) AS v(name, capacity, description, equipment, floor)
        WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE rooms.name = v.name);
    ELSIF has_description AND has_equipment THEN
        -- Insert with description and equipment, no floor
        INSERT INTO rooms (name, capacity, description, equipment) 
        SELECT * FROM (VALUES
        ('Κύρια Αίθουσα', 30, 'Η κύρια αίθουσα του γυμναστηρίου', ARRAY['Τροχοί', 'Βάρη', 'Σχοινιά']),
        ('Αίθουσα Pilates', 20, 'Εξειδικευμένη αίθουσα για Pilates', ARRAY['Ματς Pilates', 'Καυκάσια', 'Σχοινιά']),
        ('Αίθουσα Martial Arts', 18, 'Αίθουσα για Kick Boxing και Martial Arts', ARRAY['Σακούλια', 'Γάντια', 'Προστατευτικά']),
        ('Αίθουσα Yoga', 15, 'Αίθουσα για Yoga και χαλάρωση', ARRAY['Ματς Yoga', 'Μπλοκ', 'Σχοινιά']),
        ('Αίθουσα Cardio', 25, 'Αίθουσα καρδιαγγειακής προπόνησης', ARRAY['Τροχοί', 'Σχοινιά', 'Battle Ropes'])
        ) AS v(name, capacity, description, equipment)
        WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE rooms.name = v.name);
    ELSIF has_equipment THEN
        -- Insert with equipment only
        INSERT INTO rooms (name, capacity, equipment) 
        SELECT * FROM (VALUES
        ('Κύρια Αίθουσα', 30, ARRAY['Τροχοί', 'Βάρη', 'Σχοινιά']),
        ('Αίθουσα Pilates', 20, ARRAY['Ματς Pilates', 'Καυκάσια', 'Σχοινιά']),
        ('Αίθουσα Martial Arts', 18, ARRAY['Σακούλια', 'Γάντια', 'Προστατευτικά']),
        ('Αίθουσα Yoga', 15, ARRAY['Ματς Yoga', 'Μπλοκ', 'Σχοινιά']),
        ('Αίθουσα Cardio', 25, ARRAY['Τροχοί', 'Σχοινιά', 'Battle Ropes'])
        ) AS v(name, capacity, equipment)
        WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE rooms.name = v.name);
    ELSE
        -- Minimal insert with just name and capacity
        INSERT INTO rooms (name, capacity) 
        SELECT * FROM (VALUES
        ('Κύρια Αίθουσα', 30),
        ('Αίθουσα Pilates', 20),
        ('Αίθουσα Martial Arts', 18),
        ('Αίθουσα Yoga', 15),
        ('Αίθουσα Cardio', 25)
        ) AS v(name, capacity)
        WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE rooms.name = v.name);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lessons_category_id ON lessons(category_id);
CREATE INDEX IF NOT EXISTS idx_lessons_trainer_id ON lessons(trainer_id);
CREATE INDEX IF NOT EXISTS idx_lessons_room_id ON lessons(room_id);
CREATE INDEX IF NOT EXISTS idx_lessons_day_of_week ON lessons(day_of_week);
CREATE INDEX IF NOT EXISTS idx_lessons_is_active ON lessons(is_active);
CREATE INDEX IF NOT EXISTS idx_lesson_bookings_user_id ON lesson_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_bookings_lesson_id ON lesson_bookings(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_bookings_booking_date ON lesson_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_lesson_attendance_user_id ON lesson_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attendance_lesson_id ON lesson_attendance(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attendance_attendance_date ON lesson_attendance(attendance_date);

-- Create RLS policies
ALTER TABLE lesson_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_attendance ENABLE ROW LEVEL SECURITY;

-- RLS policies for lesson_categories
DROP POLICY IF EXISTS "Anyone can view lesson categories" ON lesson_categories;
CREATE POLICY "Anyone can view lesson categories" ON lesson_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage lesson categories" ON lesson_categories;
CREATE POLICY "Admins can manage lesson categories" ON lesson_categories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- RLS policies for rooms
DROP POLICY IF EXISTS "Anyone can view rooms" ON rooms;
CREATE POLICY "Anyone can view rooms" ON rooms FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage rooms" ON rooms;
CREATE POLICY "Admins can manage rooms" ON rooms FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- RLS policies for trainers
DROP POLICY IF EXISTS "Anyone can view trainers" ON trainers;
CREATE POLICY "Anyone can view trainers" ON trainers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage trainers" ON trainers;
CREATE POLICY "Admins can manage trainers" ON trainers FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- RLS policies for lessons
DROP POLICY IF EXISTS "Anyone can view lessons" ON lessons;
CREATE POLICY "Anyone can view lessons" ON lessons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;
CREATE POLICY "Admins can manage lessons" ON lessons FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- RLS policies for lesson_schedules
DROP POLICY IF EXISTS "Anyone can view lesson schedules" ON lesson_schedules;
CREATE POLICY "Anyone can view lesson schedules" ON lesson_schedules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage lesson schedules" ON lesson_schedules;
CREATE POLICY "Admins can manage lesson schedules" ON lesson_schedules FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- RLS policies for lesson_bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON lesson_bookings;
CREATE POLICY "Users can view their own bookings" ON lesson_bookings FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can create their own bookings" ON lesson_bookings;
CREATE POLICY "Users can create their own bookings" ON lesson_bookings FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update their own bookings" ON lesson_bookings;
CREATE POLICY "Users can update their own bookings" ON lesson_bookings FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can manage all bookings" ON lesson_bookings;
CREATE POLICY "Admins can manage all bookings" ON lesson_bookings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('admin', 'secretary')
    )
);

-- RLS policies for lesson_attendance
DROP POLICY IF EXISTS "Users can view their own attendance" ON lesson_attendance;
CREATE POLICY "Users can view their own attendance" ON lesson_attendance FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can manage all attendance" ON lesson_attendance;
CREATE POLICY "Admins can manage all attendance" ON lesson_attendance FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('admin', 'secretary', 'trainer')
    )
);

-- Create functions for lesson management
CREATE OR REPLACE FUNCTION get_lesson_availability(
    p_lesson_id UUID,
    p_date DATE
)
RETURNS TABLE(
    total_capacity INTEGER,
    current_bookings INTEGER,
    available_spots INTEGER,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.capacity as total_capacity,
        COALESCE(COUNT(lb.id), 0)::INTEGER as current_bookings,
        (l.capacity - COALESCE(COUNT(lb.id), 0))::INTEGER as available_spots,
        (l.capacity - COALESCE(COUNT(lb.id), 0)) > 0 as is_available
    FROM lessons l
    LEFT JOIN lesson_bookings lb ON l.id = lb.lesson_id 
        AND lb.booking_date = p_date 
        AND lb.status != 'cancelled'
    WHERE l.id = p_lesson_id
    GROUP BY l.id, l.capacity;
END;
$$ LANGUAGE plpgsql;

-- Create function to book a lesson
CREATE OR REPLACE FUNCTION book_lesson(
    p_user_id UUID,
    p_lesson_id UUID,
    p_booking_date DATE
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    booking_id UUID
) AS $$
DECLARE
    v_availability RECORD;
    v_booking_id UUID;
    v_lesson RECORD;
    v_has_day_of_week BOOLEAN;
BEGIN
    -- Check if day_of_week column exists
    SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lessons' AND column_name = 'day_of_week') INTO v_has_day_of_week;

    -- Get lesson details
    IF v_has_day_of_week THEN
        SELECT * INTO v_lesson FROM lessons WHERE id = p_lesson_id AND is_active = true;
    ELSE
        SELECT id, name, description, category_id, trainer_id, room_id, capacity, price, is_active, created_at, updated_at
        INTO v_lesson FROM lessons WHERE id = p_lesson_id AND is_active = true;
    END IF;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Lesson not found or inactive'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- Check if lesson is on the correct day (only if day_of_week column exists)
    IF v_has_day_of_week AND v_lesson.day_of_week IS NOT NULL THEN
        IF EXTRACT(DOW FROM p_booking_date) != v_lesson.day_of_week THEN
            RETURN QUERY SELECT false, 'Lesson is not available on this date'::TEXT, NULL::UUID;
            RETURN;
        END IF;
    END IF;
    
    -- Check availability
    SELECT * INTO v_availability FROM get_lesson_availability(p_lesson_id, p_booking_date);
    
    IF NOT v_availability.is_available THEN
        RETURN QUERY SELECT false, 'No available spots for this lesson'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Check if user already has a booking for this lesson and date
    IF EXISTS(
        SELECT 1 FROM lesson_bookings 
        WHERE user_id = p_user_id 
        AND lesson_id = p_lesson_id 
        AND booking_date = p_booking_date 
        AND status != 'cancelled'
    ) THEN
        RETURN QUERY SELECT false, 'You already have a booking for this lesson'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Create booking
    INSERT INTO lesson_bookings (user_id, lesson_id, booking_date)
    VALUES (p_user_id, p_lesson_id, p_booking_date)
    RETURNING id INTO v_booking_id;
    
    RETURN QUERY SELECT true, 'Booking created successfully'::TEXT, v_booking_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to cancel a booking
CREATE OR REPLACE FUNCTION cancel_lesson_booking(
    p_booking_id UUID,
    p_user_id UUID
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_booking RECORD;
BEGIN
    -- Get booking details
    SELECT * INTO v_booking FROM lesson_bookings WHERE id = p_booking_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Booking not found'::TEXT;
        RETURN;
    END IF;
    
    -- Check if booking can be cancelled (e.g., not on the same day)
    IF v_booking.booking_date <= CURRENT_DATE THEN
        RETURN QUERY SELECT false, 'Cannot cancel booking on or after the lesson date'::TEXT;
        RETURN;
    END IF;
    
    -- Cancel booking
    UPDATE lesson_bookings 
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = p_booking_id;
    
    RETURN QUERY SELECT true, 'Booking cancelled successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's lesson bookings
CREATE OR REPLACE FUNCTION get_user_lesson_bookings(
    p_user_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    booking_id UUID,
    lesson_id UUID,
    lesson_name TEXT,
    lesson_description TEXT,
    category_name TEXT,
    trainer_name TEXT,
    room_name TEXT,
    booking_date DATE,
    start_time TIME,
    end_time TIME,
    status TEXT,
    capacity INTEGER,
    current_bookings INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lb.id as booking_id,
        l.id as lesson_id,
        l.name as lesson_name,
        l.description as lesson_description,
        lc.name as category_name,
        CONCAT(up.first_name, ' ', up.last_name) as trainer_name,
        r.name as room_name,
        lb.booking_date,
        l.start_time,
        l.end_time,
        lb.status,
        l.capacity,
        (SELECT COUNT(*) FROM lesson_bookings lb2 
         WHERE lb2.lesson_id = l.id 
         AND lb2.booking_date = lb.booking_date 
         AND lb2.status != 'cancelled')::INTEGER as current_bookings
    FROM lesson_bookings lb
    JOIN lessons l ON lb.lesson_id = l.id
    LEFT JOIN lesson_categories lc ON l.category_id = lc.id
    LEFT JOIN trainers t ON l.trainer_id = t.id
    LEFT JOIN user_profiles up ON t.user_id = up.user_id
    LEFT JOIN rooms r ON l.room_id = r.id
    WHERE lb.user_id = p_user_id
    AND (p_start_date IS NULL OR lb.booking_date >= p_start_date)
    AND (p_end_date IS NULL OR lb.booking_date <= p_end_date)
    ORDER BY lb.booking_date DESC, l.start_time;
END;
$$ LANGUAGE plpgsql;

-- Create function to get available lessons for a date
CREATE OR REPLACE FUNCTION get_available_lessons(
    p_date DATE
)
RETURNS TABLE(
    lesson_id UUID,
    lesson_name TEXT,
    lesson_description TEXT,
    category_name TEXT,
    category_color TEXT,
    trainer_name TEXT,
    room_name TEXT,
    start_time TIME,
    end_time TIME,
    capacity INTEGER,
    available_spots INTEGER,
    difficulty TEXT,
    price DECIMAL(10,2)
) AS $$
DECLARE
    v_has_day_of_week BOOLEAN;
BEGIN
    -- Check if day_of_week column exists
    SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lessons' AND column_name = 'day_of_week') INTO v_has_day_of_week;

    IF v_has_day_of_week THEN
        -- Query with day_of_week filter
        RETURN QUERY
        SELECT
            l.id as lesson_id,
            l.name as lesson_name,
            l.description as lesson_description,
            lc.name as category_name,
            lc.color as category_color,
            CONCAT(up.first_name, ' ', up.last_name) as trainer_name,
            r.name as room_name,
            l.start_time,
            l.end_time,
            l.capacity,
            (l.capacity - COALESCE(booked_count.count, 0))::INTEGER as available_spots,
            l.difficulty,
            l.price
        FROM lessons l
        LEFT JOIN lesson_categories lc ON l.category_id = lc.id
        LEFT JOIN trainers t ON l.trainer_id = t.id
        LEFT JOIN user_profiles up ON t.user_id = up.user_id
        LEFT JOIN rooms r ON l.room_id = r.id
        LEFT JOIN (
            SELECT
                lesson_id,
                COUNT(*) as count
            FROM lesson_bookings
            WHERE booking_date = p_date
            AND status != 'cancelled'
            GROUP BY lesson_id
        ) booked_count ON l.id = booked_count.lesson_id
        WHERE l.is_active = true
        AND l.day_of_week = EXTRACT(DOW FROM p_date)
        AND (l.capacity - COALESCE(booked_count.count, 0)) > 0
        ORDER BY l.start_time;
    ELSE
        -- Query without day_of_week filter
        RETURN QUERY
        SELECT
            l.id as lesson_id,
            l.name as lesson_name,
            l.description as lesson_description,
            lc.name as category_name,
            lc.color as category_color,
            CONCAT(up.first_name, ' ', up.last_name) as trainer_name,
            r.name as room_name,
            l.start_time,
            l.end_time,
            l.capacity,
            (l.capacity - COALESCE(booked_count.count, 0))::INTEGER as available_spots,
            l.difficulty,
            l.price
        FROM lessons l
        LEFT JOIN lesson_categories lc ON l.category_id = lc.id
        LEFT JOIN trainers t ON l.trainer_id = t.id
        LEFT JOIN user_profiles up ON t.user_id = up.user_id
        LEFT JOIN rooms r ON l.room_id = r.id
        LEFT JOIN (
            SELECT
                lesson_id,
                COUNT(*) as count
            FROM lesson_bookings
            WHERE booking_date = p_date
            AND status != 'cancelled'
            GROUP BY lesson_id
        ) booked_count ON l.id = booked_count.lesson_id
        WHERE l.is_active = true
        AND (l.capacity - COALESCE(booked_count.count, 0)) > 0
        ORDER BY l.start_time;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist, then create new ones
DROP TRIGGER IF EXISTS update_lesson_categories_updated_at ON lesson_categories;
CREATE TRIGGER update_lesson_categories_updated_at
    BEFORE UPDATE ON lesson_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trainers_updated_at ON trainers;
CREATE TRIGGER update_trainers_updated_at
    BEFORE UPDATE ON trainers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_schedules_updated_at ON lesson_schedules;
CREATE TRIGGER update_lesson_schedules_updated_at
    BEFORE UPDATE ON lesson_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_bookings_updated_at ON lesson_bookings;
CREATE TRIGGER update_lesson_bookings_updated_at
    BEFORE UPDATE ON lesson_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_attendance_updated_at ON lesson_attendance;
CREATE TRIGGER update_lesson_attendance_updated_at
    BEFORE UPDATE ON lesson_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
