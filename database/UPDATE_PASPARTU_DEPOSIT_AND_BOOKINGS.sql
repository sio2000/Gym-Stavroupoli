-- UPDATE PASPARTU DEPOSIT AND AUTO-CREATE BOOKINGS
-- This function updates the deposit and auto-creates lesson_bookings for Paspartu users
-- Date: 2026-01-05

-- =============================================
-- 1. CREATE FUNCTION TO UPDATE DEPOSIT
-- =============================================

CREATE OR REPLACE FUNCTION update_paspartu_deposit(
    p_user_id UUID,
    p_total_lessons INTEGER,
    p_used_lessons INTEGER,
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
        updated_at
    ) VALUES (
        p_user_id,
        p_total_lessons,
        p_used_lessons,
        p_created_by,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_lessons = p_total_lessons,
        used_lessons = p_used_lessons,
        created_by = COALESCE(p_created_by, lesson_deposits.created_by),
        updated_at = NOW();
        
    RAISE NOTICE 'Updated deposit for user %: % total lessons, % used lessons', p_user_id, p_total_lessons, p_used_lessons;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. CREATE FUNCTION TO AUTO-CREATE BOOKINGS
-- =============================================

CREATE OR REPLACE FUNCTION create_paspartu_bookings(
    p_user_id UUID,
    p_schedule_id UUID,
    p_sessions JSONB
)
RETURNS INTEGER AS $$
DECLARE
    v_session JSONB;
    v_booking_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- Loop through each session and create a booking
    FOR v_session IN SELECT * FROM jsonb_array_elements(p_sessions)
    LOOP
        BEGIN
            INSERT INTO lesson_bookings (
                user_id,
                schedule_id,
                session_id,
                booking_date,
                booking_time,
                trainer_name,
                room,
                status
            ) VALUES (
                p_user_id,
                p_schedule_id,
                v_session->>'id',
                (v_session->>'date')::DATE,
                (v_session->>'startTime')::TIME,
                COALESCE(v_session->>'trainer', 'Mike'),
                v_session->>'room',
                'booked'
            )
            ON CONFLICT (schedule_id, session_id) DO NOTHING
            RETURNING id INTO v_booking_id;
            
            IF v_booking_id IS NOT NULL THEN
                v_count := v_count + 1;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Skip invalid sessions
            RAISE NOTICE 'Failed to create booking for session %: %', v_session->>'id', SQLERRM;
        END;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. CREATE FUNCTION TO GET DEPOSIT (READ)
-- =============================================

CREATE OR REPLACE FUNCTION get_user_lesson_deposit(
    p_user_id UUID
)
RETURNS TABLE(
    total_lessons INTEGER,
    used_lessons INTEGER,
    remaining_lessons INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ld.total_lessons,
        ld.used_lessons,
        ld.remaining_lessons
    FROM lesson_deposits ld
    WHERE ld.user_id = p_user_id;
    
    -- If no rows returned, return zeros
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0::INTEGER, 0::INTEGER, 0::INTEGER;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_paspartu_deposit(UUID, INTEGER, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_paspartu_bookings(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_lesson_deposit(UUID) TO authenticated;

