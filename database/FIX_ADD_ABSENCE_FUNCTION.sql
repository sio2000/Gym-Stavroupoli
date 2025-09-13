/* FIX ADD_ABSENCE FUNCTION - ΔΙΟΡΘΩΣΗ ADD_ABSENCE FUNCTION
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check existing add_absence function */
SELECT 'Existing add_absence functions:' as step;
SELECT 
    routine_name,
    routine_type,
    data_type,
    specific_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'add_absence'
ORDER BY specific_name;

/* 2. Drop all existing add_absence functions */
DROP FUNCTION IF EXISTS add_absence(UUID, TEXT, TEXT, DATE, TIME, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS add_absence(UUID, VARCHAR(50), VARCHAR(100), DATE, TIME, VARCHAR(20), TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS add_absence(UUID, TEXT, TEXT, TIMESTAMP, TEXT, TEXT, TEXT, TEXT) CASCADE;

/* 3. Create add_absence function with explicit type casting */
CREATE OR REPLACE FUNCTION add_absence(
    user_id_param UUID,
    trainer_name_param TEXT,
    session_id_param TEXT,
    session_date_param DATE,
    session_time_param TIME,
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
BEGIN
    -- Insert with explicit type casting
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
        user_id_param::UUID,
        trainer_name_param::TEXT,
        session_id_param::TEXT,
        session_date_param::DATE,
        session_time_param::TIME,
        absence_type_param::TEXT,
        COALESCE(reason_param, NULL)::TEXT,
        COALESCE(notes_param, NULL)::TEXT
    ) RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$;

/* 4. Create alternative add_absence function for different parameter types */
CREATE OR REPLACE FUNCTION add_absence(
    user_id_param UUID,
    trainer_name_param TEXT,
    session_id_param TEXT,
    session_date_param TIMESTAMP,
    session_time_param TEXT,
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
BEGIN
    -- Insert with explicit type casting from TIMESTAMP to DATE and TEXT to TIME
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
        user_id_param::UUID,
        trainer_name_param::TEXT,
        session_id_param::TEXT,
        session_date_param::DATE,
        session_time_param::TIME,
        absence_type_param::TEXT,
        COALESCE(reason_param, NULL)::TEXT,
        COALESCE(notes_param, NULL)::TEXT
    ) RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$;

/* 5. Verify functions are created */
SELECT 'Final add_absence functions:' as step;
SELECT 
    routine_name,
    routine_type,
    data_type,
    specific_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'add_absence'
ORDER BY specific_name;

/* 6. Test the functions with different parameter types */
SELECT 'Testing add_absence with DATE and TIME:' as test;
SELECT add_absence(
    (SELECT user_id FROM user_profiles WHERE role = 'user' LIMIT 1),
    'Jordan',
    'test-session-date-time',
    CURRENT_DATE + INTERVAL '1 day',
    '14:00:00'::TIME,
    'absent',
    'Test reason with DATE/TIME',
    'Test notes with DATE/TIME'
) as new_absence_id_1;

SELECT 'Testing add_absence with TIMESTAMP and TEXT:' as test;
SELECT add_absence(
    (SELECT user_id FROM user_profiles WHERE role = 'user' LIMIT 1),
    'Jordan',
    'test-session-timestamp-text',
    NOW() + INTERVAL '2 days',
    '16:00',
    'late',
    'Test reason with TIMESTAMP/TEXT',
    'Test notes with TIMESTAMP/TEXT'
) as new_absence_id_2;

/* 7. Verify records were inserted */
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

/* Success message */
SELECT 'add_absence function fixed with multiple signatures!' as message;
