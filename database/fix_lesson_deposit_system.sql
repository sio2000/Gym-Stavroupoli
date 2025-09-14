-- Fix Lesson Deposit System for Paspartu Users
-- This script fixes the triggers and ensures proper deposit management

-- First, drop existing triggers and functions to recreate them properly
DROP TRIGGER IF EXISTS trigger_update_deposit_on_booking ON lesson_bookings;
DROP TRIGGER IF EXISTS trigger_update_remaining_lessons ON lesson_deposits;
DROP FUNCTION IF EXISTS update_deposit_on_booking();
DROP FUNCTION IF EXISTS update_remaining_lessons();

-- Recreate the function to update remaining_lessons
CREATE OR REPLACE FUNCTION update_remaining_lessons()
RETURNS TRIGGER AS $$
BEGIN
    NEW.remaining_lessons = NEW.total_lessons - NEW.used_lessons;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to automatically update remaining_lessons
CREATE TRIGGER trigger_update_remaining_lessons
    BEFORE INSERT OR UPDATE ON lesson_deposits
    FOR EACH ROW
    EXECUTE FUNCTION update_remaining_lessons();

-- Recreate the function to automatically update used_lessons when a booking is created/cancelled
CREATE OR REPLACE FUNCTION update_deposit_on_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment used_lessons when booking is created
        UPDATE lesson_deposits 
        SET used_lessons = used_lessons + 1, updated_at = NOW()
        WHERE user_id = NEW.user_id;
        
        -- Log the update for debugging
        RAISE NOTICE 'Updated deposit for user %: used_lessons increased by 1', NEW.user_id;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement used_lessons when booking is deleted
        UPDATE lesson_deposits 
        SET used_lessons = GREATEST(used_lessons - 1, 0), updated_at = NOW()
        WHERE user_id = OLD.user_id;
        
        -- Log the update for debugging
        RAISE NOTICE 'Updated deposit for user %: used_lessons decreased by 1', OLD.user_id;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes (e.g., from booked to cancelled)
        IF OLD.status = 'booked' AND NEW.status = 'cancelled' THEN
            -- Decrement used_lessons when booking is cancelled
            UPDATE lesson_deposits 
            SET used_lessons = GREATEST(used_lessons - 1, 0), updated_at = NOW()
            WHERE user_id = NEW.user_id;
            
            RAISE NOTICE 'Updated deposit for user %: used_lessons decreased by 1 (cancelled booking)', NEW.user_id;
            
        ELSIF OLD.status = 'cancelled' AND NEW.status = 'booked' THEN
            -- Increment used_lessons when booking is reactivated
            UPDATE lesson_deposits 
            SET used_lessons = used_lessons + 1, updated_at = NOW()
            WHERE user_id = NEW.user_id;
            
            RAISE NOTICE 'Updated deposit for user %: used_lessons increased by 1 (reactivated booking)', NEW.user_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to automatically update used_lessons on booking changes
CREATE TRIGGER trigger_update_deposit_on_booking
    AFTER INSERT OR DELETE OR UPDATE ON lesson_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_deposit_on_booking();

-- Function to replace old Paspartu schedule with new one
CREATE OR REPLACE FUNCTION replace_paspartu_schedule(
    p_user_id UUID,
    p_new_schedule_id UUID
)
RETURNS VOID AS $$
DECLARE
    old_schedule_id UUID;
BEGIN
    -- Find the old Paspartu schedule for this user
    SELECT id INTO old_schedule_id
    FROM personal_training_schedules
    WHERE user_id = p_user_id 
    AND user_type = 'paspartu' 
    AND is_flexible = true
    AND id != p_new_schedule_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If old schedule exists, delete it and all its bookings
    IF old_schedule_id IS NOT NULL THEN
        -- Delete all bookings for the old schedule
        DELETE FROM lesson_bookings WHERE schedule_id = old_schedule_id;
        
        -- Delete the old schedule
        DELETE FROM personal_training_schedules WHERE id = old_schedule_id;
        
        RAISE NOTICE 'Replaced old Paspartu schedule % with new schedule % for user %', 
            old_schedule_id, p_new_schedule_id, p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to reset lesson deposit when new program is created
