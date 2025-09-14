-- UPDATE TRAINER NAMES - Update existing schedules to use proper trainer names
-- This script updates existing personal training schedules to use 'Mike' or 'Jordan' instead of free text

-- Step 1: Check current trainer names in schedules
SELECT 'BEFORE - Current trainer names:' as step, 
       schedule_data->'sessions'->0->>'trainer' as trainer_name,
       COUNT(*) as count
FROM personal_training_schedules 
WHERE schedule_data->'sessions' IS NOT NULL
GROUP BY schedule_data->'sessions'->0->>'trainer';

-- Step 2: Update trainer names to standardized values
-- Update sessions with common trainer name variations to 'Mike'
UPDATE personal_training_schedules 
SET schedule_data = jsonb_set(
  schedule_data, 
  '{sessions}', 
  (
    SELECT jsonb_agg(
      CASE 
        WHEN session->>'trainer' IN (
          'Μαρία Παπαδοπούλου', 
          'Μαρία', 
          'Maria', 
          'mike', 
          'Mike', 
          'MIKE',
          'Προπονητής',
          'Trainer',
          'trainer',
          '',
          'www',
          'kiki',
          'ss',
          'sss'
        ) THEN jsonb_set(session, '{trainer}', '"Mike"')
        ELSE session
      END
    )
    FROM jsonb_array_elements(schedule_data->'sessions') as session
  )
)
WHERE schedule_data->'sessions' IS NOT NULL;

-- Step 3: Update sessions with Jordan-related names to 'Jordan'
UPDATE personal_training_schedules 
SET schedule_data = jsonb_set(
  schedule_data, 
  '{sessions}', 
  (
    SELECT jsonb_agg(
      jsonb_set(
        session, 
        '{trainer}', 
        '"Jordan"'
      )
    )
    FROM jsonb_array_elements(schedule_data->'sessions') as session
    WHERE session->>'trainer' IN (
      'jordan', 
      'Jordan', 
      'JORDAN',
      'Γιάννης',
      'Γιάννης Κωνσταντίνου',
      'John',
      'Ιωάννης'
    )
  )
)
WHERE schedule_data->'sessions' IS NOT NULL
AND EXISTS (
  SELECT 1 
  FROM jsonb_array_elements(schedule_data->'sessions') as session
  WHERE session->>'trainer' IN (
    'jordan', 
    'Jordan', 
    'JORDAN',
    'Γιάννης',
    'Γιάννης Κωνσταντίνου',
    'John',
    'Ιωάννης'
  )
);

-- Step 4: Set any remaining empty or unknown trainer names to 'Mike' as default
UPDATE personal_training_schedules 
SET schedule_data = jsonb_set(
  schedule_data, 
  '{sessions}', 
  (
    SELECT jsonb_agg(
      CASE 
        WHEN session->>'trainer' IS NULL OR session->>'trainer' = '' 
        THEN jsonb_set(session, '{trainer}', '"Mike"')
        ELSE session
      END
    )
    FROM jsonb_array_elements(schedule_data->'sessions') as session
  )
)
WHERE schedule_data->'sessions' IS NOT NULL;

-- Step 5: Verify the updates
SELECT 'AFTER - Updated trainer names:' as step, 
       schedule_data->'sessions'->0->>'trainer' as trainer_name,
       COUNT(*) as count
FROM personal_training_schedules 
WHERE schedule_data->'sessions' IS NOT NULL
GROUP BY schedule_data->'sessions'->0->>'trainer';

-- Step 6: Show sample of updated schedules
SELECT 'Sample updated schedules:' as step,
       id,
       user_id,
       schedule_data->'sessions'->0->>'trainer' as first_session_trainer,
       schedule_data->'sessions'->0->>'date' as first_session_date,
       schedule_data->'sessions'->0->>'startTime' as first_session_start_time
FROM personal_training_schedules 
WHERE schedule_data->'sessions' IS NOT NULL
LIMIT 5;
