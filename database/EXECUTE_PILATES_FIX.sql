-- Execute Pilates Package Fix
-- Run this script to fix the Pilates package database integration

-- First, let's check if the Pilates package exists
SELECT id, name, price FROM membership_packages WHERE name = 'Pilates';

-- If it exists but has null price, update it
UPDATE membership_packages 
SET price = 6.00, updated_at = NOW()
WHERE name = 'Pilates' AND price IS NULL;

-- If it doesn't exist, create it with proper UUID
INSERT INTO membership_packages (
    id, 
    name, 
    description, 
    duration_days, 
    price, 
    package_type, 
    is_active, 
    features, 
    created_at, 
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'Pilates',
    'Pilates Classes with Flexible Options',
    365,
    6.00,
    'free_gym',
    true,
    '{"Flexible Class Options", "Professional Instruction", "Multiple Duration Choices"}',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM membership_packages WHERE name = 'Pilates');

-- Now create the duration options
-- First, get the Pilates package ID
WITH pilates_package AS (
    SELECT id FROM membership_packages WHERE name = 'Pilates' LIMIT 1
)
INSERT INTO membership_package_durations (
    id,
    package_id,
    duration_type,
    duration_days,
    price,
    classes_count,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    pp.id,
    'pilates_trial',
    1,
    6.00,
    1,
    true,
    NOW(),
    NOW()
FROM pilates_package pp
WHERE EXISTS (SELECT 1 FROM pilates_package)
UNION ALL
SELECT 
    gen_random_uuid(),
    pp.id,
    'pilates_1month',
    30,
    44.00,
    4,
    true,
    NOW(),
    NOW()
FROM pilates_package pp
WHERE EXISTS (SELECT 1 FROM pilates_package)
UNION ALL
SELECT 
    gen_random_uuid(),
    pp.id,
    'pilates_2months',
    60,
    80.00,
    8,
    true,
    NOW(),
    NOW()
FROM pilates_package pp
WHERE EXISTS (SELECT 1 FROM pilates_package)
UNION ALL
SELECT 
    gen_random_uuid(),
    pp.id,
    'pilates_3months',
    90,
    144.00,
    16,
    true,
    NOW(),
    NOW()
FROM pilates_package pp
WHERE EXISTS (SELECT 1 FROM pilates_package)
UNION ALL
SELECT 
    gen_random_uuid(),
    pp.id,
    'pilates_6months',
    180,
    190.00,
    25,
    true,
    NOW(),
    NOW()
FROM pilates_package pp
WHERE EXISTS (SELECT 1 FROM pilates_package)
UNION ALL
SELECT 
    gen_random_uuid(),
    pp.id,
    'pilates_1year',
    365,
    350.00,
    50,
    true,
    NOW(),
    NOW()
FROM pilates_package pp
WHERE EXISTS (SELECT 1 FROM pilates_package)
ON CONFLICT (package_id, duration_type) DO UPDATE SET 
    price = EXCLUDED.price,
    classes_count = EXCLUDED.classes_count,
    updated_at = NOW();

-- Verify the results
SELECT 
    mp.id,
    mp.name,
    mp.price as base_price,
    mp.package_type,
    COUNT(mpd.id) as duration_options
FROM membership_packages mp
LEFT JOIN membership_package_durations mpd ON mp.id = mpd.package_id
WHERE mp.name = 'Pilates'
GROUP BY mp.id, mp.name, mp.price, mp.package_type;

-- Show all Pilates duration options
SELECT 
    mpd.id,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.classes_count,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Pilates'
ORDER BY mpd.price;
