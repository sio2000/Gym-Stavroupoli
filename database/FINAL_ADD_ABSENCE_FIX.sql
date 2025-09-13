/* FINAL ADD_ABSENCE FIX - ΤΕΛΙΚΗ ΔΙΟΡΘΩΣΗ ADD_ABSENCE
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Drop existing add_absence function */
DROP FUNCTION IF EXISTS add_absence(UUID, TEXT, TEXT, DATE, TIME, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS add_absence(UUID, VARCHAR(50), VARCHAR(100), DATE, TIME, VARCHAR(20), TEXT, TEXT) CASCADE;

/* 2. Create add_absence function that accepts TEXT parameters and converts them */
CREATE OR REPLACE FUNCTION add_absence(
    user_id_param UUID,
    trainer_name_param TEXT,
    session_id_param TEXT,
    session_date_param TEXT,  -- Changed to TEXT to accept string from frontend
    session_time_param TEXT,  -- Changed to TEXT to accept string from frontend
    absence_type_param TEXT,
    reason_param TEXT DEFAULT NULL,
    notes_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id UUID;
    parsed_date DATE;
    parsed_time TIME;
BEGIN
    -- Convert TEXT parameters to proper types
    parsed_date := session_date_param::DATE;
    parsed_time := session_time_param::TIME;
    
    -- Insert with converted types
    INSERT INTO absence_records (
        user_id,
        trainer_name,
        session_id,
        session_date,
        session_time,
        absence_type,
        reason,
        notes
    ) VALUES (
        user_id_param,
        trainer_name_param,
        session_id_param,
        parsed_date,
        parsed_time,
        absence_type_param,
        reason_param,
        notes_param
    ) RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$;

/* 3. Test the function with string parameters (like frontend sends) */
SELECT 'Testing add_absence with string parameters:' as test;
SELECT add_absence(
    (SELECT user_id FROM user_profiles WHERE role = 'user' LIMIT 1),
    'Jordan',
    'test-session-string-params',
    '2025-01-15',  -- String date
    '16:30',       -- String time
    'absent',
    'Test with string params',
    'Test notes string'
) as new_absence_id;

/* 4. Test with different date/time formats */
SELECT 'Testing add_absence with different formats:' as test;
SELECT add_absence(
    (SELECT user_id FROM user_profiles WHERE role = 'user' LIMIT 1),
    'Jordan',
    'test-session-different-format',
    '2025-01-16',
    '14:00:00',
    'late',
    'Test different format',
    'Test notes different'
) as new_absence_id;

/* 5. Verify records were inserted */
SELECT 'Verifying inserted records:' as step;
SELECT 
    id,
    user_id,
    trainer_name,
    session_id,
    session_date,
    session_time,
    absence_type,
    reason,
    notes
FROM absence_records 
WHERE session_id LIKE 'test-session-%'
ORDER BY created_at DESC;

/* 6. Test error handling with invalid date */
SELECT 'Testing error handling with invalid date:' as test;
DO $$
BEGIN
    BEGIN
        PERFORM add_absence(
            (SELECT user_id FROM user_profiles WHERE role = 'user' LIMIT 1),
            'Jordan',
            'test-invalid-date',
            'invalid-date',
            '16:30',
            'absent',
            'This should fail',
            'Test error handling'
        );
        RAISE NOTICE 'ERROR: This should have failed!';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'SUCCESS: Error handling works - %', SQLERRM;
    END;
END $$;

/* Success message */
SELECT 'add_absence function fixed to accept string parameters!' as message;
