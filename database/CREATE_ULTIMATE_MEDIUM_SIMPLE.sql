-- CREATE ULTIMATE MEDIUM SIMPLE
-- Simple script to create Ultimate Medium package

-- ========================================
-- STEP 1: CREATE ULTIMATE MEDIUM PACKAGE
-- ========================================

SELECT 'STEP 1: Creating Ultimate Medium package...' as phase;

-- Create Ultimate Medium Package (3x/week Pilates + Free Gym for 1 year)
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
    'Ultimate Medium',
    '3x/week Pilates + Free Gym for 1 year with Installments Option',
    365,
    400.00, -- Price is €400 instead of €500
    'ultimate',
    true,
    '{"3x/week Pilates", "Free Gym Access", "Installments Available", "1 Year Duration"}',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM membership_packages WHERE name = 'Ultimate Medium');

-- ========================================
-- STEP 2: CREATE ULTIMATE MEDIUM DURATION
-- ========================================

SELECT 'STEP 2: Creating Ultimate Medium duration...' as phase;

-- Create Ultimate Medium package duration (1 year with installments)
WITH ultimate_medium_package AS (
    SELECT id FROM membership_packages WHERE name = 'Ultimate Medium' LIMIT 1
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
    ump.id,
    'ultimate_medium_1year', -- Unique duration type for Ultimate Medium
    365,
    400.00, -- Price is €400 instead of €500
    156, -- 3 classes per week * 52 weeks (same as Ultimate)
    true,
    NOW(),
    NOW()
FROM ultimate_medium_package ump
WHERE EXISTS (SELECT 1 FROM ultimate_medium_package)
AND NOT EXISTS (SELECT 1 FROM membership_package_durations WHERE duration_type = 'ultimate_medium_1year');

-- ========================================
-- STEP 3: VERIFY CREATION
-- ========================================

SELECT 'STEP 3: Verifying creation...' as phase;

-- Check Ultimate Medium package
SELECT 
    'Ultimate Medium Package:' as info,
    id, name, package_type, price, duration_days
FROM membership_packages 
WHERE name = 'Ultimate Medium';

-- Check Ultimate Medium duration
SELECT 
    'Ultimate Medium Duration:' as info,
    id, duration_type, price, duration_days, classes_count
FROM membership_package_durations 
WHERE duration_type = 'ultimate_medium_1year';

-- Compare with Ultimate
SELECT 
    'Package Comparison:' as info,
    mp.name,
    mp.price,
    mp.duration_days,
    mp.package_type
FROM membership_packages mp
WHERE mp.name IN ('Ultimate', 'Ultimate Medium')
ORDER BY mp.name;

SELECT 'Ultimate Medium package created successfully!' as result;
