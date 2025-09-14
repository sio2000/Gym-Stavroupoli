-- Test Pilates Package Creation
-- This is a simplified version to test the SQL syntax

-- Test 1: Create Pilates package with UUID
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
) VALUES (
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
) ON CONFLICT (name) DO UPDATE SET 
    price = 6.00,
    updated_at = NOW();

-- Test 2: Verify the package was created
SELECT id, name, price, package_type FROM membership_packages WHERE name = 'Pilates';

-- Test 3: Create one duration option
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
    mp.id,
    'pilates_trial',
    1,
    6.00,
    1,
    true,
    NOW(),
    NOW()
FROM membership_packages mp
WHERE mp.name = 'Pilates'
ON CONFLICT (package_id, duration_type) DO UPDATE SET 
    price = EXCLUDED.price,
    classes_count = EXCLUDED.classes_count,
    updated_at = NOW();

-- Test 4: Verify the duration was created
SELECT 
    mpd.id,
    mpd.duration_type,
    mpd.price,
    mpd.classes_count,
    mp.name as package_name
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Pilates';
