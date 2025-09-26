-- Simple Fix for Group Paspartu Assignments
-- This script creates group assignments and updates the schedule for the test user

-- =============================================
-- 1. CREATE GROUP ASSIGNMENTS FOR USER
-- =============================================

SELECT 'Creating group assignments for user...' as info;

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
    '962da64f-3c21-4562-ae8f-c28674d676dc'::UUID as program_id,
    '7998415e-2b0b-4a40-9824-cadbd80f6f48'::UUID as user_id,
    gst.group_type,
    gst.day_of_week,
    gst.start_time,
    gst.end_time,
    gst.trainer,
    gst.room,
    gst.group_identifier,
    1 as weekly_frequency,
    '00000000-0000-0000-0000-000000000001'::UUID as created_by,
    'Group Paspartu Assignment - Auto created'
FROM group_schedule_templates gst
WHERE gst.group_identifier IN (
    'Group_2_Monday_09:00',
    'Group_3_Tuesday_10:00',
    'Group_6_Wednesday_11:00',
    'Group_2_Thursday_17:00'
)
AND gst.is_active = true;

-- =============================================
-- 2. CREATE LESSON DEPOSIT
-- =============================================

SELECT 'Creating lesson deposit...' as info;

-- Insert lesson deposit (without remaining_lessons as it's generated)
INSERT INTO lesson_deposits (
    user_id,
    total_lessons,
    used_lessons
)
VALUES (
    '7998415e-2b0b-4a40-9824-cadbd80f6f48'::UUID,
    5,
    0
)
ON CONFLICT (user_id) 
DO UPDATE SET
    total_lessons = 5,
    used_lessons = 0,
    updated_at = NOW();

-- =============================================
-- 3. UPDATE SCHEDULE WITH SIMPLE SESSIONS
-- =============================================

SELECT 'Updating schedule with sessions...' as info;

-- Update the schedule_data.sessions with simple sessions
UPDATE personal_training_schedules
SET 
    schedule_data = jsonb_set(
        schedule_data,
        '{sessions}',
        '[
            {
                "id": "group-session-1",
                "date": "2025-09-25",
                "startTime": "09:00",
                "endTime": "10:00",
                "type": "personal",
                "trainer": "Mike",
                "room": "Room 2",
                "notes": "Group Paspartu Session 1"
            },
            {
                "id": "group-session-2",
                "date": "2025-09-26",
                "startTime": "10:00",
                "endTime": "11:00",
                "type": "personal",
                "trainer": "Jordan",
                "room": "Room 3",
                "notes": "Group Paspartu Session 2"
            },
            {
                "id": "group-session-3",
                "date": "2025-09-27",
                "startTime": "11:00",
                "endTime": "12:00",
                "type": "personal",
                "trainer": "Mike",
                "room": "Room 6",
                "notes": "Group Paspartu Session 3"
            },
            {
                "id": "group-session-4",
                "date": "2025-09-28",
                "startTime": "17:00",
                "endTime": "18:00",
                "type": "personal",
                "trainer": "Jordan",
                "room": "Room 2",
                "notes": "Group Paspartu Session 4"
            }
        ]'::jsonb
    ),
    monthly_total = 4,
    updated_at = NOW()
WHERE id = '962da64f-3c21-4562-ae8f-c28674d676dc';

-- =============================================
-- 4. VERIFICATION
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
WHERE user_id = '7998415e-2b0b-4a40-9824-cadbd80f6f48'
AND program_id = '962da64f-3c21-4562-ae8f-c28674d676dc';

-- Check schedule sessions
SELECT 'Schedule Sessions:' as info;
SELECT 
    jsonb_array_length(schedule_data->'sessions') as session_count,
    schedule_data->'sessions' as sessions
FROM personal_training_schedules
WHERE id = '962da64f-3c21-4562-ae8f-c28674d676dc';

-- Check deposit
SELECT 'Lesson Deposit:' as info;
SELECT 
    total_lessons,
    used_lessons,
    remaining_lessons
FROM lesson_deposits
WHERE user_id = '7998415e-2b0b-4a40-9824-cadbd80f6f48';

SELECT '🎯 Group Paspartu setup completed!' as result;
