-- CREATE SAMPLE TRAINER SCHEDULES - Create test data for Mike and Jordan

-- Step 1: Get a sample user to create schedules for
-- (We'll use the first user from user_profiles)
DO $$
DECLARE
    sample_user_id UUID;
    sample_user_email TEXT;
BEGIN
    -- Get first user
    SELECT user_id, email INTO sample_user_id, sample_user_email
    FROM user_profiles 
    WHERE role = 'user' 
    LIMIT 1;
    
    -- If no user found, create a test user
    IF sample_user_id IS NULL THEN
        INSERT INTO user_profiles (user_id, email, first_name, last_name, role, phone)
        VALUES (
            gen_random_uuid(),
            'testuser@freegym.gr',
            'Test',
            'User',
            'user',
            '+300000000000'
        )
        RETURNING user_id, email INTO sample_user_id, sample_user_email;
    END IF;
    
    -- Create sample schedule for Mike
    INSERT INTO personal_training_schedules (
        id,
        user_id,
        month,
        year,
        schedule_data,
        status,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        sample_user_id,
        EXTRACT(MONTH FROM CURRENT_DATE),
        EXTRACT(YEAR FROM CURRENT_DATE),
        jsonb_build_object(
            'sessions', jsonb_build_array(
                jsonb_build_object(
                    'id', 'session-1',
                    'date', CURRENT_DATE::text,
                    'startTime', '09:00',
                    'endTime', '10:00',
                    'type', 'personal',
                    'trainer', 'Mike',
                    'room', 'Αίθουσα Mike',
                    'notes', 'Personal training session with Mike'
                ),
                jsonb_build_object(
                    'id', 'session-2',
                    'date', (CURRENT_DATE + INTERVAL '2 days')::text,
                    'startTime', '18:00',
                    'endTime', '19:00',
                    'type', 'kickboxing',
                    'trainer', 'Mike',
                    'room', 'Αίθουσα Mike',
                    'notes', 'Kickboxing session with Mike'
                )
            ),
            'notes', 'Sample program for Mike',
            'trainer', 'Mike',
            'specialInstructions', 'Focus on strength training'
        ),
        'accepted',
        sample_user_id,
        NOW(),
        NOW()
    );
    
    -- Create sample schedule for Jordan
    INSERT INTO personal_training_schedules (
        id,
        user_id,
        month,
        year,
        schedule_data,
        status,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        sample_user_id,
        EXTRACT(MONTH FROM CURRENT_DATE),
        EXTRACT(YEAR FROM CURRENT_DATE),
        jsonb_build_object(
            'sessions', jsonb_build_array(
                jsonb_build_object(
                    'id', 'session-3',
                    'date', (CURRENT_DATE + INTERVAL '1 day')::text,
                    'startTime', '14:00',
                    'endTime', '15:00',
                    'type', 'personal',
                    'trainer', 'Jordan',
                    'room', 'Αίθουσα Jordan',
                    'notes', 'Personal training session with Jordan'
                ),
                jsonb_build_object(
                    'id', 'session-4',
                    'date', (CURRENT_DATE + INTERVAL '3 days')::text,
                    'startTime', '19:00',
                    'endTime', '20:00',
                    'type', 'combo',
                    'trainer', 'Jordan',
                    'room', 'Αίθουσα Jordan',
                    'notes', 'Combo training session with Jordan'
                )
            ),
            'notes', 'Sample program for Jordan',
            'trainer', 'Jordan',
            'specialInstructions', 'Focus on cardio and flexibility'
        ),
        'accepted',
        sample_user_id,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Created sample schedules for user: % (%)', sample_user_email, sample_user_id;
END $$;

-- Step 2: Verify the created schedules
SELECT 'Created schedules verification:' as step,
       id,
       user_id,
       schedule_data->'sessions'->0->>'trainer' as first_session_trainer,
       schedule_data->'sessions'->0->>'date' as first_session_date,
       schedule_data->'sessions'->0->>'startTime' as first_session_start_time,
       schedule_data->'sessions'->0->>'endTime' as first_session_end_time,
       status
FROM personal_training_schedules 
WHERE schedule_data->'sessions'->0->>'trainer' IN ('Mike', 'Jordan')
ORDER BY created_at DESC;

-- Step 3: Count schedules by trainer
SELECT 'Final count by trainer:' as step,
       session->>'trainer' as trainer_name,
       COUNT(*) as count
FROM personal_training_schedules,
     jsonb_array_elements(schedule_data->'sessions') as session
WHERE session->>'trainer' IN ('Mike', 'Jordan')
GROUP BY session->>'trainer'
ORDER BY trainer_name;
