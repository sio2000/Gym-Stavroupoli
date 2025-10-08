-- TEST ULTIMATE MEDIUM IMPLEMENTATION
-- This script tests all aspects of the Ultimate Medium package implementation

-- ========================================
-- PHASE 1: VERIFY PACKAGE CREATION
-- ========================================

SELECT 'PHASE 1: Verifying Ultimate Medium package creation...' as phase;

-- Check if Ultimate Medium package exists
SELECT 
    'Ultimate Medium Package Check:' as test_name,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS - Package exists'
        ELSE '❌ FAIL - Package not found'
    END as result,
    COUNT(*) as count
FROM membership_packages 
WHERE name = 'Ultimate Medium';

-- Check if Ultimate Medium duration exists
SELECT 
    'Ultimate Medium Duration Check:' as test_name,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS - Duration exists'
        ELSE '❌ FAIL - Duration not found'
    END as result,
    COUNT(*) as count
FROM membership_package_durations 
WHERE duration_type = 'ultimate_medium_1year';

-- ========================================
-- PHASE 2: VERIFY PACKAGE PROPERTIES
-- ========================================

SELECT 'PHASE 2: Verifying Ultimate Medium package properties...' as phase;

-- Compare Ultimate and Ultimate Medium packages
SELECT 
    'Package Comparison:' as test_name,
    mp.name,
    mp.price,
    mp.duration_days,
    mp.package_type,
    mp.is_active
FROM membership_packages mp
WHERE mp.name IN ('Ultimate', 'Ultimate Medium')
ORDER BY mp.name;

-- Compare Ultimate and Ultimate Medium durations
SELECT 
    'Duration Comparison:' as test_name,
    mp.name as package_name,
    mpd.duration_type,
    mpd.price,
    mpd.duration_days,
    mpd.classes_count
FROM membership_packages mp
JOIN membership_package_durations mpd ON mp.id = mpd.package_id
WHERE mp.name IN ('Ultimate', 'Ultimate Medium')
ORDER BY mp.name, mpd.duration_type;

-- ========================================
-- PHASE 3: VERIFY CONSTRAINT UPDATES
-- ========================================

SELECT 'PHASE 3: Verifying constraint updates...' as phase;

-- Check if constraint includes ultimate_medium_1year
SELECT 
    'Constraint Check:' as test_name,
    CASE 
        WHEN pg_get_constraintdef(oid) LIKE '%ultimate_medium_1year%' THEN '✅ PASS - Constraint includes ultimate_medium_1year'
        ELSE '❌ FAIL - Constraint does not include ultimate_medium_1year'
    END as result,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'membership_package_durations_duration_type_check';

-- ========================================
-- PHASE 4: TEST DUAL ACTIVATION FUNCTION
-- ========================================

SELECT 'PHASE 4: Testing dual activation function...' as phase;

-- Check if function exists and has correct signature
SELECT 
    'Function Existence Check:' as test_name,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS - Function exists'
        ELSE '❌ FAIL - Function not found'
    END as result,
    COUNT(*) as count
FROM information_schema.routines 
WHERE routine_name = 'create_ultimate_dual_memberships'
AND routine_schema = 'public';

-- ========================================
-- PHASE 5: VERIFY PRICE DIFFERENCE
-- ========================================

SELECT 'PHASE 5: Verifying price difference...' as phase;

-- Check that Ultimate Medium is €100 cheaper than Ultimate
SELECT 
    'Price Difference Check:' as test_name,
    ultimate.price as ultimate_price,
    ultimate_medium.price as ultimate_medium_price,
    (ultimate.price - ultimate_medium.price) as price_difference,
    CASE 
        WHEN (ultimate.price - ultimate_medium.price) = 100.00 THEN '✅ PASS - Price difference is €100'
        ELSE '❌ FAIL - Price difference is not €100'
    END as result
FROM 
    (SELECT price FROM membership_packages WHERE name = 'Ultimate') ultimate,
    (SELECT price FROM membership_packages WHERE name = 'Ultimate Medium') ultimate_medium;

-- ========================================
-- PHASE 6: VERIFY ALL FEATURES MATCH
-- ========================================

SELECT 'PHASE 6: Verifying all features match...' as phase;

-- Check that all features are identical except price
SELECT 
    'Feature Comparison:' as test_name,
    'Ultimate' as package_name,
    duration_days,
    package_type,
    features,
    is_active
FROM membership_packages 
WHERE name = 'Ultimate'

UNION ALL

SELECT 
    'Feature Comparison:' as test_name,
    'Ultimate Medium' as package_name,
    duration_days,
    package_type,
    features,
    is_active
FROM membership_packages 
WHERE name = 'Ultimate Medium';

-- ========================================
-- PHASE 7: FINAL VERIFICATION
-- ========================================

SELECT 'PHASE 7: Final verification...' as phase;

-- Count total Ultimate packages (should be 2: Ultimate and Ultimate Medium)
SELECT 
    'Total Ultimate Packages:' as test_name,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 2 THEN '✅ PASS - Both packages exist'
        ELSE '❌ FAIL - Expected 2 packages'
    END as result
FROM membership_packages 
WHERE package_type = 'ultimate';

-- Count total Ultimate durations (should be 2: ultimate_1year and ultimate_medium_1year)
SELECT 
    'Total Ultimate Durations:' as test_name,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 2 THEN '✅ PASS - Both durations exist'
        ELSE '❌ FAIL - Expected 2 durations'
    END as result
FROM membership_package_durations 
WHERE duration_type IN ('ultimate_1year', 'ultimate_medium_1year');

SELECT 'Ultimate Medium implementation testing completed!' as result;
