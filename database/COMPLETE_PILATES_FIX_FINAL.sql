-- Complete Pilates Package Fix - Final Version
-- This script fixes all constraints and creates the Pilates package

-- Step 1: Check current package types
SELECT 'Current package types:' as info;
SELECT DISTINCT package_type, COUNT(*) as count
FROM membership_packages 
GROUP BY package_type
ORDER BY package_type;

-- Step 2: Check current duration types
SELECT 'Current duration types:' as info;
SELECT DISTINCT duration_type FROM membership_package_durations ORDER BY duration_type;

-- Step 3: Fix package_type constraint
SELECT 'Fixing package_type constraint...' as info;
ALTER TABLE membership_packages 
DROP CONSTRAINT IF EXISTS membership_packages_package_type_check;

ALTER TABLE membership_packages 
ADD CONSTRAINT membership_packages_package_type_check 
CHECK (package_type IN ('standard', 'free_gym', 'pilates'));

-- Step 4: Fix duration_type constraint
SELECT 'Fixing duration_type constraint...' as info;
ALTER TABLE membership_package_durations 
DROP CONSTRAINT IF EXISTS membership_package_durations_duration_type_check;

ALTER TABLE membership_package_durations 
ADD CONSTRAINT membership_package_durations_duration_type_check 
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
    'pilates_1year'
));

-- Step 5: Create the Pilates package
SELECT 'Creating Pilates package...' as info;
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

-- Step 6: Create the duration options
SELECT 'Creating Pilates duration options...' as info;
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

-- Step 7: Verify the results
SELECT 'Final verification - Pilates package:' as info;
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
    mpd.classes_count,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Pilates'
ORDER BY mpd.price;

-- Verify constraints
SELECT 'Updated constraints:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid IN ('membership_packages'::regclass, 'membership_package_durations'::regclass)
AND conname LIKE '%check'
ORDER BY conrelid, conname;
