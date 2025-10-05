-- CHECK ULTIMATE DATA - Έλεγχος δεδομένων Ultimate
-- Τρέξε αυτό στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΕΛΕΓΧΟΣ ΠΑΛΙΟΥ ΠΙΝΑΚΑ
-- ========================================

-- Έλεγχος αν υπάρχουν Ultimate αιτήματα στον παλιό πίνακα
SELECT 
    'Old table Ultimate requests:' as info,
    COUNT(*) as count
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name = 'Ultimate';

-- Εμφάνιση Ultimate αιτημάτων από τον παλιό πίνακα
SELECT 
    'Old Ultimate requests:' as info,
    mr.id,
    mr.user_id,
    mr.package_id,
    mp.name as package_name,
    mr.has_installments,
    mr.installment_1_locked,
    mr.installment_2_locked,
    mr.installment_3_locked,
    mr.third_installment_deleted,
    mr.created_at
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name = 'Ultimate'
ORDER BY mr.created_at DESC
LIMIT 10;

-- ========================================
-- ΒΗΜΑ 2: ΕΛΕΓΧΟΣ ΝΕΟΥ ΠΙΝΑΚΑ
-- ========================================

-- Έλεγχος αν υπάρχει ο νέος πίνακας
SELECT 
    'New table exists:' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ultimate_membership_requests') 
        THEN 'YES' 
        ELSE 'NO' 
    END as status;

-- Έλεγχος αριθμού εγγραφών στον νέο πίνακα
SELECT 
    'New table count:' as info,
    COUNT(*) as count
FROM ultimate_membership_requests;

-- ========================================
-- ΒΗΜΑ 3: ΕΛΕΓΧΟΣ PACKAGE ID
-- ========================================

-- Έλεγχος του Ultimate package ID
SELECT 
    'Ultimate package:' as info,
    id,
    name,
    description
FROM membership_packages 
WHERE name = 'Ultimate';

-- ========================================
-- ΒΗΜΑ 4: ΔΟΚΙΜΗ MIGRATION
-- ========================================

-- Αν υπάρχουν δεδομένα στον παλιό πίνακα, δοκιμή μετεγκατάστασης
SELECT 
    'Migration test:' as info,
    'Ready to migrate Ultimate requests from old table to new table' as message;

SELECT 'Check completed!' as status;




