-- FIX ULTIMATE MEDIUM CONSTRAINT
-- This script updates the membership_package_durations constraint to include 'ultimate_medium_1year'

-- ========================================
-- PHASE 1: CHECK CURRENT CONSTRAINT
-- ========================================

SELECT 'PHASE 1: Checking current constraint...' as phase;

-- Check the current constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'membership_package_durations_duration_type_check';

-- ========================================
-- PHASE 2: DROP AND RECREATE CONSTRAINT
-- ========================================

SELECT 'PHASE 2: Updating constraint to include ultimate_medium_1year...' as phase;

-- Drop the existing constraint
ALTER TABLE membership_package_durations 
DROP CONSTRAINT IF EXISTS membership_package_durations_duration_type_check;

-- Recreate the constraint with the new duration type
ALTER TABLE membership_package_durations 
ADD CONSTRAINT membership_package_durations_duration_type_check 
CHECK (duration_type IN (
    'lesson', 
    'month', 
    '3 Μήνες', 
    'semester', 
    'year', 
    'pilates_6months', 
    'pilates_1year', 
    'ultimate_1year',
    'ultimate_medium_1year'  -- New duration type for Ultimate Medium
));

-- ========================================
-- PHASE 3: VERIFY CONSTRAINT UPDATE
-- ========================================

SELECT 'PHASE 3: Verifying constraint update...' as phase;

-- Check the updated constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'membership_package_durations_duration_type_check';

-- Test the constraint by trying to insert a test row (will be rolled back)
DO $$
BEGIN
    -- This should work now
    INSERT INTO membership_package_durations (
        id, package_id, duration_type, duration_days, price, classes_count, is_active
    ) VALUES (
        gen_random_uuid(), 
        (SELECT id FROM membership_packages WHERE name = 'Ultimate Medium' LIMIT 1),
        'ultimate_medium_1year', 
        365, 
        400.00, 
        156, 
        true
    );
    
    -- If we get here, the constraint works - rollback the test insert
    ROLLBACK;
    RAISE NOTICE 'Constraint test successful - ultimate_medium_1year is now allowed';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint test failed: %', SQLERRM;
END $$;

SELECT 'Ultimate Medium constraint fix completed successfully!' as result;
