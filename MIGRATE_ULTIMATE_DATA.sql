-- MIGRATE ULTIMATE DATA - Μετεγκατάσταση Ultimate δεδομένων
-- Τρέξε αυτό στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΕΛΕΓΧΟΣ ΥΠΑΡΞΗΣ ΔΕΔΟΜΕΝΩΝ
-- ========================================

-- Έλεγχος αν υπάρχουν Ultimate αιτήματα στον παλιό πίνακα
DO $$
DECLARE
    ultimate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO ultimate_count
    FROM membership_requests mr
    JOIN membership_packages mp ON mr.package_id = mp.id
    WHERE mp.name = 'Ultimate';
    
    RAISE NOTICE 'Found % Ultimate requests in old table', ultimate_count;
    
    IF ultimate_count = 0 THEN
        RAISE NOTICE 'No Ultimate requests found in old table. Nothing to migrate.';
        RETURN;
    END IF;
END $$;

-- ========================================
-- ΒΗΜΑ 2: ΜΕΤΕΓΚΑΤΑΣΤΑΣΗ ΔΕΔΟΜΕΝΩΝ
-- ========================================

-- Μετεγκατάσταση Ultimate αιτημάτων από τον παλιό πίνακα στον νέο
INSERT INTO ultimate_membership_requests (
    id,
    user_id,
    package_id,
    duration_type,
    requested_price,
    has_installments,
    installment_1_amount,
    installment_2_amount,
    installment_3_amount,
    installment_1_payment_method,
    installment_2_payment_method,
    installment_3_payment_method,
    installment_1_due_date,
    installment_2_due_date,
    installment_3_due_date,
    installment_1_paid,
    installment_2_paid,
    installment_3_paid,
    installment_1_paid_at,
    installment_2_paid_at,
    installment_3_paid_at,
    all_installments_paid,
    installments_completed_at,
    installment_1_locked,
    installment_2_locked,
    installment_3_locked,
    third_installment_deleted,
    third_installment_deleted_at,
    third_installment_deleted_by,
    status,
    created_at,
    updated_at
)
SELECT 
    mr.id,
    mr.user_id,
    mr.package_id,
    mr.duration_type,
    mr.requested_price,
    mr.has_installments,
    mr.installment_1_amount,
    mr.installment_2_amount,
    mr.installment_3_amount,
    mr.installment_1_payment_method,
    mr.installment_2_payment_method,
    mr.installment_3_payment_method,
    mr.installment_1_due_date,
    mr.installment_2_due_date,
    mr.installment_3_due_date,
    mr.installment_1_paid,
    mr.installment_2_paid,
    mr.installment_3_paid,
    mr.installment_1_paid_at,
    mr.installment_2_paid_at,
    mr.installment_3_paid_at,
    mr.all_installments_paid,
    mr.installments_completed_at,
    mr.installment_1_locked,
    mr.installment_2_locked,
    mr.installment_3_locked,
    mr.third_installment_deleted,
    mr.third_installment_deleted_at,
    mr.third_installment_deleted_by,
    mr.status,
    mr.created_at,
    mr.updated_at
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name = 'Ultimate'
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- ΒΗΜΑ 3: ΕΛΕΓΧΟΣ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
-- ========================================

-- Έλεγχος πόσα δεδομένα μετεγκαταστάθηκαν
SELECT 
    'Migration results:' as info,
    COUNT(*) as migrated_count
FROM ultimate_membership_requests;

-- Εμφάνιση μερικών μετεγκατασταθέντων εγγραφών
SELECT 
    'Sample migrated data:' as info,
    id,
    user_id,
    package_id,
    has_installments,
    installment_1_locked,
    installment_2_locked,
    installment_3_locked,
    third_installment_deleted,
    created_at
FROM ultimate_membership_requests
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- ΒΗΜΑ 4: ΔΙΑΓΡΑΦΗ ΑΠΟ ΠΑΛΙΟ ΠΙΝΑΚΑ (ΠΡΟΣΟΧΗ!)
-- ========================================

-- ΠΡΟΣΟΧΗ: Αυτό θα διαγράψει τα Ultimate αιτήματα από τον παλιό πίνακα
-- Αφήνω το σχόλιο για να μην τρέξει αυτόματα
/*
DELETE FROM membership_requests 
WHERE id IN (
    SELECT mr.id
    FROM membership_requests mr
    JOIN membership_packages mp ON mr.package_id = mp.id
    WHERE mp.name = 'Ultimate'
);
*/

SELECT 'Migration completed! Check the results above.' as status;




