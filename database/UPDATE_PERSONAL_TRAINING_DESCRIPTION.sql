-- UPDATE PERSONAL TRAINING PACKAGE DESCRIPTION TO GREEK
-- This script updates the Personal Training package description to Greek

-- ========================================
-- PHASE 1: UPDATE PERSONAL TRAINING PACKAGE DESCRIPTION
-- ========================================

SELECT 'PHASE 1: Updating Personal Training package description to Greek...' as phase;

-- Update the Personal Training package description
UPDATE membership_packages 
SET 
    description = 'Συνδρομή Γυμναστηρίου Personal Training',
    updated_at = NOW()
WHERE name = 'Personal Training';

-- ========================================
-- PHASE 2: VERIFY UPDATE
-- ========================================

SELECT 'PHASE 2: Verifying Personal Training description update...' as phase;

-- Check Personal Training package description
SELECT 'Personal Training package description after update:' as info;
SELECT id, name, description, updated_at FROM membership_packages WHERE name = 'Personal Training';

-- Check if description contains Greek text
SELECT 
  CASE 
    WHEN description LIKE '%Συνδρομή%' AND description LIKE '%Personal Training%'
    THEN '✅ Personal Training description is in Greek and complete!'
    ELSE '❌ Personal Training description is not in Greek or incomplete'
  END as description_status
FROM membership_packages 
WHERE name = 'Personal Training';

SELECT 'Personal Training package description updated to Greek successfully!' as result;
