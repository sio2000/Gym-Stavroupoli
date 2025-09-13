-- Simple Pilates Package Fix
-- This script uses a straightforward approach to add the Pilates package

-- Step 1: Check what package types currently exist
SELECT 'Current package types:' as info;
SELECT DISTINCT package_type, COUNT(*) as count
FROM membership_packages 
GROUP BY package_type
ORDER BY package_type;

-- Step 2: Check current constraint
SELECT 'Current constraint:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'membership_packages'::regclass 
AND conname LIKE '%package_type%';

-- Step 3: Drop the existing constraint
ALTER TABLE membership_packages 
DROP CONSTRAINT IF EXISTS membership_packages_package_type_check;

-- Step 4: Add a simple constraint that allows the known values plus 'pilates'
-- Based on the constraint we saw, it allows 'standard' and 'free_gym'
ALTER TABLE membership_packages 
ADD CONSTRAINT membership_packages_package_type_check 
CHECK (package_type IN ('standard', 'free_gym', 'pilates'));

-- Step 5: Verify the new constraint
SELECT 'New constraint:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'membership_packages'::regclass 
AND conname LIKE '%package_type%';

-- Step 6: Create the Pilates package
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
    'pilates',
    true,
    '{"Flexible Class Options", "Professional Instruction", "Multiple Duration Choices"}',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM membership_packages WHERE name = 'Pilates');

-- Step 7: Create the duration options
WITH pilates_package AS (
    SELECT id FROM membership_packages WHERE name = 'Pilates' LIMIT 1
)
INSERT INTO membership_package_durations (
    id,
    package_id,
    duration_type,
    duration_days,
    price,
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
    true,
    NOW(),
    NOW()
FROM pilates_package pp
WHERE EXISTS (SELECT 1 FROM pilates_package)
ON CONFLICT (package_id, duration_type) DO UPDATE SET 
    price = EXCLUDED.price,
    updated_at = NOW();

-- Step 8: Verify the results
SELECT 'Final verification:' as info;
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
SELECT 'Pilates duration options:' as info;
SELECT 
    mpd.id,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Pilates'
ORDER BY mpd.price;
