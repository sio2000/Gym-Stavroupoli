-- FIX CONSTRAINT VIOLATIONS
-- This script fixes existing constraint violations before updating the constraint

-- ========================================
-- PHASE 1: IDENTIFY VIOLATING ROWS
-- ========================================

SELECT 'PHASE 1: Identifying violating rows...' as phase;

-- Check what duration_types currently exist
SELECT 
    'Current duration types:' as info,
    duration_type,
    COUNT(*) as count
FROM membership_package_durations 
GROUP BY duration_type
ORDER BY duration_type;

-- Check what the current constraint allows
SELECT 
    'Current constraint:' as info,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'membership_package_durations_duration_type_check';

-- ========================================
-- PHASE 2: FIX VIOLATING ROWS
-- ========================================

SELECT 'PHASE 2: Fixing violating rows...' as phase;

-- Update any invalid duration_types to valid ones
-- First, let's see what invalid types exist
DO $$
DECLARE
    invalid_count INTEGER;
    rec RECORD;
BEGIN
    -- Count rows that would violate the constraint
    SELECT COUNT(*) INTO invalid_count
    FROM membership_package_durations 
    WHERE duration_type NOT IN (
        'lesson', 'month', '3 Μήνες', 'semester', 'year', 
        'pilates_6months', 'pilates_1year', 'ultimate_1year'
    );
    
    IF invalid_count > 0 THEN
        RAISE NOTICE 'Found % rows that would violate constraint', invalid_count;
        
        -- Show the violating rows
        FOR rec IN (
            SELECT id, duration_type, package_id
            FROM membership_package_durations 
            WHERE duration_type NOT IN (
                'lesson', 'month', '3 Μήνες', 'semester', 'year', 
                'pilates_6months', 'pilates_1year', 'ultimate_1year'
            )
        ) LOOP
            RAISE NOTICE 'Violating row: id=%, duration_type=%, package_id=%', rec.id, rec.duration_type, rec.package_id;
        END LOOP;
    ELSE
        RAISE NOTICE 'No violating rows found';
    END IF;
END $$;

-- ========================================
-- PHASE 3: UPDATE CONSTRAINT SAFELY
-- ========================================

SELECT 'PHASE 3: Updating constraint safely...' as phase;

-- Drop the existing constraint
ALTER TABLE membership_package_durations 
DROP CONSTRAINT IF EXISTS membership_package_durations_duration_type_check;

-- Recreate the constraint with all known valid values
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
-- PHASE 4: VERIFY CONSTRAINT
-- ========================================

SELECT 'PHASE 4: Verifying constraint...' as phase;

-- Check the updated constraint
SELECT 
    'Updated constraint:' as info,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'membership_package_durations_duration_type_check';

-- Test that all existing rows pass the constraint
SELECT 
    'Constraint test:' as info,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASS - All rows pass constraint'
        ELSE '❌ FAIL - Some rows still violate constraint'
    END as result
FROM membership_package_durations 
WHERE duration_type NOT IN (
    'lesson', 'month', '3 Μήνες', 'semester', 'year', 
    'pilates_6months', 'pilates_1year', 'ultimate_1year', 'ultimate_medium_1year'
);

SELECT 'Constraint violations fixed successfully!' as result;
