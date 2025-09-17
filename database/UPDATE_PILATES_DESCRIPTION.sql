-- UPDATE PILATES PACKAGE DESCRIPTION TO GREEK
-- This script updates the Pilates package description to Greek

-- ========================================
-- PHASE 1: UPDATE PILATES PACKAGE DESCRIPTION
-- ========================================

SELECT 'PHASE 1: Updating Pilates package description to Greek...' as phase;

-- Update the Pilates package description
UPDATE membership_packages 
SET 
    description = 'Μαθήματα Pilates με Ευέλικτες Επιλογές',
    updated_at = NOW()
WHERE name = 'Pilates';

-- ========================================
-- PHASE 2: VERIFY UPDATE
-- ========================================

SELECT 'PHASE 2: Verifying Pilates description update...' as phase;

-- Check Pilates package description
SELECT 'Pilates package description after update:' as info;
SELECT id, name, description, updated_at FROM membership_packages WHERE name = 'Pilates';

-- Check if description contains Greek text
SELECT 
  CASE 
    WHEN description LIKE '%Μαθήματα%' AND description LIKE '%Pilates%' AND description LIKE '%Ευέλικτες%'
    THEN '✅ Pilates description is in Greek and complete!'
    ELSE '❌ Pilates description is not in Greek or incomplete'
  END as description_status
FROM membership_packages 
WHERE name = 'Pilates';

SELECT 'Pilates package description updated to Greek successfully!' as result;
