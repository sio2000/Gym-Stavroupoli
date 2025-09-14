-- FIX TRAINER SCHEDULES - Complete fix for trainer schedules
-- This script will update existing schedules and create sample data

-- Step 1: Check current state
SELECT 'BEFORE - Current trainer names:' as step, 
       session->>'trainer' as trainer_name,
       COUNT(*) as count
FROM personal_training_schedules,
     jsonb_array_elements(schedule_data->'sessions') as session
GROUP BY session->>'trainer'
ORDER BY count DESC;

-- Step 2: Update all existing schedules to use Mike or Jordan
-- Convert all existing trainer names to 'Mike' (we can change some to Jordan later)
UPDATE personal_training_schedules 
SET schedule_data = jsonb_set(
  schedule_data, 
  '{sessions}', 
  (
    SELECT jsonb_agg(
      jsonb_set(
        session, 
        '{trainer}', 
        '"Mike"'
      )
    )
    FROM jsonb_array_elements(schedule_data->'sessions') as session
  )
)
WHERE schedule_data->'sessions' IS NOT NULL;

-- Step 3: Create sample schedules for both trainers
DO $$
DECLARE
    sample_user_id UUID;
    sample_user_email TEXT;
BEGIN
    -- Get first user or create one
    SELECT user_id, email INTO sample_user_id, sample_user_email
    FROM user_profiles 
    WHERE role = 'user' 
    LIMIT 1;
    
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
    
    -- Create Mike's schedule
    INSERT INTO personal_training_schedules (
        id, user_id, month, year, schedule_data, status, created_by, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        sample_user_id,
        EXTRACT(MONTH FROM CURRENT_DATE),
        EXTRACT(YEAR FROM CURRENT_DATE),
        jsonb_build_object(
            'sessions', jsonb_build_array(
                jsonb_build_object(
                    'id', 'mike-session-1',
                    'date', CURRENT_DATE::text,
                    'startTime', '09:00',
                    'endTime', '10:00',
                    'type', 'personal',
                    'trainer', 'Mike',
                    'room', 'Αίθουσα Mike',
                    'notes', 'Morning personal training with Mike'
                ),
                jsonb_build_object(
                    'id', 'mike-session-2',
                    'date', (CURRENT_DATE + INTERVAL '2 days')::text,
                    'startTime', '18:00',
                    'endTime', '19:00',
                    'type', 'kickboxing',
                    'trainer', 'Mike',
                    'room', 'Αίθουσα Mike',
                    'notes', 'Evening kickboxing with Mike'
                )
            ),
            'notes', 'Mike training program',
            'trainer', 'Mike',
            'specialInstructions', 'Focus on strength and technique'
        ),
        'accepted',
        sample_user_id,
        NOW(),
        NOW()
    );
    
    -- Create Jordan's schedule
    INSERT INTO personal_training_schedules (
        id, user_id, month, year, schedule_data, status, created_by, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        sample_user_id,
        EXTRACT(MONTH FROM CURRENT_DATE),
        EXTRACT(YEAR FROM CURRENT_DATE),
        jsonb_build_object(
            'sessions', jsonb_build_array(
                jsonb_build_object(
                    'id', 'jordan-session-1',
                    'date', (CURRENT_DATE + INTERVAL '1 day')::text,
                    'startTime', '14:00',
                    'endTime', '15:00',
                    'type', 'personal',
                    'trainer', 'Jordan',
                    'room', 'Αίθουσα Jordan',
                    'notes', 'Afternoon personal training with Jordan'
                ),
                jsonb_build_object(
                    'id', 'jordan-session-2',
                    'date', (CURRENT_DATE + INTERVAL '3 days')::text,
                    'startTime', '19:00',
                    'endTime', '20:00',
                    'type', 'combo',
                    'trainer', 'Jordan',
                    'room', 'Αίθουσα Jordan',
                    'notes', 'Evening combo training with Jordan'
                )
            ),
            'notes', 'Jordan training program',
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

-- Step 4: Verify the results
SELECT 'AFTER - Updated trainer names:' as step, 
       session->>'trainer' as trainer_name,
       COUNT(*) as count
FROM personal_training_schedules,
     jsonb_array_elements(schedule_data->'sessions') as session
GROUP BY session->>'trainer'
ORDER BY count DESC;

-- Step 5: Show sample schedules
SELECT 'Sample schedules:' as step,
       id,
       user_id,
       schedule_data->'sessions'->0->>'trainer' as first_session_trainer,
       schedule_data->'sessions'->0->>'date' as first_session_date,
       schedule_data->'sessions'->0->>'startTime' as first_session_start_time,
       schedule_data->'sessions'->0->>'endTime' as first_session_end_time,
       status
FROM personal_training_schedules 
WHERE schedule_data->'sessions'->0->>'trainer' IN ('Mike', 'Jordan')
ORDER BY created_at DESC
LIMIT 5;
