-- UPDATE ULTIMATE PACKAGE DESCRIPTION IN GREEK
-- This script updates the Ultimate package description to Greek

-- ========================================
-- PHASE 1: UPDATE PACKAGE DESCRIPTION
-- ========================================

SELECT 'PHASE 1: Updating Ultimate package description...' as phase;

-- Update the Ultimate package description
UPDATE membership_packages 
SET 
    description = '1 έτος Pilates με 3 μαθήματα την εβδομάδα + 1 έτος ελεύθερο γυμναστήριο',
    updated_at = NOW()
WHERE name = 'Ultimate';

-- ========================================
-- PHASE 2: VERIFY UPDATE
-- ========================================

SELECT 'PHASE 2: Verifying description update...' as phase;

-- Check Ultimate package description
SELECT 'Ultimate package description:' as info;
SELECT id, name, description FROM membership_packages WHERE name = 'Ultimate';

SELECT 'Ultimate package description updated successfully!' as result;
