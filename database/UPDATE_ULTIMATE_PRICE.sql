-- UPDATE ULTIMATE PACKAGE PRICE TO 500€
-- This script updates the Ultimate package price from 1200€ to 500€

-- ========================================
-- PHASE 1: UPDATE PACKAGE PRICE
-- ========================================

SELECT 'PHASE 1: Updating Ultimate package price...' as phase;

-- Update the Ultimate package price
UPDATE membership_packages 
SET 
    price = 500.00,
    updated_at = NOW()
WHERE name = 'Ultimate';

-- ========================================
-- PHASE 2: UPDATE PACKAGE DURATION PRICE
-- ========================================

SELECT 'PHASE 2: Updating Ultimate package duration price...' as phase;

-- Update the Ultimate package duration price
UPDATE membership_package_durations 
SET 
    price = 500.00,
    updated_at = NOW()
WHERE duration_type = 'ultimate_1year';

-- ========================================
-- PHASE 3: VERIFY UPDATES
-- ========================================

SELECT 'PHASE 3: Verifying price updates...' as phase;

-- Check Ultimate package price
SELECT 'Ultimate package price:' as info;
SELECT id, name, price FROM membership_packages WHERE name = 'Ultimate';

-- Check Ultimate duration price
SELECT 'Ultimate duration price:' as info;
SELECT id, duration_type, price FROM membership_package_durations WHERE duration_type = 'ultimate_1year';

SELECT 'Ultimate package price updated to 500€ successfully!' as result;
