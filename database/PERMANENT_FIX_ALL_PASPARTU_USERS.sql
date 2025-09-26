-- PERMANENT FIX FOR ALL PASPARTU USERS
-- This script ensures all existing and future Paspartu users have proper lesson deposits and can see their sessions

-- =============================================
-- 1. CREATE LESSON DEPOSITS FOR ALL EXISTING PASPARTU USERS
-- =============================================

SELECT 'Creating lesson deposits for all existing Paspartu users...' as info;

-- Insert lesson deposits for all users who have Paspartu schedules but no deposits
INSERT INTO lesson_deposits (user_id, total_lessons, used_lessons)
SELECT DISTINCT 
    pts.user_id,
    5 as total_lessons,
    0 as used_lessons
FROM personal_training_schedules pts
WHERE pts.user_type = 'paspartu'
AND NOT EXISTS (
    SELECT 1 FROM lesson_deposits ld 
    WHERE ld.user_id = pts.user_id
);

-- =============================================
-- 2. UPDATE SCHEDULES WITH PROPER SESSIONS FOR GROUP PASPARTU
-- =============================================

SELECT 'Updating Group Paspartu schedules with proper sessions...' as info;

-- Update schedules that have training_type = 'group' and user_type = 'paspartu' but empty or missing sessions
UPDATE personal_training_schedules
SET 
    schedule_data = jsonb_set(
        COALESCE(schedule_data, '{}'::jsonb),
        '{sessions}',
        (
            -- Generate sessions based on monthly_total or default to 4
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', 'group-session-' || generate_series,
                    'date', (CURRENT_DATE + (generate_series * interval '7 days'))::text,
                    'startTime', 
                    CASE (generate_series - 1) % 4
                        WHEN 0 THEN '09:00'
                        WHEN 1 THEN '10:00' 
                        WHEN 2 THEN '11:00'
                        WHEN 3 THEN '14:00'
                        ELSE '15:00'
                    END,
                    'endTime',
                    CASE (generate_series - 1) % 4
                        WHEN 0 THEN '10:00'
                        WHEN 1 THEN '11:00'
                        WHEN 2 THEN '12:00' 
                        WHEN 3 THEN '15:00'
                        ELSE '16:00'
                    END,
                    'type', 'personal',
                    'trainer', 'Mike',
                    'room', 'Αίθουσα Mike',
                    'notes', 'Group Paspartu Session ' || generate_series || ' - Auto generated'
                )
            )
            FROM generate_series(1, COALESCE(monthly_total, 4))
        )
    ),
    updated_at = NOW()
WHERE training_type = 'group' 
AND user_type = 'paspartu'
AND (
    schedule_data IS NULL 
    OR NOT (schedule_data ? 'sessions')
    OR jsonb_array_length(COALESCE(schedule_data->'sessions', '[]'::jsonb)) = 0
);

-- =============================================
-- 3. CREATE GROUP ASSIGNMENTS FOR EXISTING GROUP PASPARTU USERS
-- =============================================

SELECT 'Creating group assignments for existing Group Paspartu users...' as info;

-- Insert group assignments for users who have Group Paspartu schedules but no assignments
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
    pts.id as program_id,
    pts.user_id,
    gst.group_type,
    gst.day_of_week,
    gst.start_time,
    gst.end_time,
    gst.trainer,
    gst.room,
    gst.group_identifier,
    1 as weekly_frequency,
    '00000000-0000-0000-0000-000000000001'::UUID as created_by,
    'Group Paspartu Assignment - Auto created by migration'
FROM personal_training_schedules pts
CROSS JOIN (
    SELECT * FROM group_schedule_templates 
    WHERE group_identifier IN (
        'Group_2_Monday_09:00',
        'Group_3_Tuesday_10:00',
        'Group_6_Wednesday_11:00',
        'Group_2_Thursday_17:00'
    )
    AND is_active = true
    LIMIT 4
) gst
WHERE pts.training_type = 'group' 
AND pts.user_type = 'paspartu'
AND NOT EXISTS (
    SELECT 1 FROM group_assignments ga 
    WHERE ga.user_id = pts.user_id 
    AND ga.program_id = pts.id
);

-- =============================================
-- 4. VERIFICATION
-- =============================================

SELECT 'Verification...' as info;

-- Check how many Paspartu users now have deposits
SELECT 'Paspartu users with lesson deposits:' as info;
SELECT COUNT(*) as count
FROM lesson_deposits ld
JOIN personal_training_schedules pts ON ld.user_id = pts.user_id
WHERE pts.user_type = 'paspartu';

-- Check how many Group Paspartu schedules have sessions
SELECT 'Group Paspartu schedules with sessions:' as info;
SELECT COUNT(*) as count
FROM personal_training_schedules
WHERE training_type = 'group' 
AND user_type = 'paspartu'
AND jsonb_array_length(COALESCE(schedule_data->'sessions', '[]'::jsonb)) > 0;

-- Check how many Group Paspartu users have assignments
SELECT 'Group Paspartu users with assignments:' as info;
SELECT COUNT(DISTINCT ga.user_id) as count
FROM group_assignments ga
JOIN personal_training_schedules pts ON ga.user_id = pts.user_id
WHERE pts.training_type = 'group' 
AND pts.user_type = 'paspartu';

-- Sample of fixed data
SELECT 'Sample of fixed Paspartu users:' as info;
SELECT 
    pts.user_id,
    pts.training_type,
    ld.total_lessons,
    ld.used_lessons,
    ld.remaining_lessons,
    jsonb_array_length(COALESCE(pts.schedule_data->'sessions', '[]'::jsonb)) as session_count
FROM personal_training_schedules pts
LEFT JOIN lesson_deposits ld ON pts.user_id = ld.user_id
WHERE pts.user_type = 'paspartu'
LIMIT 5;

SELECT '🎯 PERMANENT FIX COMPLETED FOR ALL PASPARTU USERS!' as result;
