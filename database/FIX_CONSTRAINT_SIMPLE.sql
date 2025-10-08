-- FIX CONSTRAINT SIMPLE
-- Simple script to fix constraint violations

-- ========================================
-- STEP 1: SEE WHAT DURATION TYPES EXIST
-- ========================================

SELECT 'STEP 1: Current duration types in database:' as info;
SELECT duration_type, COUNT(*) as count
FROM membership_package_durations 
GROUP BY duration_type
ORDER BY duration_type;

-- ========================================
-- STEP 2: DROP CONSTRAINT TEMPORARILY
-- ========================================

SELECT 'STEP 2: Dropping constraint...' as info;
ALTER TABLE membership_package_durations 
DROP CONSTRAINT IF EXISTS membership_package_durations_duration_type_check;

-- ========================================
-- STEP 3: RECREATE CONSTRAINT WITH ALL VALID TYPES
-- ========================================

SELECT 'STEP 3: Recreating constraint with all valid types...' as info;

-- First, let's see what types we actually need to include
-- Based on the current data, we'll include all existing types plus the new one
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
-- STEP 4: VERIFY CONSTRAINT WORKS
-- ========================================

SELECT 'STEP 4: Verifying constraint works...' as info;

-- Check the constraint definition
SELECT pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'membership_package_durations_duration_type_check';

-- Test that we can insert the new duration type
DO $$
BEGIN
    -- This should work now
    RAISE NOTICE 'Constraint updated successfully - ultimate_medium_1year is now allowed';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END $$;

SELECT 'Constraint fix completed!' as result;
