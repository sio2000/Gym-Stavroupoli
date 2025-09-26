-- FIX PASPARTU DEPOSIT SYSTEM - Διόρθωση συστήματος deposit lessons
-- Date: 2025-09-22
-- 
-- ROOT CAUSE: RLS policies αποτρέπουν τη δημιουργία lesson_deposit records
-- SOLUTION: SECURITY DEFINER function που bypass τα RLS policies

-- =============================================
-- 1. CREATE SECURITY DEFINER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION reset_lesson_deposit_for_new_program(
    p_user_id UUID,
    p_total_lessons INTEGER DEFAULT 5,
    p_created_by UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Insert or update lesson deposit (bypasses RLS with SECURITY DEFINER)
    INSERT INTO lesson_deposits (
        user_id, 
        total_lessons, 
        used_lessons, 
        created_by,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_total_lessons,
        0, -- Start with 0 used lessons
        p_created_by,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_lessons = p_total_lessons,
        used_lessons = 0, -- Reset used lessons
        created_by = p_created_by,
        updated_at = NOW();
        
    RAISE NOTICE 'Set % lessons for user %', p_total_lessons, p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. CREATE FUNCTION TO FIX EXISTING USER
-- =============================================

CREATE OR REPLACE FUNCTION fix_paspartu_user_deposit(
    p_user_id UUID,
    p_total_lessons INTEGER DEFAULT 5,
    p_created_by UUID DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    total_lessons INTEGER,
    used_lessons INTEGER,
    remaining_lessons INTEGER
) AS $$
DECLARE
    v_deposit_id UUID;
    v_total INTEGER;
    v_used INTEGER;
    v_remaining INTEGER;
BEGIN
    -- Create or update the deposit
    PERFORM reset_lesson_deposit_for_new_program(p_user_id, p_total_lessons, p_created_by);
    
    -- Get the deposit details
    SELECT 
        id,
        lesson_deposits.total_lessons,
        lesson_deposits.used_lessons,
        lesson_deposits.remaining_lessons
    INTO 
        v_deposit_id,
        v_total,
        v_used,
        v_remaining
    FROM lesson_deposits
    WHERE user_id = p_user_id;
    
    IF v_deposit_id IS NULL THEN
        RETURN QUERY SELECT 
            FALSE as success,
            'Failed to create deposit' as message,
            0::INTEGER as total_lessons,
            0::INTEGER as used_lessons,
            0::INTEGER as remaining_lessons;
    ELSE
        RETURN QUERY SELECT 
            TRUE as success,
            'Deposit created successfully' as message,
            v_total,
            v_used,
            v_remaining;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. FIX THE SPECIFIC USER
-- =============================================

SELECT 'FIXING PASPARTU USER DEPOSIT...' as info;

-- Fix the specific user mentioned in the console logs
SELECT * FROM fix_paspartu_user_deposit(
    'bcb09526-5d12-49cb-ad54-cdcb340150d4'::UUID,
    5,
    NULL
);

-- =============================================
-- 4. VERIFICATION
-- =============================================

SELECT 'VERIFICATION - Checking deposit...' as info;

SELECT 
    id,
    user_id,
    total_lessons,
    used_lessons,
    remaining_lessons,
    created_at,
    updated_at
FROM lesson_deposits
WHERE user_id = 'bcb09526-5d12-49cb-ad54-cdcb340150d4';

-- =============================================
-- 5. CHECK PERSONAL TRAINING SCHEDULE
-- =============================================

SELECT 'CHECKING PERSONAL TRAINING SCHEDULE...' as info;

SELECT 
    id,
    user_id,
    user_type,
    is_flexible,
    schedule_data,
    created_at,
    updated_at
FROM personal_training_schedules
WHERE user_id = 'bcb09526-5d12-49cb-ad54-cdcb340150d4'
AND user_type = 'paspartu';

-- =============================================
-- 6. CREATE FUNCTION TO ADD SESSIONS TO SCHEDULE
-- =============================================

CREATE OR REPLACE FUNCTION add_paspartu_sessions_to_schedule(
    p_user_id UUID,
    p_session_count INTEGER DEFAULT 5
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    sessions_added INTEGER
) AS $$
DECLARE
    v_schedule_id UUID;
    v_schedule_data JSONB;
    v_sessions JSONB;
    v_session_count INTEGER;
BEGIN
    -- Get the Paspartu schedule
    SELECT id, schedule_data
    INTO v_schedule_id, v_schedule_data
    FROM personal_training_schedules
    WHERE user_id = p_user_id
    AND user_type = 'paspartu'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_schedule_id IS NULL THEN
        RETURN QUERY SELECT 
            FALSE as success,
            'No Paspartu schedule found' as message,
            0::INTEGER as sessions_added;
        RETURN;
    END IF;
    
    -- Initialize sessions array if it doesn't exist
    IF v_schedule_data IS NULL THEN
        v_schedule_data := '{"sessions": []}'::JSONB;
    ELSIF NOT v_schedule_data ? 'sessions' THEN
        v_schedule_data := v_schedule_data || '{"sessions": []}'::JSONB;
    END IF;
    
    -- Create sessions
    v_sessions := '[]'::JSONB;
    FOR i IN 1..p_session_count LOOP
        v_sessions := v_sessions || jsonb_build_object(
            'id', 'session_' || i,
            'title', 'Paspartu Session ' || i,
            'description', 'Flexible Paspartu training session',
            'duration_minutes', 60,
            'is_bookable', true
        );
    END LOOP;
    
    -- Update the schedule with sessions
    UPDATE personal_training_schedules
    SET 
        schedule_data = v_schedule_data || jsonb_build_object('sessions', v_sessions),
        updated_at = NOW()
    WHERE id = v_schedule_id;
    
    GET DIAGNOSTICS v_session_count = ROW_COUNT;
    
    IF v_session_count > 0 THEN
        RETURN QUERY SELECT 
            TRUE as success,
            'Sessions added successfully' as message,
            p_session_count;
    ELSE
        RETURN QUERY SELECT 
            FALSE as success,
            'Failed to update schedule' as message,
            0::INTEGER;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. ADD SESSIONS TO THE SCHEDULE
-- =============================================

SELECT 'ADDING SESSIONS TO SCHEDULE...' as info;

SELECT * FROM add_paspartu_sessions_to_schedule(
    'bcb09526-5d12-49cb-ad54-cdcb340150d4'::UUID,
    5
);

-- =============================================
-- 8. FINAL VERIFICATION
-- =============================================

SELECT 'FINAL VERIFICATION...' as info;

-- Check deposit
SELECT 'DEPOSIT STATUS:' as info;
SELECT 
    total_lessons,
    used_lessons,
    remaining_lessons
FROM lesson_deposits
WHERE user_id = 'bcb09526-5d12-49cb-ad54-cdcb340150d4';

-- Check schedule sessions
SELECT 'SCHEDULE SESSIONS:' as info;
SELECT 
    jsonb_array_length(schedule_data->'sessions') as session_count,
    schedule_data->'sessions' as sessions
FROM personal_training_schedules
WHERE user_id = 'bcb09526-5d12-49cb-ad54-cdcb340150d4'
AND user_type = 'paspartu';

-- =============================================
-- 9. CLEANUP FUNCTIONS (COMMENTED OUT)
-- =============================================

/*
-- To remove the temporary functions after testing:
DROP FUNCTION IF EXISTS fix_paspartu_user_deposit(UUID, INTEGER, UUID);
DROP FUNCTION IF EXISTS add_paspartu_sessions_to_schedule(UUID, INTEGER);
*/
