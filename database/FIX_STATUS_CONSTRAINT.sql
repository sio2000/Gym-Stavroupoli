-- Fix the status constraint to allow 'declined' status
-- This will fix the error when declining a personal training schedule

-- 1. First, let's see what the current constraint looks like
SELECT 
    'Current Status Constraint' as test_name,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'personal_training_schedules'::regclass
AND conname LIKE '%status%';

-- 2. Drop the existing constraint
ALTER TABLE personal_training_schedules 
DROP CONSTRAINT IF EXISTS personal_training_schedules_status_check;

-- 3. Create a new constraint that allows 'declined' status
ALTER TABLE personal_training_schedules 
ADD CONSTRAINT personal_training_schedules_status_check 
CHECK (status IN ('pending', 'accepted', 'declined'));

-- 4. Verify the new constraint
SELECT 
    'New Status Constraint' as test_name,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'personal_training_schedules'::regclass
AND conname LIKE '%status%';

-- 5. Test updating a schedule to 'declined' status
-- (This will be a dry run - we won't actually update anything)
SELECT 
    'Test Update Query' as test_name,
    'UPDATE personal_training_schedules SET status = ''declined'' WHERE id = ''test-id''' as test_query;
