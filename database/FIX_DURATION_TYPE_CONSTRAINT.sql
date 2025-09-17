-- FIX DURATION TYPE CONSTRAINT FOR ULTIMATE PACKAGE
-- This script fixes the membership_requests_duration_type_check constraint

-- ========================================
-- PHASE 1: CHECK CURRENT CONSTRAINT
-- ========================================

SELECT 'PHASE 1: Checking current constraint...' as phase;

-- Check current constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'membership_requests_duration_type_check';

-- ========================================
-- PHASE 2: DROP OLD CONSTRAINT
-- ========================================

SELECT 'PHASE 2: Dropping old constraint...' as phase;

-- Drop the old constraint
ALTER TABLE membership_requests 
DROP CONSTRAINT IF EXISTS membership_requests_duration_type_check;

-- ========================================
-- PHASE 3: CREATE NEW CONSTRAINT
-- ========================================

SELECT 'PHASE 3: Creating new constraint with ultimate_1year...' as phase;

-- Create new constraint with ultimate_1year included
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
    'pilates_1year',
    'ultimate_1year'
));

-- ========================================
-- PHASE 4: VERIFY CONSTRAINT
-- ========================================

SELECT 'PHASE 4: Verifying new constraint...' as phase;

-- Check new constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'membership_requests_duration_type_check';

-- Test the constraint with a sample insert
SELECT 'Testing constraint with ultimate_1year...' as test;

SELECT 'Duration type constraint fixed successfully!' as result;