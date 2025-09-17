-- UPDATE ULTIMATE PACKAGE DESCRIPTION FOR UI DISPLAY
-- This script updates the Ultimate package description for UI display

-- ========================================
-- PHASE 1: UPDATE ULTIMATE PACKAGE DESCRIPTION
-- ========================================

SELECT 'PHASE 1: Updating Ultimate package description for UI...' as phase;

-- Update the Ultimate package description
UPDATE membership_packages 
SET 
    description = '1 έτος Pilates με 3 μαθήματα την εβδομάδα + 1 έτος ελεύθερο γυμναστήριο',
    updated_at = NOW()
WHERE name = 'Ultimate';

-- ========================================
-- PHASE 2: VERIFY UPDATE
-- ========================================

SELECT 'PHASE 2: Verifying Ultimate description update...' as phase;

-- Check Ultimate package description
SELECT 'Ultimate package description after update:' as info;
SELECT id, name, description, updated_at FROM membership_packages WHERE name = 'Ultimate';

-- Check if description contains Greek text
SELECT 
  CASE 
    WHEN description LIKE '%έτος%' AND description LIKE '%Pilates%' AND description LIKE '%ελεύθερο γυμναστήριο%'
    THEN '✅ Ultimate description is in Greek and complete!'
    ELSE '❌ Ultimate description is not in Greek or incomplete'
  END as description_status
FROM membership_packages 
WHERE name = 'Ultimate';

SELECT 'Ultimate package description updated to Greek successfully!' as result;
