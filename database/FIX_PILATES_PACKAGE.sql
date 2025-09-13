-- Fix Pilates Package Database Integration
-- This script creates the Pilates package in the database and sets up proper duration options

-- =============================================
-- 1. INSERT PILATES PACKAGE
-- =============================================
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
    'pilates-package',
    'Pilates',
    'Pilates Classes with Flexible Options',
    365,
    6.00, -- Base price for 1 class
    'pilates',
    true,
    '{"Flexible Class Options", "Professional Instruction", "Multiple Duration Choices"}',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET 
    price = 6.00,
    updated_at = NOW();

-- =============================================
-- 2. INSERT PILATES PACKAGE DURATIONS
-- =============================================
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
) VALUES 
    -- 1 class (Trial)
    (
        'pilates-trial',
        'pilates-package',
        'pilates_trial',
        1,
        6.00,
        1,
        true,
        NOW(),
        NOW()
    ),
    -- 4 classes (1 month)
    (
        'pilates-1month',
        'pilates-package',
        'pilates_1month',
        30,
        44.00,
        4,
        true,
        NOW(),
        NOW()
    ),
    -- 8 classes (2 months)
    (
        'pilates-2months',
        'pilates-package',
        'pilates_2months',
        60,
        80.00,
        8,
        true,
        NOW(),
        NOW()
    ),
    -- 16 classes (3 months)
    (
        'pilates-3months',
        'pilates-package',
        'pilates_3months',
        90,
        144.00,
        16,
        true,
        NOW(),
        NOW()
    ),
    -- 25 classes (6 months)
    (
        'pilates-6months',
        'pilates-package',
        'pilates_6months',
        180,
        190.00,
        25,
        true,
        NOW(),
        NOW()
    ),
    -- 50 classes (1 year)
    (
        'pilates-1year',
        'pilates-package',
        'pilates_1year',
        365,
        350.00,
        50,
        true,
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET 
    price = EXCLUDED.price,
    classes_count = EXCLUDED.classes_count,
    updated_at = NOW();

-- =============================================
-- 3. VERIFY INSERTION
-- =============================================
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
