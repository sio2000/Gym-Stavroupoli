-- Fix missing trainer_name column in personal_training_schedules table
-- This is the root cause of Jordan's schedules not displaying

-- 1. Add the missing trainer_name column
ALTER TABLE personal_training_schedules 
ADD COLUMN IF NOT EXISTS trainer_name VARCHAR(100);

-- 2. Create an index for performance
CREATE INDEX IF NOT EXISTS idx_personal_training_schedules_trainer_name 
ON personal_training_schedules(trainer_name);

-- 3. Update existing records to extract trainer_name from schedule_data
-- This will extract the trainer name from the first session in the schedule_data
UPDATE personal_training_schedules 
SET trainer_name = (
    SELECT session.value->>'trainer' 
    FROM jsonb_array_elements(schedule_data->'sessions') as session 
    LIMIT 1
)
WHERE trainer_name IS NULL 
AND schedule_data->'sessions' IS NOT NULL 
AND jsonb_array_length(schedule_data->'sessions') > 0;

-- 4. Verify the fix by checking the data
SELECT 
    'Verification - All Schedules' as test_name,
    id,
    user_id,
    trainer_name,
    month,
    year,
    status,
    created_at
FROM personal_training_schedules 
ORDER BY created_at DESC;

-- 5. Check specific trainers
SELECT 
    'Verification - Mike Schedules' as test_name,
    id,
    user_id,
    trainer_name,
    status,
    schedule_data->'sessions' as sessions
FROM personal_training_schedules 
WHERE trainer_name = 'Mike'
ORDER BY created_at DESC;

-- 6. Check Jordan schedules
SELECT 
    'Verification - Jordan Schedules' as test_name,
    id,
    user_id,
    trainer_name,
    status,
    schedule_data->'sessions' as sessions
FROM personal_training_schedules 
WHERE trainer_name = 'Jordan'
ORDER BY created_at DESC;

-- 7. Test the frontend filtering logic
SELECT 
    'Frontend Filter Test - Mike' as test_name,
    id,
    trainer_name,
    CASE 
        WHEN trainer_name = 'Mike' THEN 'MATCHES_COLUMN'
        ELSE 'NO_MATCH'
    END as match_type,
    schedule_data->'sessions' as sessions
FROM personal_training_schedules 
WHERE trainer_name = 'Mike';

-- 8. Test Jordan filtering
SELECT 
    'Frontend Filter Test - Jordan' as test_name,
    id,
    trainer_name,
    CASE 
        WHEN trainer_name = 'Jordan' THEN 'MATCHES_COLUMN'
        ELSE 'NO_MATCH'
    END as match_type,
    schedule_data->'sessions' as sessions
FROM personal_training_schedules 
WHERE trainer_name = 'Jordan';

-- Success message
SELECT 'Missing trainer_name column fixed!' as message;
