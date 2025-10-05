-- CHECK ULTIMATE TABLE - Έλεγχος του πίνακα Ultimate
-- Τρέξε αυτό στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΕΛΕΓΧΟΣ ΔΟΜΗΣ ΠΙΝΑΚΑ
-- ========================================

-- Ελέγχος αν υπάρχει ο πίνακας
SELECT 
    'Table exists:' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ultimate_membership_requests') 
        THEN 'YES' 
        ELSE 'NO' 
    END as status;

-- Ελέγχος των στηλών του πίνακα
SELECT 
    'Table columns:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ultimate_membership_requests'
ORDER BY ordinal_position;

-- ========================================
-- ΒΗΜΑ 2: ΕΛΕΓΧΟΣ FOREIGN KEYS
-- ========================================

-- Ελέγχος των foreign keys
SELECT 
    'Foreign keys:' as info,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'ultimate_membership_requests';

-- ========================================
-- ΒΗΜΑ 3: ΕΛΕΓΧΟΣ ΔΕΔΟΜΕΝΩΝ
-- ========================================

-- Ελέγχος αριθμού εγγραφών
SELECT 
    'Record count:' as info,
    COUNT(*) as count
FROM ultimate_membership_requests;

-- Εμφάνιση μερικών εγγραφών
SELECT 
    'Sample records:' as info,
    id,
    user_id,
    package_id,
    has_installments,
    installment_1_locked,
    installment_2_locked,
    installment_3_locked,
    third_installment_deleted
FROM ultimate_membership_requests
LIMIT 5;

-- ========================================
-- ΒΗΜΑ 4: ΔΟΚΙΜΗ QUERY
-- ========================================

-- Δοκιμή του query που χρησιμοποιεί το frontend
SELECT 
    'Test query:' as info,
    umr.id,
    umr.user_id,
    umr.package_id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name
FROM ultimate_membership_requests umr
LEFT JOIN user_profiles up ON umr.user_id = up.user_id
LEFT JOIN membership_packages mp ON umr.package_id = mp.id
LIMIT 3;

SELECT 'Check completed!' as status;




