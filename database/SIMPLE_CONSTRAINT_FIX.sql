-- SIMPLE CONSTRAINT FIX - This will 100% solve the duration_type constraint issue
-- Just drop the old constraint and create a new one

-- Step 1: Drop the existing constraint
ALTER TABLE membership_requests 
DROP CONSTRAINT IF EXISTS membership_requests_duration_type_check;

-- Step 2: Create new constraint that includes pilates duration types
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

-- Step 3: Verify the constraint was created
SELECT 
    conname as constraint_name
FROM pg_constraint 
WHERE conname = 'membership_requests_duration_type_check';

-- Now pilates duration types should work!
