-- FIX SYSTEM GENERAL - Διόρθωση συστήματος γενικά
-- Τρέξε αυτό στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΔΙΑΓΡΑΦΗ FOREIGN KEY CONSTRAINTS
-- ========================================

-- Διαγραφή υπαρχόντων foreign key constraints που προκαλούν προβλήματα
ALTER TABLE ultimate_installment_locks 
DROP CONSTRAINT IF EXISTS ultimate_installment_locks_locked_by_fkey;

ALTER TABLE ultimate_installment_locks 
DROP CONSTRAINT IF EXISTS ultimate_installment_locks_deleted_by_fkey;

-- ========================================
-- ΒΗΜΑ 2: ΔΗΜΙΟΥΡΓΙΑ FOREIGN KEYS ΜΕ ON DELETE SET NULL
-- ========================================

-- Δημιουργία foreign keys που επιτρέπουν NULL και δεν προκαλούν σφάλματα
ALTER TABLE ultimate_installment_locks
ADD CONSTRAINT ultimate_installment_locks_locked_by_fkey
FOREIGN KEY (locked_by) REFERENCES user_profiles(user_id) ON DELETE SET NULL;

ALTER TABLE ultimate_installment_locks
ADD CONSTRAINT ultimate_installment_locks_deleted_by_fkey
FOREIGN KEY (deleted_by) REFERENCES user_profiles(user_id) ON DELETE SET NULL;

-- ========================================
-- ΒΗΜΑ 3: ΕΝΗΜΕΡΩΣΗ RPC FUNCTIONS
-- ========================================

-- Ενημέρωση της lock_ultimate_installment function να λειτουργεί με οποιονδήποτε user
CREATE OR REPLACE FUNCTION lock_ultimate_installment(
    p_request_id UUID,
    p_installment_number INTEGER,
    p_locked_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Εισαγωγή ή ενημέρωση κλειδώματος (με ή χωρίς locked_by)
    INSERT INTO ultimate_installment_locks (
        membership_request_id,
        installment_number,
        locked_by
    )
    VALUES (
        p_request_id,
        p_installment_number,
        p_locked_by
    )
    ON CONFLICT (membership_request_id, installment_number)
    DO UPDATE SET
        locked_at = NOW(),
        locked_by = p_locked_by,
        deleted_at = NULL,
        deleted_by = NULL,
        updated_at = NOW();

    RETURN TRUE;
END;
$$;

-- Ενημέρωση της delete_ultimate_third_installment function
CREATE OR REPLACE FUNCTION delete_ultimate_third_installment(
    p_request_id UUID,
    p_deleted_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ενημέρωση ή εισαγωγή διαγραφής 3ης δόσης (με ή χωρίς deleted_by)
    INSERT INTO ultimate_installment_locks (
        membership_request_id,
        installment_number,
        locked_by,
        deleted_at,
        deleted_by
    )
    VALUES (
        p_request_id,
        3,
        p_deleted_by,
        NOW(),
        p_deleted_by
    )
    ON CONFLICT (membership_request_id, installment_number)
    DO UPDATE SET
        deleted_at = NOW(),
        deleted_by = p_deleted_by,
        updated_at = NOW();

    RETURN TRUE;
END;
$$;

-- ========================================
-- ΒΗΜΑ 4: ΕΛΕΓΧΟΣ ΣΥΣΤΗΜΑΤΟΣ
-- ========================================

-- Έλεγχος αν υπάρχουν Ultimate requests
SELECT 
    'Ultimate requests available:' as info,
    COUNT(*) as count
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mp.name = 'Ultimate';

-- Έλεγχος foreign keys
SELECT 
    'Foreign keys status:' as info,
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
    AND tc.table_name = 'ultimate_installment_locks';

-- Έλεγχος functions
SELECT 
    'Functions status:' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('lock_ultimate_installment', 'delete_ultimate_third_installment')
AND routine_schema = 'public';

SELECT 'System fixed and ready to work!' as status;




