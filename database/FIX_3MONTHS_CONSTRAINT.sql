-- FIX 3MONTHS CONSTRAINT
-- This script adds '3months' to the duration_type constraint
-- Run this BEFORE running ADD_FREE_GYM_3MONTHS_PACKAGE.sql

-- ========================================
-- PHASE 1: CHECK CURRENT CONSTRAINT
-- ========================================

SELECT 'PHASE 1: Checking current duration_type constraint...' as phase;

-- Check current constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'membership_package_durations'::regclass 
AND conname LIKE '%duration_type%';

-- ========================================
-- PHASE 2: UPDATE DURATION TYPE CONSTRAINT
-- ========================================

SELECT 'PHASE 2: Updating duration_type constraint to include 3months...' as phase;

-- Drop the existing constraint
ALTER TABLE membership_package_durations 
DROP CONSTRAINT IF EXISTS membership_package_durations_duration_type_check;

-- Add the new constraint that includes '3months'
ALTER TABLE membership_package_durations 
ADD CONSTRAINT membership_package_durations_duration_type_check 
CHECK (duration_type IN (
    'year', 
    'semester', 
    '3 Μήνες',  -- NEW: 3-month option for Free Gym (Greek)
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
-- PHASE 3: UPDATE MEMBERSHIP REQUESTS CONSTRAINT
-- ========================================

SELECT 'PHASE 3: Updating membership_requests duration_type constraint...' as phase;

-- Drop the existing constraint
ALTER TABLE membership_requests 
DROP CONSTRAINT IF EXISTS membership_requests_duration_type_check;

-- Add the new constraint that includes '3months'
ALTER TABLE membership_requests 
ADD CONSTRAINT membership_requests_duration_type_check 
CHECK (duration_type IN (
    'year', 
    'semester', 
    '3 Μήνες',  -- NEW: 3-month option for Free Gym (Greek)
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
-- PHASE 4: UPDATE MEMBERSHIPS CONSTRAINT
-- ========================================

SELECT 'PHASE 4: Updating memberships duration_type constraint...' as phase;

-- Drop the existing constraint
ALTER TABLE memberships 
DROP CONSTRAINT IF EXISTS memberships_duration_type_check;

-- Add the new constraint that includes '3months'
ALTER TABLE memberships 
ADD CONSTRAINT memberships_duration_type_check 
CHECK (duration_type IN (
    'year', 
    'semester', 
    '3 Μήνες',  -- NEW: 3-month option for Free Gym (Greek)
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
-- PHASE 5: VERIFY CONSTRAINTS
-- ========================================

SELECT 'PHASE 5: Verifying updated constraints...' as phase;

-- Check membership_package_durations constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'membership_package_durations'::regclass 
AND conname LIKE '%duration_type%';

-- Check membership_requests constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'membership_requests'::regclass 
AND conname LIKE '%duration_type%';

-- Check memberships constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'memberships'::regclass 
AND conname LIKE '%duration_type%';

-- ========================================
-- PHASE 6: SUCCESS MESSAGE
-- ========================================

SELECT 'SUCCESS: 3months duration_type added to all constraints!' as result;
SELECT 'You can now run ADD_FREE_GYM_3MONTHS_PACKAGE.sql' as next_step;
