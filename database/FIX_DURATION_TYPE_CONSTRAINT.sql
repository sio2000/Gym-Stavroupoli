-- FIX DURATION TYPE CONSTRAINT
-- The constraint doesn't allow pilates duration types

-- Step 1: Check current constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'membership_requests_duration_type_check';

-- Step 2: Drop the existing constraint
ALTER TABLE membership_requests 
DROP CONSTRAINT IF EXISTS membership_requests_duration_type_check;

-- Step 3: Create new constraint that includes pilates duration types
ALTER TABLE membership_requests 
ADD CONSTRAINT membership_requests_duration_type_check 
CHECK (duration_type IN (
    'year', 
    'semester', 
    'month', 
    'lesson', 
    'pilates_trial', 
    'pilates_1month', 
    'pilates_2months', 
    'pilates_3months', 
    'pilates_6months', 
    'pilates_1year'
));

-- Step 4: Verify the constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'membership_requests_duration_type_check';