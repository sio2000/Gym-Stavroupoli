-- FIX CONSTRAINT COMPLETE
-- This script fixes the constraint by including ALL existing duration types

-- ========================================
-- STEP 1: SHOW ALL EXISTING DURATION TYPES
-- ========================================

SELECT 'STEP 1: All existing duration types:' as info;
SELECT DISTINCT duration_type 
FROM membership_package_durations 
ORDER BY duration_type;

-- ========================================
-- STEP 2: DROP EXISTING CONSTRAINT
-- ========================================

SELECT 'STEP 2: Dropping existing constraint...' as info;
ALTER TABLE membership_package_durations 
DROP CONSTRAINT IF EXISTS membership_package_durations_duration_type_check;

-- ========================================
-- STEP 3: RECREATE CONSTRAINT WITH ALL TYPES
-- ========================================

SELECT 'STEP 3: Creating new constraint with all duration types...' as info;

-- Create constraint with all existing types plus the new ultimate_medium_1year
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
    'ultimate_medium_1year'
));

-- ========================================
-- STEP 4: VERIFY
-- ========================================

SELECT 'STEP 4: Verifying constraint...' as info;

-- Show the new constraint
SELECT 
    'New constraint:' as info,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'membership_package_durations_duration_type_check';

-- Test that all existing rows pass
SELECT 
    'Constraint test:' as info,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS - All existing rows pass the constraint'
        ELSE '❌ FAIL - Some rows still violate the constraint'
    END as result,
    COUNT(*) as violating_rows
FROM membership_package_durations 
WHERE duration_type NOT IN (
    'lesson', 'month', '3 Μήνες', 'semester', 'year', 
    'pilates_6months', 'pilates_1year', 'ultimate_1year', 'ultimate_medium_1year'
);

SELECT 'Constraint fix completed!' as result;