CREATE OR REPLACE FUNCTION reset_lesson_deposit_for_new_program(
    p_user_id UUID,
    p_total_lessons INTEGER DEFAULT 5,
    p_created_by UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Reset the deposit to new values
    INSERT INTO lesson_deposits (user_id, total_lessons, used_lessons, created_by, updated_at)
    VALUES (p_user_id, p_total_lessons, 0, p_created_by, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        total_lessons = p_total_lessons,
        used_lessons = 0,
        created_by = p_created_by,
        updated_at = NOW();
    
    RAISE NOTICE 'Reset lesson deposit for user %: % total lessons, 0 used', p_user_id, p_total_lessons;
END;
$$ LANGUAGE plpgsql;

-- Test the triggers by creating a test function
CREATE OR REPLACE FUNCTION test_lesson_deposit_triggers()
RETURNS TABLE(
    test_name TEXT,
    result TEXT
) AS $$
DECLARE
    test_user_id UUID;
    test_schedule_id UUID;
    test_booking_id UUID;
    deposit_record RECORD;
BEGIN
    -- Create a test user (this would normally be done through the app)
    -- For testing purposes, we'll use an existing user
    
    -- Get the first user from user_profiles
    SELECT user_id INTO test_user_id FROM user_profiles LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RETURN QUERY SELECT 'Setup'::TEXT, 'No users found for testing'::TEXT;
        RETURN;
    END IF;
    
    -- Test 1: Create a lesson deposit
    INSERT INTO lesson_deposits (user_id, total_lessons, used_lessons)
    VALUES (test_user_id, 5, 0)
    ON CONFLICT (user_id) DO UPDATE SET total_lessons = 5, used_lessons = 0;
    
    -- Check if deposit was created correctly
    SELECT * INTO deposit_record FROM lesson_deposits WHERE user_id = test_user_id;
    
    IF deposit_record.remaining_lessons = 5 THEN
        RETURN QUERY SELECT 'Deposit Creation'::TEXT, 'PASS'::TEXT;
    ELSE
        RETURN QUERY SELECT 'Deposit Creation'::TEXT, 'FAIL'::TEXT;
    END IF;
    
    -- Test 2: Create a test schedule
    INSERT INTO personal_training_schedules (user_id, trainer_name, month, year, schedule_data, status, user_type, is_flexible)
    VALUES (test_user_id, 'Test Trainer', 1, 2024, '{"sessions": [{"id": "test-session-1", "date": "2024-01-15", "startTime": "10:00", "endTime": "11:00", "type": "personal", "trainer": "Test Trainer", "room": "Room 1"}]}', 'accepted', 'paspartu', true)
    RETURNING id INTO test_schedule_id;
    
    -- Test 3: Create a booking and check if deposit is updated
    INSERT INTO lesson_bookings (user_id, schedule_id, session_id, booking_date, booking_time, trainer_name, room, status)
    VALUES (test_user_id, test_schedule_id, 'test-session-1', '2024-01-15', '10:00', 'Test Trainer', 'Room 1', 'booked')
    RETURNING id INTO test_booking_id;
    
    -- Check if deposit was updated
    SELECT * INTO deposit_record FROM lesson_deposits WHERE user_id = test_user_id;
    
    IF deposit_record.used_lessons = 1 AND deposit_record.remaining_lessons = 4 THEN
        RETURN QUERY SELECT 'Booking Creation'::TEXT, 'PASS'::TEXT;
    ELSE
        RETURN QUERY SELECT 'Booking Creation'::TEXT, 'FAIL'::TEXT;
    END IF;
    
    -- Test 4: Cancel the booking and check if deposit is updated
    UPDATE lesson_bookings SET status = 'cancelled' WHERE id = test_booking_id;
    
    -- Check if deposit was updated
    SELECT * INTO deposit_record FROM lesson_deposits WHERE user_id = test_user_id;
    
    IF deposit_record.used_lessons = 0 AND deposit_record.remaining_lessons = 5 THEN
        RETURN QUERY SELECT 'Booking Cancellation'::TEXT, 'PASS'::TEXT;
    ELSE
        RETURN QUERY SELECT 'Booking Cancellation'::TEXT, 'FAIL'::TEXT;
    END IF;
    
    -- Cleanup test data
    DELETE FROM lesson_bookings WHERE id = test_booking_id;
    DELETE FROM personal_training_schedules WHERE id = test_schedule_id;
    DELETE FROM lesson_deposits WHERE user_id = test_user_id;
    
    RETURN QUERY SELECT 'Cleanup'::TEXT, 'COMPLETED'::TEXT;
    
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION replace_paspartu_schedule(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_lesson_deposit_for_new_program(UUID, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION test_lesson_deposit_triggers() TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION update_deposit_on_booking() IS 'Automatically updates lesson deposit when bookings are created, cancelled, or deleted';
COMMENT ON FUNCTION replace_paspartu_schedule(UUID, UUID) IS 'Replaces old Paspartu schedule with new one, cleaning up old bookings';
COMMENT ON FUNCTION reset_lesson_deposit_for_new_program(UUID, INTEGER, UUID) IS 'Resets lesson deposit when admin creates new Paspartu program';
COMMENT ON FUNCTION test_lesson_deposit_triggers() IS 'Tests the lesson deposit trigger system';
