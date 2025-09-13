-- Fix Pilates Membership Requests
-- Add missing classes_count column and ensure Pilates package exists

-- Step 1: Add classes_count column to membership_requests if it doesn't exist
DO $$ 
BEGIN
    -- Check if classes_count column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'membership_requests' 
        AND column_name = 'classes_count'
    ) THEN
        -- Add the classes_count column
        ALTER TABLE membership_requests 
        ADD COLUMN classes_count INTEGER DEFAULT NULL;
        
        RAISE NOTICE 'classes_count column added to membership_requests table';
    ELSE
        RAISE NOTICE 'classes_count column already exists in membership_requests table';
    END IF;
END $$;

-- Step 2: Ensure Pilates package exists
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

-- Step 3: Create Pilates duration options
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

-- Step 4: Verify the results
SELECT 
    'membership_requests columns' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'membership_requests' 
AND column_name IN ('id', 'user_id', 'package_id', 'duration_type', 'requested_price', 'classes_count', 'status')
ORDER BY column_name;

SELECT 
    'Pilates package' as info,
    mp.id,
    mp.name,
    mp.package_type,
    mp.is_active,
    COUNT(mpd.id) as duration_count
FROM membership_packages mp
LEFT JOIN membership_package_durations mpd ON mp.id = mpd.package_id
WHERE mp.name = 'Pilates'
GROUP BY mp.id, mp.name, mp.package_type, mp.is_active;

SELECT 
    'Pilates durations' as info,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.classes_count,
    mpd.is_active
FROM membership_packages mp
JOIN membership_package_durations mpd ON mp.id = mpd.package_id
WHERE mp.name = 'Pilates'
ORDER BY mpd.price;
