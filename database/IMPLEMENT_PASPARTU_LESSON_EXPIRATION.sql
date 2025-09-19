-- IMPLEMENT PASPARTU LESSON EXPIRATION (1 MONTH)
-- This script implements automatic lesson reset for paspartu users after 1 month
-- Execute in Supabase SQL Editor

-- ========================================
-- PHASE 1: ADD EXPIRATION TRACKING TO LESSON_DEPOSITS
-- ========================================

SELECT 'PHASE 1: Adding expiration tracking to lesson_deposits...' as phase;

-- Add expires_at column to track when lessons expire
ALTER TABLE lesson_deposits 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add last_reset_at to track when lessons were last reset
ALTER TABLE lesson_deposits 
ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMPTZ;

-- Backfill expires_at for existing records (30 days from created_at)
UPDATE lesson_deposits 
SET expires_at = created_at + INTERVAL '30 days'
WHERE expires_at IS NULL;

-- Backfill last_reset_at with created_at for existing records
UPDATE lesson_deposits 
SET last_reset_at = created_at
WHERE last_reset_at IS NULL;

-- ========================================
-- PHASE 2: CREATE LESSON EXPIRATION FUNCTION
-- ========================================

SELECT 'PHASE 2: Creating lesson expiration function...' as phase;

-- Function to expire and reset paspartu user lessons
CREATE OR REPLACE FUNCTION expire_paspartu_lessons()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER := 0;
    deposit_record RECORD;
BEGIN
    -- Find all lesson deposits that have expired (more than 30 days old)
    FOR deposit_record IN 
        SELECT id, user_id, total_lessons, used_lessons, remaining_lessons, expires_at
        FROM lesson_deposits 
        WHERE expires_at < NOW()
        AND remaining_lessons > 0 -- Only reset if there are remaining lessons
    LOOP
        -- Reset the lessons to zero
        UPDATE lesson_deposits 
        SET 
            total_lessons = 0,
            used_lessons = 0,
            expires_at = NULL,
            last_reset_at = NOW(),
            updated_at = NOW()
        WHERE id = deposit_record.id;
        
        expired_count := expired_count + 1;
        
        RAISE NOTICE 'Expired % remaining lessons for user % (deposit ID: %)', 
            deposit_record.remaining_lessons, deposit_record.user_id, deposit_record.id;
    END LOOP;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PHASE 3: CREATE FUNCTION TO SET LESSON EXPIRATION
-- ========================================

SELECT 'PHASE 3: Creating function to set lesson expiration...' as phase;

-- Function to set lesson expiration when lessons are credited
CREATE OR REPLACE FUNCTION set_lesson_expiration(
    p_user_id UUID,
    p_total_lessons INTEGER,
    p_created_by UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Insert or update lesson deposit with expiration
    INSERT INTO lesson_deposits (
        user_id, 
        total_lessons, 
        used_lessons, 
        expires_at,
        last_reset_at,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_total_lessons,
        0, -- Start with 0 used lessons
        NOW() + INTERVAL '30 days', -- Expire in 30 days
        NOW(),
        p_created_by,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_lessons = p_total_lessons,
        used_lessons = 0, -- Reset used lessons
        expires_at = NOW() + INTERVAL '30 days',
        last_reset_at = NOW(),
        created_by = p_created_by,
        updated_at = NOW();
        
    RAISE NOTICE 'Set % lessons for user % with 30-day expiration', p_total_lessons, p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PHASE 4: UPDATE EXISTING FUNCTIONS TO USE EXPIRATION
-- ========================================

SELECT 'PHASE 4: Updating existing functions to use expiration...' as phase;

-- Update the reset_lesson_deposit_for_new_program function to use expiration
CREATE OR REPLACE FUNCTION reset_lesson_deposit_for_new_program(
    p_user_id UUID,
    p_total_lessons INTEGER DEFAULT 5,
    p_created_by UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Use the new set_lesson_expiration function
    PERFORM set_lesson_expiration(p_user_id, p_total_lessons, p_created_by);
    
    RAISE NOTICE 'Reset lesson deposit for user % to % lessons with 30-day expiration', 
        p_user_id, p_total_lessons;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PHASE 5: CREATE SCHEDULED EXPIRATION CHECK
-- ========================================

SELECT 'PHASE 5: Creating scheduled expiration check...' as phase;

-- Function to be called periodically to check and expire lessons
CREATE OR REPLACE FUNCTION check_and_expire_paspartu_lessons()
RETURNS TEXT AS $$
DECLARE
    expired_count INTEGER;
    result_text TEXT;
BEGIN
    -- Call the expire function
    SELECT expire_paspartu_lessons() INTO expired_count;
    
    -- Return result summary
    result_text := 'Checked paspartu lesson expiration. Expired ' || expired_count || ' user lesson deposits.';
    
    RAISE NOTICE '%', result_text;
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PHASE 6: CREATE VIEW FOR EXPIRATION MONITORING
-- ========================================

SELECT 'PHASE 6: Creating view for expiration monitoring...' as phase;

-- View to monitor lesson expiration status
CREATE OR REPLACE VIEW paspartu_lesson_expiration_status AS
SELECT 
    ld.user_id,
    up.first_name,
    up.last_name,
    up.email,
    ld.total_lessons,
    ld.used_lessons,
    ld.remaining_lessons,
    ld.expires_at,
    ld.last_reset_at,
    CASE 
        WHEN ld.expires_at IS NULL THEN 'No Expiration Set'
        WHEN ld.expires_at < NOW() THEN 'EXPIRED'
        WHEN ld.expires_at < NOW() + INTERVAL '7 days' THEN 'EXPIRING SOON'
        ELSE 'ACTIVE'
    END as expiration_status,
    CASE 
        WHEN ld.expires_at IS NOT NULL THEN 
            EXTRACT(DAYS FROM (ld.expires_at - NOW()))::INTEGER
        ELSE NULL
    END as days_until_expiration
FROM lesson_deposits ld
JOIN user_profiles up ON ld.user_id = up.user_id
ORDER BY ld.expires_at ASC NULLS LAST;

-- ========================================
-- PHASE 7: TEST THE EXPIRATION SYSTEM
-- ========================================

SELECT 'PHASE 7: Testing the expiration system...' as phase;

-- Test the expire function (should not expire anything yet since we just set expiration dates)
DO $$
DECLARE
    test_result INTEGER;
BEGIN
    SELECT expire_paspartu_lessons() INTO test_result;
    RAISE NOTICE 'Test expiration result: % expired deposits', test_result;
END $$;

-- Show current expiration status
SELECT 'Current paspartu lesson expiration status:' as info;
SELECT * FROM paspartu_lesson_expiration_status LIMIT 10;

-- ========================================
-- PHASE 8: VERIFICATION
-- ========================================

SELECT 'PHASE 8: Verification of expiration system...' as phase;

-- Verify the new columns were added
SELECT 'Lesson deposits table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lesson_deposits' 
AND column_name IN ('expires_at', 'last_reset_at')
ORDER BY column_name;

-- Verify functions were created
SELECT 'Created functions:' as info;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN (
    'expire_paspartu_lessons',
    'set_lesson_expiration', 
    'check_and_expire_paspartu_lessons'
)
ORDER BY routine_name;

SELECT 'PASPARTU LESSON EXPIRATION SYSTEM IMPLEMENTED!' as completion_status;
