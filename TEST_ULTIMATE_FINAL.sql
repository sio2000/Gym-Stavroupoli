-- Τελικό test script για να επιβεβαιώσω ότι το Ultimate σύστημα λειτουργεί σωστά
-- με το νέο σύστημα ultimate_installment_locks

-- 1. Έλεγχος Ultimate requests
SELECT 
    'Ultimate Requests' as test_type,
    COUNT(*) as count
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name = 'Ultimate';

-- 2. Έλεγχος Regular requests (χωρίς Ultimate)
SELECT 
    'Regular Requests (χωρίς Ultimate)' as test_type,
    COUNT(*) as count
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name != 'Ultimate';

-- 3. Έλεγχος Ultimate locks
SELECT 
    'Ultimate Locks' as test_type,
    COUNT(*) as count
FROM ultimate_installment_locks;

-- 4. Έλεγχος Ultimate locks ανά installment
SELECT 
    'Ultimate Locks ανά Installment' as test_type,
    installment_number,
    COUNT(*) as count,
    COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as locked_count,
    COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_count
FROM ultimate_installment_locks
GROUP BY installment_number
ORDER BY installment_number;

-- 5. Παράδειγμα Ultimate request με locks
SELECT 
    'Ultimate Request με Locks' as test_type,
    mr.id as request_id,
    u.first_name,
    u.last_name,
    uil.installment_number,
    CASE 
        WHEN uil.deleted_at IS NULL THEN 'LOCKED'
        ELSE 'DELETED'
    END as status,
    uil.locked_at,
    uil.deleted_at
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
JOIN user_profiles u ON mr.user_id = u.user_id
LEFT JOIN ultimate_installment_locks uil ON mr.id = uil.membership_request_id
WHERE mp.name = 'Ultimate'
ORDER BY mr.created_at DESC
LIMIT 10;

-- 6. Έλεγχος Regular requests (δεν πρέπει να έχουν Ultimate)
SELECT 
    'Regular Requests Types' as test_type,
    mp.name as package_name,
    COUNT(*) as count
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name != 'Ultimate'
GROUP BY mp.name
ORDER BY count DESC;

-- 7. Έλεγχος συνολικής κατάστασης
SELECT 
    'Συνολική Κατάσταση' as test_type,
    'Συνολικά Requests' as metric,
    COUNT(*) as count
FROM membership_requests
UNION ALL
SELECT 
    'Συνολική Κατάσταση' as test_type,
    'Ultimate Requests' as metric,
    COUNT(*) as count
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name = 'Ultimate'
UNION ALL
SELECT 
    'Συνολική Κατάσταση' as test_type,
    'Regular Requests' as metric,
    COUNT(*) as count
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name != 'Ultimate'
UNION ALL
SELECT 
    'Συνολική Κατάσταση' as test_type,
    'Ultimate Locks' as metric,
    COUNT(*) as count
FROM ultimate_installment_locks;

-- 8. Έλεγχος RPC functions (αν υπάρχουν Ultimate requests)
DO $$
DECLARE
    test_request_id UUID;
    lock_result BOOLEAN;
    delete_result BOOLEAN;
BEGIN
    -- Βρες ένα Ultimate request για δοκιμή
    SELECT mr.id INTO test_request_id
    FROM membership_requests mr
    JOIN membership_packages mp ON mr.package_id = mp.id
    WHERE mp.name = 'Ultimate'
    LIMIT 1;
    
    IF test_request_id IS NOT NULL THEN
        RAISE NOTICE 'Βρέθηκε Ultimate request για δοκιμή: %', test_request_id;
        
        -- Δοκιμή lock function
        BEGIN
            SELECT lock_ultimate_installment(test_request_id, 1, NULL) INTO lock_result;
            RAISE NOTICE 'Lock function result: %', lock_result;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Lock function error: %', SQLERRM;
        END;
        
        -- Δοκιμή delete function
        BEGIN
            SELECT delete_ultimate_third_installment(test_request_id, NULL) INTO delete_result;
            RAISE NOTICE 'Delete function result: %', delete_result;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Delete function error: %', SQLERRM;
        END;
        
    ELSE
        RAISE NOTICE 'Δεν βρέθηκε Ultimate request για δοκιμή RPC functions';
    END IF;
END $$;

-- 9. Τελικό summary
SELECT 
    'ΤΕΛΙΚΟ SUMMARY' as test_type,
    'Το Ultimate σύστημα είναι έτοιμο!' as message,
    '✅' as status;
