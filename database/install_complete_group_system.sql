-- Complete Group Assignment System Installation
-- Run this script in your Supabase SQL Editor to install/fix the complete system

-- Step 1: Create tables if they don't exist
SELECT 'Creating group assignment tables...' as step;

-- Group Assignments table
CREATE TABLE IF NOT EXISTS group_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID NOT NULL REFERENCES personal_training_schedules(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    group_type INTEGER NOT NULL CHECK (group_type IN (2, 3, 6)),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    trainer TEXT NOT NULL CHECK (trainer IN ('Mike', 'Jordan')),
    room TEXT,
    group_identifier TEXT NOT NULL,
    weekly_frequency INTEGER NOT NULL CHECK (weekly_frequency BETWEEN 1 AND 5),
    assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    CONSTRAINT no_user_time_conflicts UNIQUE (user_id, day_of_week, start_time, end_time, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Group Schedule Templates table
CREATE TABLE IF NOT EXISTS group_schedule_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_type INTEGER NOT NULL CHECK (group_type IN (2, 3, 6)),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    trainer TEXT NOT NULL CHECK (trainer IN ('Mike', 'Jordan')),
    room TEXT,
    group_identifier TEXT NOT NULL UNIQUE,
    max_capacity INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Weekly Assignments table
CREATE TABLE IF NOT EXISTS user_weekly_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES personal_training_schedules(id) ON DELETE CASCADE,
    target_weekly_frequency INTEGER NOT NULL CHECK (target_weekly_frequency BETWEEN 1 AND 5),
    current_assignments_count INTEGER NOT NULL DEFAULT 0,
    week_start_date DATE NOT NULL,
    is_complete BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_program_week UNIQUE (user_id, program_id, week_start_date)
);

-- Step 2: Add group fields to personal_training_schedules
SELECT 'Adding group fields to personal_training_schedules...' as step;

ALTER TABLE personal_training_schedules 
ADD COLUMN IF NOT EXISTS training_type TEXT CHECK (training_type IN ('individual', 'group')),
ADD COLUMN IF NOT EXISTS group_room_size INTEGER CHECK (group_room_size IN (2, 3, 6)),
ADD COLUMN IF NOT EXISTS weekly_frequency INTEGER CHECK (weekly_frequency BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS monthly_total INTEGER;

-- Update existing records
UPDATE personal_training_schedules 
SET training_type = 'individual'
WHERE training_type IS NULL;

-- Step 3: Create indexes
SELECT 'Creating indexes...' as step;

CREATE INDEX IF NOT EXISTS idx_group_assignments_program_id ON group_assignments(program_id);
CREATE INDEX IF NOT EXISTS idx_group_assignments_user_id ON group_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_group_assignments_group_identifier ON group_assignments(group_identifier);
CREATE INDEX IF NOT EXISTS idx_group_assignments_day_time ON group_assignments(day_of_week, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_group_assignments_trainer ON group_assignments(trainer);
CREATE INDEX IF NOT EXISTS idx_group_assignments_active ON group_assignments(is_active);

CREATE INDEX IF NOT EXISTS idx_group_schedule_templates_group_type ON group_schedule_templates(group_type);
CREATE INDEX IF NOT EXISTS idx_group_schedule_templates_day_time ON group_schedule_templates(day_of_week, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_group_schedule_templates_trainer ON group_schedule_templates(trainer);
CREATE INDEX IF NOT EXISTS idx_group_schedule_templates_active ON group_schedule_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_user_weekly_assignments_user_id ON user_weekly_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_weekly_assignments_program_id ON user_weekly_assignments(program_id);
CREATE INDEX IF NOT EXISTS idx_user_weekly_assignments_week ON user_weekly_assignments(week_start_date);

CREATE INDEX IF NOT EXISTS idx_personal_training_schedules_training_type ON personal_training_schedules(training_type);
CREATE INDEX IF NOT EXISTS idx_personal_training_schedules_group_room_size ON personal_training_schedules(group_room_size);

-- Step 4: Enable RLS
SELECT 'Enabling RLS...' as step;

ALTER TABLE group_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_weekly_assignments ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
SELECT 'Creating RLS policies...' as step;

-- Drop existing policies first
DROP POLICY IF EXISTS "Enable all for admin and secretary" ON group_assignments;
DROP POLICY IF EXISTS "Users can view their own assignments" ON group_assignments;
DROP POLICY IF EXISTS "Enable all for admin and secretary on templates" ON group_schedule_templates;
DROP POLICY IF EXISTS "Users can view templates" ON group_schedule_templates;
DROP POLICY IF EXISTS "Enable all for admin and secretary on weekly" ON user_weekly_assignments;
DROP POLICY IF EXISTS "Users can view their own weekly assignments" ON user_weekly_assignments;

-- Create new policies
CREATE POLICY "Enable all for admin and secretary" ON group_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );

CREATE POLICY "Users can view their own assignments" ON group_assignments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable all for admin and secretary on templates" ON group_schedule_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );

CREATE POLICY "Users can view templates" ON group_schedule_templates
    FOR SELECT USING (true);

CREATE POLICY "Enable all for admin and secretary on weekly" ON user_weekly_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );

CREATE POLICY "Users can view their own weekly assignments" ON user_weekly_assignments
    FOR SELECT USING (auth.uid() = user_id);

-- Step 6: Create functions
SELECT 'Creating functions...' as step;

-- Function to get available group slots
CREATE OR REPLACE FUNCTION get_available_group_slots(p_day_of_week INTEGER DEFAULT NULL)
RETURNS TABLE (
    template_id UUID,
    group_type INTEGER,
    day_of_week INTEGER,
    start_time TIME,
    end_time TIME,
    trainer TEXT,
    room TEXT,
    group_identifier TEXT,
    max_capacity INTEGER,
    current_assignments INTEGER,
    available_spots INTEGER,
    is_full BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user has admin or secretary role
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'secretary')
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin or Secretary role required.';
    END IF;

    RETURN QUERY
    SELECT 
        gst.id as template_id,
        gst.group_type,
        gst.day_of_week,
        gst.start_time,
        gst.end_time,
        gst.trainer,
        gst.room,
        gst.group_identifier,
        gst.max_capacity,
        COALESCE(ga_count.assignment_count, 0)::INTEGER as current_assignments,
        (gst.max_capacity - COALESCE(ga_count.assignment_count, 0))::INTEGER as available_spots,
        (COALESCE(ga_count.assignment_count, 0) >= gst.max_capacity) as is_full
    FROM group_schedule_templates gst
    LEFT JOIN (
        SELECT 
            ga.group_identifier,
            COUNT(*) as assignment_count
        FROM group_assignments ga
        WHERE ga.is_active = true
        GROUP BY ga.group_identifier
    ) ga_count ON gst.group_identifier = ga_count.group_identifier
    WHERE gst.is_active = true
    AND (p_day_of_week IS NULL OR gst.day_of_week = p_day_of_week)
    ORDER BY gst.day_of_week, gst.start_time, gst.group_type;
END;
$$;

-- Function to validate assignments
CREATE OR REPLACE FUNCTION validate_group_assignment(
    p_user_id UUID,
    p_program_id UUID,
    p_group_identifier TEXT,
    p_day_of_week INTEGER,
    p_start_time TIME,
    p_end_time TIME,
    p_target_weekly_frequency INTEGER
)
RETURNS TABLE (
    is_valid BOOLEAN,
    error_message TEXT,
    error_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_group_capacity INTEGER;
    v_current_assignments INTEGER;
    v_user_current_frequency INTEGER;
    v_has_time_conflict BOOLEAN;
BEGIN
    -- Check if user has admin or secretary role
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'secretary')
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin or Secretary role required.';
    END IF;

    -- Check group capacity
    SELECT max_capacity INTO v_group_capacity
    FROM group_schedule_templates
    WHERE group_identifier = p_group_identifier AND is_active = true;

    IF v_group_capacity IS NULL THEN
        RETURN QUERY SELECT false, 'Group slot not found or inactive', 'GROUP_NOT_FOUND';
        RETURN;
    END IF;

    -- Check current assignments for this group
    SELECT COUNT(*) INTO v_current_assignments
    FROM group_assignments
    WHERE group_identifier = p_group_identifier AND is_active = true;

    IF v_current_assignments >= v_group_capacity THEN
        RETURN QUERY SELECT false, 'Group is at full capacity', 'CAPACITY_EXCEEDED';
        RETURN;
    END IF;

    -- Check user's weekly frequency
    SELECT COUNT(*) INTO v_user_current_frequency
    FROM group_assignments
    WHERE user_id = p_user_id 
    AND program_id = p_program_id 
    AND is_active = true;

    IF v_user_current_frequency >= p_target_weekly_frequency THEN
        RETURN QUERY SELECT false, 'User has reached weekly frequency limit', 'FREQUENCY_EXCEEDED';
        RETURN;
    END IF;

    -- Check for time conflicts
    SELECT EXISTS (
        SELECT 1 FROM group_assignments
        WHERE user_id = p_user_id
        AND day_of_week = p_day_of_week
        AND is_active = true
        AND (
            (p_start_time >= start_time AND p_start_time < end_time) OR
            (p_end_time > start_time AND p_end_time <= end_time) OR
            (p_start_time <= start_time AND p_end_time >= end_time)
        )
    ) INTO v_has_time_conflict;

    IF v_has_time_conflict THEN
        RETURN QUERY SELECT false, 'User has a conflicting assignment at this time', 'TIME_CONFLICT';
        RETURN;
    END IF;

    -- All validations passed
    RETURN QUERY SELECT true, 'Assignment is valid', 'VALID';
    RETURN;
END;
$$;

-- Function to create assignments
CREATE OR REPLACE FUNCTION create_group_assignment(
    p_program_id UUID,
    p_user_id UUID,
    p_group_identifier TEXT,
    p_weekly_frequency INTEGER,
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    assignment_id UUID,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_template_record RECORD;
    v_validation_result RECORD;
    v_new_assignment_id UUID;
BEGIN
    -- Check if user has admin or secretary role
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'secretary')
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin or Secretary role required.';
    END IF;

    -- Get group template details
    SELECT * INTO v_template_record
    FROM group_schedule_templates
    WHERE group_identifier = p_group_identifier AND is_active = true;

    IF v_template_record IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Group slot not found';
        RETURN;
    END IF;

    -- Validate the assignment
    SELECT * INTO v_validation_result
    FROM validate_group_assignment(
        p_user_id,
        p_program_id,
        p_group_identifier,
        v_template_record.day_of_week,
        v_template_record.start_time,
        v_template_record.end_time,
        p_weekly_frequency
    );

    IF NOT v_validation_result.is_valid THEN
        RETURN QUERY SELECT false, NULL::UUID, v_validation_result.error_message;
        RETURN;
    END IF;

    -- Create the assignment
    INSERT INTO group_assignments (
        program_id,
        user_id,
        group_type,
        day_of_week,
        start_time,
        end_time,
        trainer,
        room,
        group_identifier,
        weekly_frequency,
        created_by,
        notes
    ) VALUES (
        p_program_id,
        p_user_id,
        v_template_record.group_type,
        v_template_record.day_of_week,
        v_template_record.start_time,
        v_template_record.end_time,
        v_template_record.trainer,
        v_template_record.room,
        p_group_identifier,
        p_weekly_frequency,
        auth.uid(),
        p_notes
    ) RETURNING id INTO v_new_assignment_id;

    -- Update or create user weekly assignment summary
    INSERT INTO user_weekly_assignments (
        user_id,
        program_id,
        target_weekly_frequency,
        current_assignments_count,
        week_start_date
    ) VALUES (
        p_user_id,
        p_program_id,
        p_weekly_frequency,
        1,
        date_trunc('week', CURRENT_DATE)::DATE
    )
    ON CONFLICT (user_id, program_id, week_start_date)
    DO UPDATE SET
        current_assignments_count = user_weekly_assignments.current_assignments_count + 1,
        is_complete = (user_weekly_assignments.current_assignments_count + 1) >= user_weekly_assignments.target_weekly_frequency,
        updated_at = NOW();

    RETURN QUERY SELECT true, v_new_assignment_id, 'Assignment created successfully';
END;
$$;

-- Step 7: Create triggers
SELECT 'Creating triggers...' as step;

CREATE OR REPLACE FUNCTION update_group_assignment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_group_assignments_updated_at ON group_assignments;
CREATE TRIGGER update_group_assignments_updated_at
    BEFORE UPDATE ON group_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_group_assignment_timestamp();

DROP TRIGGER IF EXISTS update_group_schedule_templates_updated_at ON group_schedule_templates;
CREATE TRIGGER update_group_schedule_templates_updated_at
    BEFORE UPDATE ON group_schedule_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_group_assignment_timestamp();

DROP TRIGGER IF EXISTS update_user_weekly_assignments_updated_at ON user_weekly_assignments;
CREATE TRIGGER update_user_weekly_assignments_updated_at
    BEFORE UPDATE ON user_weekly_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_group_assignment_timestamp();

-- Step 8: Populate default templates
SELECT 'Populating default group schedule templates...' as step;

DO $$
DECLARE
    v_admin_user_id UUID;
BEGIN
    -- Find an admin user
    SELECT user_id INTO v_admin_user_id
    FROM user_profiles 
    WHERE role = 'admin' 
    LIMIT 1;
    
    -- If no admin found, use any user
    IF v_admin_user_id IS NULL THEN
        SELECT user_id INTO v_admin_user_id
        FROM user_profiles 
        LIMIT 1;
    END IF;
    
    -- If still no user found, skip template population
    IF v_admin_user_id IS NULL THEN
        RAISE NOTICE 'No users found in user_profiles table. Skipping template population.';
        RETURN;
    END IF;
    
    -- Insert templates for Monday through Saturday
    INSERT INTO group_schedule_templates (group_type, day_of_week, start_time, end_time, trainer, room, group_identifier, max_capacity, created_by)
    VALUES 
        -- Monday
        (2, 1, '09:00', '10:00', 'Mike', 'Room 2', 'Group_2_Monday_09:00', 2, v_admin_user_id),
        (3, 1, '10:00', '11:00', 'Jordan', 'Room 3', 'Group_3_Monday_10:00', 3, v_admin_user_id),
        (6, 1, '11:00', '12:00', 'Mike', 'Room 6', 'Group_6_Monday_11:00', 6, v_admin_user_id),
        (2, 1, '17:00', '18:00', 'Jordan', 'Room 2', 'Group_2_Monday_17:00', 2, v_admin_user_id),
        (3, 1, '18:00', '19:00', 'Mike', 'Room 3', 'Group_3_Monday_18:00', 3, v_admin_user_id),
        (6, 1, '19:00', '20:00', 'Jordan', 'Room 6', 'Group_6_Monday_19:00', 6, v_admin_user_id),
        -- Tuesday
        (2, 2, '09:00', '10:00', 'Jordan', 'Room 2', 'Group_2_Tuesday_09:00', 2, v_admin_user_id),
        (3, 2, '10:00', '11:00', 'Mike', 'Room 3', 'Group_3_Tuesday_10:00', 3, v_admin_user_id),
        (6, 2, '11:00', '12:00', 'Jordan', 'Room 6', 'Group_6_Tuesday_11:00', 6, v_admin_user_id),
        (2, 2, '17:00', '18:00', 'Mike', 'Room 2', 'Group_2_Tuesday_17:00', 2, v_admin_user_id),
        (3, 2, '18:00', '19:00', 'Jordan', 'Room 3', 'Group_3_Tuesday_18:00', 3, v_admin_user_id),
        (6, 2, '19:00', '20:00', 'Mike', 'Room 6', 'Group_6_Tuesday_19:00', 6, v_admin_user_id),
        -- Wednesday
        (2, 3, '09:00', '10:00', 'Mike', 'Room 2', 'Group_2_Wednesday_09:00', 2, v_admin_user_id),
        (3, 3, '10:00', '11:00', 'Jordan', 'Room 3', 'Group_3_Wednesday_10:00', 3, v_admin_user_id),
        (6, 3, '11:00', '12:00', 'Mike', 'Room 6', 'Group_6_Wednesday_11:00', 6, v_admin_user_id),
        (2, 3, '17:00', '18:00', 'Jordan', 'Room 2', 'Group_2_Wednesday_17:00', 2, v_admin_user_id),
        (3, 3, '18:00', '19:00', 'Mike', 'Room 3', 'Group_3_Wednesday_18:00', 3, v_admin_user_id),
        (6, 3, '19:00', '20:00', 'Jordan', 'Room 6', 'Group_6_Wednesday_19:00', 6, v_admin_user_id),
        -- Thursday
        (2, 4, '09:00', '10:00', 'Jordan', 'Room 2', 'Group_2_Thursday_09:00', 2, v_admin_user_id),
        (3, 4, '10:00', '11:00', 'Mike', 'Room 3', 'Group_3_Thursday_10:00', 3, v_admin_user_id),
        (6, 4, '11:00', '12:00', 'Jordan', 'Room 6', 'Group_6_Thursday_11:00', 6, v_admin_user_id),
        (2, 4, '17:00', '18:00', 'Mike', 'Room 2', 'Group_2_Thursday_17:00', 2, v_admin_user_id),
        (3, 4, '18:00', '19:00', 'Jordan', 'Room 3', 'Group_3_Thursday_18:00', 3, v_admin_user_id),
        (6, 4, '19:00', '20:00', 'Mike', 'Room 6', 'Group_6_Thursday_19:00', 6, v_admin_user_id),
        -- Friday
        (2, 5, '09:00', '10:00', 'Mike', 'Room 2', 'Group_2_Friday_09:00', 2, v_admin_user_id),
        (3, 5, '10:00', '11:00', 'Jordan', 'Room 3', 'Group_3_Friday_10:00', 3, v_admin_user_id),
        (6, 5, '11:00', '12:00', 'Mike', 'Room 6', 'Group_6_Friday_11:00', 6, v_admin_user_id),
        (2, 5, '17:00', '18:00', 'Jordan', 'Room 2', 'Group_2_Friday_17:00', 2, v_admin_user_id),
        (3, 5, '18:00', '19:00', 'Mike', 'Room 3', 'Group_3_Friday_18:00', 3, v_admin_user_id),
        (6, 5, '19:00', '20:00', 'Jordan', 'Room 6', 'Group_6_Friday_19:00', 6, v_admin_user_id),
        -- Saturday
        (2, 6, '09:00', '10:00', 'Jordan', 'Room 2', 'Group_2_Saturday_09:00', 2, v_admin_user_id),
        (3, 6, '10:00', '11:00', 'Mike', 'Room 3', 'Group_3_Saturday_10:00', 3, v_admin_user_id),
        (6, 6, '11:00', '12:00', 'Jordan', 'Room 6', 'Group_6_Saturday_11:00', 6, v_admin_user_id),
        (2, 6, '17:00', '18:00', 'Mike', 'Room 2', 'Group_2_Saturday_17:00', 2, v_admin_user_id),
        (3, 6, '18:00', '19:00', 'Jordan', 'Room 3', 'Group_3_Saturday_18:00', 3, v_admin_user_id),
        (6, 6, '19:00', '20:00', 'Mike', 'Room 6', 'Group_6_Saturday_19:00', 6, v_admin_user_id)
    ON CONFLICT (group_identifier) DO NOTHING;
    
    RAISE NOTICE 'Group schedule templates populated successfully!';
END $$;

SELECT '🎉 Complete Group Assignment System installed successfully! 🎉' as result;
