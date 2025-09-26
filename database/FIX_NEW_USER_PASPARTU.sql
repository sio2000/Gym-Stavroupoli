-- Fix New User Group Paspartu - cf46b8c0-a5bf-41a8-8a22-ed25196a7896
-- This script creates group assignments and lesson deposit for the new user

-- =============================================
-- 1. CREATE LESSON DEPOSIT
-- =============================================

SELECT 'Creating lesson deposit for new user...' as info;

-- Insert lesson deposit (without remaining_lessons as it's generated)
INSERT INTO lesson_deposits (
    user_id,
    total_lessons,
    used_lessons
)
VALUES (
    'cf46b8c0-a5bf-41a8-8a22-ed25196a7896'::UUID,
    5,
    0
)
ON CONFLICT (user_id) 
DO UPDATE SET
    total_lessons = 5,
    used_lessons = 0,
    updated_at = NOW();

-- =============================================
-- 2. CREATE GROUP ASSIGNMENTS FOR USER
-- =============================================

SELECT 'Creating group assignments for new user...' as info;

-- Insert group assignments directly
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
)
SELECT 
    '1c2c031f-c412-4215-8751-3b4fded10f6b'::UUID as program_id,
    'cf46b8c0-a5bf-41a8-8a22-ed25196a7896'::UUID as user_id,
    gst.group_type,
    gst.day_of_week,
    gst.start_time,
    gst.end_time,
    gst.trainer,
    gst.room,
    gst.group_identifier,
    1 as weekly_frequency,
    '00000000-0000-0000-0000-000000000001'::UUID as created_by,
    'Group Paspartu Assignment - Auto created for new user'
FROM group_schedule_templates gst
WHERE gst.group_identifier IN (
    'Group_2_Monday_09:00',
    'Group_3_Tuesday_10:00',
    'Group_6_Wednesday_11:00',
    'Group_2_Thursday_17:00'
)
AND gst.is_active = true;

-- =============================================
-- 3. VERIFICATION
-- =============================================

SELECT 'Verification...' as info;

-- Check assignments
SELECT 'Group Assignments:' as info;
SELECT 
    group_identifier,
    day_of_week,
    start_time,
    end_time,
    trainer,
    room
FROM group_assignments
WHERE user_id = 'cf46b8c0-a5bf-41a8-8a22-ed25196a7896';

-- Check schedule sessions
SELECT 'Schedule Sessions:' as info;
SELECT 
    jsonb_array_length(schedule_data->'sessions') as session_count,
    schedule_data->'sessions' as sessions
FROM personal_training_schedules
WHERE id = '1c2c031f-c412-4215-8751-3b4fded10f6b';

-- Check deposit
SELECT 'Lesson Deposit:' as info;
SELECT 
    total_lessons,
    used_lessons,
    remaining_lessons
FROM lesson_deposits
WHERE user_id = 'cf46b8c0-a5bf-41a8-8a22-ed25196a7896';

SELECT '🎯 New User Group Paspartu setup completed!' as result;
