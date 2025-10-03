-- TEST ULTIMATE SEPARATION - Δοκιμή διαχωρισμού Ultimate συνδρομών
-- Αυτό το script ελέγχει αν η διόρθωση λειτουργεί σωστά

-- ========================================
-- ΒΗΜΑ 1: ΕΛΕΓΧΟΣ ΔΟΜΗΣ ΠΙΝΑΚΩΝ
-- ========================================

-- Ελέγχος αν υπάρχει ο νέος πίνακας
SELECT 
    'Ultimate table exists:' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ultimate_membership_requests') 
        THEN 'YES' 
        ELSE 'NO' 
    END as status;

-- Ελέγχος αριθμού Ultimate αιτημάτων στο νέο πίνακα
SELECT 
    'Ultimate requests in new table:' as info,
    COUNT(*) as count
FROM ultimate_membership_requests;

-- Ελέγχος αριθμού Ultimate αιτημάτων στον παλιό πίνακα
SELECT 
    'Ultimate requests in old table:' as info,
    COUNT(*) as count
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name = 'Ultimate' AND mr.has_installments = true;

-- ========================================
-- ΒΗΜΑ 2: ΕΛΕΓΧΟΣ ΣΥΝΑΡΤΗΣΕΩΝ
-- ========================================

-- Ελέγχος αν υπάρχουν οι νέες συναρτήσεις
SELECT 
    'Ultimate functions exist:' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'lock_ultimate_installment') 
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'unlock_ultimate_installment')
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'delete_ultimate_third_installment')
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'is_ultimate_installment_locked')
        THEN 'YES' 
        ELSE 'NO' 
    END as status;

-- ========================================
-- ΒΗΜΑ 3: ΔΟΚΙΜΗ ΚΛΕΙΔΩΜΑΤΟΣ
-- ========================================

-- Βρίσκουμε ένα Ultimate αίτημα για δοκιμή
WITH test_request AS (
    SELECT id, user_id 
    FROM ultimate_membership_requests 
    WHERE has_installments = true 
    LIMIT 1
)
SELECT 
    'Test request found:' as info,
    id,
    user_id
FROM test_request;

-- Δοκιμή κλειδώματος (αν υπάρχει αίτημα)
DO $$
DECLARE
    test_id UUID;
    test_user_id UUID;
BEGIN
    -- Βρίσκουμε ένα Ultimate αίτημα για δοκιμή
    SELECT id, user_id INTO test_id, test_user_id
    FROM ultimate_membership_requests 
    WHERE has_installments = true 
    LIMIT 1;
    
    IF test_id IS NOT NULL THEN
        -- Δοκιμή κλειδώματος 1ης δόσης
        PERFORM lock_ultimate_installment(test_id, 1, test_user_id);
        
        -- Ελέγχος αν κλειδώθηκε
        IF is_ultimate_installment_locked(test_id, 1) THEN
            RAISE NOTICE 'SUCCESS: Ultimate installment locking works!';
        ELSE
            RAISE NOTICE 'ERROR: Ultimate installment locking failed!';
        END IF;
        
        -- Ξεκλείδωμα για καθαρισμό
        PERFORM unlock_ultimate_installment(test_id, 1);
        
    ELSE
        RAISE NOTICE 'No Ultimate requests found for testing';
    END IF;
END $$;

-- ========================================
-- ΒΗΜΑ 4: ΕΛΕΓΧΟΣ ΑΝΕΞΑΡΤΗΣΙΑΣ
-- ========================================

-- Ελέγχος αν τα Ultimate αιτήματα είναι ανεξάρτητα από τα κανονικά
SELECT 
    'Independence check:' as info,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM membership_requests mr
            JOIN membership_packages mp ON mr.package_id = mp.id
            WHERE mp.name = 'Ultimate' 
            AND mr.has_installments = true
            AND (mr.installment_1_locked = true OR mr.installment_2_locked = true OR mr.installment_3_locked = true)
        )
        THEN 'PASS - No locked Ultimate installments in old table'
        ELSE 'FAIL - Found locked Ultimate installments in old table'
    END as status;

-- ========================================
-- ΒΗΜΑ 5: ΣΥΝΟΨΗ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
-- ========================================

SELECT 'Ultimate separation test completed!' as status;

-- Εμφάνιση όλων των Ultimate αιτημάτων με την κατάστασή τους
SELECT 
    'Ultimate requests status:' as info,
    id,
    user_id,
    installment_1_locked,
    installment_2_locked,
    installment_3_locked,
    third_installment_deleted,
    created_at
FROM ultimate_membership_requests
ORDER BY created_at DESC
LIMIT 10;


