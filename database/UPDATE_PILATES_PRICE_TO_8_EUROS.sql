-- Update Pilates Package Price to 8.00 Euros
-- This script updates the Pilates package price from 6.00€ to 8.00€

-- =============================================
-- 1. UPDATE PILATES PACKAGE BASE PRICE
-- =============================================
UPDATE membership_packages 
SET price = 8.00, updated_at = NOW()
WHERE name = 'Pilates';

-- =============================================
-- 2. UPDATE PILATES TRIAL DURATION PRICE
-- =============================================
UPDATE membership_package_durations 
SET price = 8.00, updated_at = NOW()
WHERE package_id IN (
    SELECT id FROM membership_packages WHERE name = 'Pilates'
) 
AND duration_type = 'pilates_trial';

-- =============================================
-- 3. VERIFY UPDATES
-- =============================================
-- Check the updated package price
SELECT 
    id,
    name,
    price as base_price,
    package_type,
    updated_at
FROM membership_packages 
WHERE name = 'Pilates';

-- Check the updated trial duration price
SELECT 
    mpd.id,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.classes_count,
    mpd.is_active,
    mp.name as package_name
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Pilates' 
AND mpd.duration_type = 'pilates_trial';

-- Show all Pilates duration options with updated prices
SELECT 
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.classes_count,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Pilates'
ORDER BY mpd.price;
