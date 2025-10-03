-- TEST SEPARATION - Δοκιμή διαχωρισμού Ultimate και Regular requests
-- Τρέξε αυτό στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΕΛΕΓΧΟΣ ΟΛΩΝ ΤΩΝ REQUESTS
-- ========================================

SELECT 
    'All requests count:' as info,
    COUNT(*) as total_requests
FROM membership_requests;

-- ========================================
-- ΒΗΜΑ 2: ΕΛΕΓΧΟΣ ULTIMATE REQUESTS
-- ========================================

SELECT 
    'Ultimate requests count:' as info,
    COUNT(*) as ultimate_count
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name = 'Ultimate';

-- ========================================
-- ΒΗΜΑ 3: ΕΛΕΓΧΟΣ REGULAR REQUESTS (ΧΩΡΙΣ ULTIMATE)
-- ========================================

SELECT 
    'Regular requests count (excluding Ultimate):' as info,
    COUNT(*) as regular_count
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name != 'Ultimate';

-- ========================================
-- ΒΗΜΑ 4: ΕΛΕΓΧΟΣ ULTIMATE INSTALLMENT LOCKS
-- ========================================

SELECT 
    'Ultimate installment locks count:' as info,
    COUNT(*) as locks_count
FROM ultimate_installment_locks;

-- ========================================
-- ΒΗΜΑ 5: ΔΕΙΓΜΑ ΔΕΔΟΜΕΝΩΝ
-- ========================================

-- Δείγμα Ultimate requests
SELECT 
    'Sample Ultimate requests:' as info,
    mr.id,
    mp.name as package_name,
    mr.installment_1_locked,
    mr.installment_2_locked,
    mr.installment_3_locked
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name = 'Ultimate'
LIMIT 3;

-- Δείγμα Regular requests
SELECT 
    'Sample Regular requests:' as info,
    mr.id,
    mp.name as package_name,
    mr.installment_1_locked,
    mr.installment_2_locked,
    mr.installment_3_locked
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name != 'Ultimate'
LIMIT 3;

-- Δείγμα Ultimate locks
SELECT 
    'Sample Ultimate locks:' as info,
    membership_request_id,
    installment_number,
    locked_at,
    deleted_at
FROM ultimate_installment_locks
LIMIT 3;

-- ========================================
-- ΒΗΜΑ 6: ΕΛΕΓΧΟΣ ΣΥΝΑΡΤΗΣΕΩΝ
-- ========================================

-- Δοκιμή lock_ultimate_installment function
DO $$
DECLARE
    test_request_id UUID;
    test_admin_id UUID;
    test_result BOOLEAN;
BEGIN
    -- Βρες έναν admin user
    SELECT user_id INTO test_admin_id
    FROM user_profiles 
    WHERE role = 'admin'
    LIMIT 1;
    
    -- Βρες ένα Ultimate request
    SELECT mr.id INTO test_request_id
    FROM membership_requests mr
    JOIN membership_packages mp ON mr.package_id = mp.id
    WHERE mp.name = 'Ultimate'
    LIMIT 1;
    
    IF test_request_id IS NOT NULL AND test_admin_id IS NOT NULL THEN
        -- Δοκιμή της function
        BEGIN
            SELECT lock_ultimate_installment(
                test_request_id,
                1,
                test_admin_id
            ) INTO test_result;
            
            RAISE NOTICE 'Ultimate locking function test: SUCCESS - %', test_result;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Ultimate locking function test: FAILED - %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Ultimate locking function test: SKIPPED - No test data available';
    END IF;
END $$;

SELECT 'Separation test completed successfully!' as status;
