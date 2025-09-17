-- FIX ULTIMATE PACKAGE CONSTRAINT
-- This script fixes the package_type constraint to include 'ultimate'

-- ========================================
-- PHASE 1: CHECK CURRENT CONSTRAINT
-- ========================================

SELECT 'PHASE 1: Checking current constraint...' as phase;

-- Check current package_type constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'membership_packages'::regclass 
AND conname LIKE '%package_type%';

-- ========================================
-- PHASE 2: UPDATE PACKAGE TYPE CONSTRAINT
-- ========================================

SELECT 'PHASE 2: Updating package_type constraint...' as phase;

-- Drop the existing constraint
ALTER TABLE membership_packages 
DROP CONSTRAINT IF EXISTS membership_packages_package_type_check;

-- Add the new constraint that includes 'ultimate'
ALTER TABLE membership_packages 
ADD CONSTRAINT membership_packages_package_type_check 
CHECK (package_type IN ('standard', 'free_gym', 'pilates', 'ultimate'));

-- ========================================
-- PHASE 3: UPDATE DURATION TYPE CONSTRAINT
-- ========================================

SELECT 'PHASE 3: Updating duration_type constraint...' as phase;

-- Drop the existing duration_type constraint
ALTER TABLE membership_package_durations 
DROP CONSTRAINT IF EXISTS membership_package_durations_duration_type_check;

-- Add the new constraint that includes 'ultimate_1year'
ALTER TABLE membership_package_durations 
ADD CONSTRAINT membership_package_durations_duration_type_check 
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
    'pilates_1year',
    'ultimate_1year'
));

-- ========================================
-- PHASE 4: VERIFY CONSTRAINTS
-- ========================================

SELECT 'PHASE 4: Verifying constraints...' as phase;

-- Check updated package_type constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'membership_packages'::regclass 
AND conname LIKE '%package_type%';

-- Check updated duration_type constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'membership_package_durations'::regclass 
AND conname LIKE '%duration_type%';

SELECT 'Constraints updated successfully! Now you can run the Ultimate package creation script.' as result;
