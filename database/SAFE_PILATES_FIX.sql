-- Safe Pilates Package Fix
-- This script checks existing data and safely updates the constraint

-- Step 1: Check what package types currently exist
SELECT 'Current package types:' as info;
SELECT DISTINCT package_type, COUNT(*) as count
FROM membership_packages 
GROUP BY package_type
ORDER BY package_type;

-- Step 2: Check if package_type column exists
SELECT 'Column info:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'membership_packages' 
AND table_schema = 'public'
AND column_name = 'package_type';

-- Step 3: Check current constraint
SELECT 'Current constraint:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'membership_packages'::regclass 
AND conname LIKE '%package_type%';

-- Step 4: If package_type column doesn't exist, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'membership_packages' 
        AND column_name = 'package_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE membership_packages ADD COLUMN package_type TEXT DEFAULT 'standard';
        RAISE NOTICE 'Added package_type column with default value "standard"';
    ELSE
        RAISE NOTICE 'package_type column already exists';
    END IF;
END $$;

-- Step 5: Update existing rows to have valid package_type values
UPDATE membership_packages 
SET package_type = 'standard'
WHERE package_type IS NULL OR package_type = '';

-- Step 6: Drop the existing constraint if it exists
ALTER TABLE membership_packages 
DROP CONSTRAINT IF EXISTS membership_packages_package_type_check;

-- Step 7: Add the new constraint that includes all existing values plus 'pilates'
DO $$
DECLARE
    existing_types TEXT[];
    constraint_def TEXT;
BEGIN
    -- Get all existing package types
    SELECT ARRAY_AGG(DISTINCT package_type) INTO existing_types
    FROM membership_packages;
    
    -- Add 'pilates' to the list using array_append
    existing_types := array_append(existing_types, 'pilates');
    
    -- Build the constraint definition
    constraint_def := 'CHECK (package_type = ANY (ARRAY[' || 
        array_to_string(array_agg('''' || unnest || ''''::text), ', ') || ']))'
    FROM unnest(existing_types);
    
    -- Add the constraint
    EXECUTE 'ALTER TABLE membership_packages ADD CONSTRAINT membership_packages_package_type_check ' || constraint_def;
    
    RAISE NOTICE 'Added constraint: %', constraint_def;
END $$;

-- Step 8: Verify the constraint
SELECT 'New constraint:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'membership_packages'::regclass 
AND conname LIKE '%package_type%';

-- Step 9: Now create the Pilates package
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

-- Step 10: Create the duration options
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

-- Step 11: Verify the results
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
    mpd.classes_count,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Pilates'
ORDER BY mpd.price;
