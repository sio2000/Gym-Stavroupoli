-- CREATE ULTIMATE PACKAGE ONLY
-- This script creates the Ultimate package after constraints are fixed

-- ========================================
-- PHASE 1: CREATE ULTIMATE PACKAGE
-- ========================================

SELECT 'PHASE 1: Creating Ultimate Package...' as phase;

-- Create Ultimate Package (3x/week Pilates + Free Gym for 1 year)
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
    'Ultimate',
    '3x/week Pilates + Free Gym for 1 year with Installments Option',
    365,
    1200.00, -- Total price for installments
    'ultimate',
    true,
    '{"3x/week Pilates", "Free Gym Access", "Installments Available", "1 Year Duration"}',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM membership_packages WHERE name = 'Ultimate');

-- ========================================
-- PHASE 2: CREATE ULTIMATE PACKAGE DURATION
-- ========================================

SELECT 'PHASE 2: Creating Ultimate package duration...' as phase;

-- Create Ultimate package duration (1 year with installments)
WITH ultimate_package AS (
    SELECT id FROM membership_packages WHERE name = 'Ultimate' LIMIT 1
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
    up.id,
    'ultimate_1year',
    365,
    1200.00,
    156, -- 3 classes per week * 52 weeks
    true,
    NOW(),
    NOW()
FROM ultimate_package up
WHERE EXISTS (SELECT 1 FROM ultimate_package);

-- ========================================
-- PHASE 3: VERIFY CREATION
-- ========================================

SELECT 'PHASE 3: Verifying creation...' as phase;

-- Check Ultimate package
SELECT 'Ultimate package:' as info;
SELECT id, name, package_type, price FROM membership_packages WHERE name = 'Ultimate';

-- Check Ultimate duration
SELECT 'Ultimate duration:' as info;
SELECT id, duration_type, price, classes_count FROM membership_package_durations WHERE duration_type = 'ultimate_1year';

SELECT 'Ultimate Package created successfully!' as result;
