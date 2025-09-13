/* SIMPLE ADD_ABSENCE FIX - ΑΠΛΗ ΔΙΟΡΘΩΣΗ ADD_ABSENCE
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Drop existing add_absence function */
DROP FUNCTION IF EXISTS add_absence(UUID, TEXT, TEXT, DATE, TIME, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS add_absence(UUID, VARCHAR(50), VARCHAR(100), DATE, TIME, VARCHAR(20), TEXT, TEXT) CASCADE;

/* 2. Create simple add_absence function with explicit casting */
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
        session_date_param,
        session_time_param,
        absence_type_param,
        reason_param,
        notes_param
    ) RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$;

/* 3. Test the function with explicit casting */
SELECT 'Testing add_absence with explicit casting:' as test;
SELECT add_absence(
    (SELECT user_id FROM user_profiles WHERE role = 'user' LIMIT 1)::UUID,
    'Jordan'::TEXT,
    'test-session-explicit'::TEXT,
    (CURRENT_DATE + INTERVAL '1 day')::DATE,
    '15:00:00'::TIME,
    'absent'::TEXT,
    'Test explicit casting'::TEXT,
    'Test notes explicit'::TEXT
) as new_absence_id;

/* 4. Verify the record was inserted */
SELECT 'Verifying inserted record:' as step;
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
WHERE session_id = 'test-session-explicit';

/* Success message */
SELECT 'add_absence function fixed with explicit casting!' as message;
