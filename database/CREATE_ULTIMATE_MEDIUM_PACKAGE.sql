-- CREATE ULTIMATE MEDIUM PACKAGE
-- This script creates the Ultimate Medium package as a byte-for-byte duplicate of Ultimate
-- with the only difference being the price (€400 instead of €500)

-- ========================================
-- PHASE 0: FIX CONSTRAINT FOR ULTIMATE MEDIUM
-- ========================================

SELECT 'PHASE 0: Fixing constraint for Ultimate Medium...' as phase;

-- Drop the existing constraint
ALTER TABLE membership_package_durations 
DROP CONSTRAINT IF EXISTS membership_package_durations_duration_type_check;

-- Recreate the constraint with the new duration type
ALTER TABLE membership_package_durations 
ADD CONSTRAINT membership_package_durations_duration_type_check 
CHECK (duration_type IN (
    'lesson', 
    'month', 
    '3 Μήνες', 
    'semester', 
    'year', 
    'pilates_6months', 
    'pilates_1year', 
    'ultimate_1year',
    'ultimate_medium_1year'  -- New duration type for Ultimate Medium
));

-- ========================================
-- PHASE 1: CREATE ULTIMATE MEDIUM PACKAGE
-- ========================================

SELECT 'PHASE 1: Creating Ultimate Medium Package...' as phase;

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
-- PHASE 2: CREATE ULTIMATE MEDIUM PACKAGE DURATION
-- ========================================

SELECT 'PHASE 2: Creating Ultimate Medium package duration...' as phase;

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
WHERE EXISTS (SELECT 1 FROM ultimate_medium_package);

-- ========================================
-- PHASE 3: VERIFY CREATION
-- ========================================

SELECT 'PHASE 3: Verifying Ultimate Medium creation...' as phase;

-- Check Ultimate Medium package
SELECT 'Ultimate Medium package:' as info;
SELECT id, name, package_type, price FROM membership_packages WHERE name = 'Ultimate Medium';

-- Check Ultimate Medium duration
SELECT 'Ultimate Medium duration:' as info;
SELECT id, duration_type, price FROM membership_package_durations WHERE duration_type = 'ultimate_medium_1year';

-- Compare with original Ultimate package
SELECT 'Comparison with original Ultimate:' as info;
SELECT 
    mp.name,
    mp.price as package_price,
    mpd.duration_type,
    mpd.price as duration_price
FROM membership_packages mp
JOIN membership_package_durations mpd ON mp.id = mpd.package_id
WHERE mp.name IN ('Ultimate', 'Ultimate Medium')
ORDER BY mp.name;

SELECT 'Ultimate Medium package created successfully!' as result;
