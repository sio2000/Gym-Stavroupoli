-- ULTIMATE FINAL FIX - Τελική διόρθωση Ultimate locking system
-- ΑΝΤΙΓΡΑΨΕ ΚΑΙ ΤΡΕΞΕ ΑΥΤΟ ΣΤΟ SUPABASE SQL EDITOR

-- ========================================
-- ΒΗΜΑ 1: ΔΙΑΓΡΑΦΗ ΠΡΟΒΛΗΜΑΤΙΚΩΝ CONSTRAINTS
-- ========================================

-- Διαγραφή υπαρχόντων foreign key constraints που προκαλούν προβλήματα
ALTER TABLE ultimate_installment_locks 
DROP CONSTRAINT IF EXISTS ultimate_installment_locks_locked_by_fkey;

ALTER TABLE ultimate_installment_locks 
DROP CONSTRAINT IF EXISTS ultimate_installment_locks_deleted_by_fkey;

-- ========================================
-- ΒΗΜΑ 2: ΕΛΕΓΧΟΣ ΚΑΙ ΔΗΜΙΟΥΡΓΙΑ ADMIN USER PROFILE
-- ========================================

-- Πρώτα, βρες έναν υπαρχοντα admin user από τον πίνακα user_profiles
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Βρες τον πρώτο admin user από user_profiles
    SELECT user_id INTO admin_user_id
    FROM user_profiles
    WHERE role = 'admin'
    LIMIT 1;
    
    -- Αν δεν βρεθεί admin user, πάρε οποιονδήποτε user
    IF admin_user_id IS NULL THEN
        SELECT user_id INTO admin_user_id
        FROM user_profiles
        LIMIT 1;
    END IF;
    
    -- Αν βρεθηκε user, βεβαιώσου ότι είναι admin
    IF admin_user_id IS NOT NULL THEN
        UPDATE user_profiles 
        SET role = 'admin', updated_at = NOW()
        WHERE user_id = admin_user_id;
            
        RAISE NOTICE 'Admin user profile ensured for user: %', admin_user_id;
    ELSE
        RAISE NOTICE 'No users found in user_profiles table';
    END IF;
END $$;

-- ========================================
-- ΒΗΜΑ 3: ΔΗΜΙΟΥΡΓΙΑ FOREIGN KEYS
-- ========================================

-- Δημιουργία foreign keys που επιτρέπουν NULL
ALTER TABLE ultimate_installment_locks
ADD CONSTRAINT ultimate_installment_locks_locked_by_fkey
FOREIGN KEY (locked_by) REFERENCES user_profiles(user_id) ON DELETE SET NULL;

ALTER TABLE ultimate_installment_locks
ADD CONSTRAINT ultimate_installment_locks_deleted_by_fkey
FOREIGN KEY (deleted_by) REFERENCES user_profiles(user_id) ON DELETE SET NULL;

-- ========================================
-- ΒΗΜΑ 4: ΔΙΟΡΘΩΣΗ lock_ultimate_installment FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION lock_ultimate_installment(
    p_request_id UUID,
    p_installment_number INTEGER,
    p_locked_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request_exists BOOLEAN := FALSE;
BEGIN
    -- Έλεγχος αν υπάρχει το Ultimate request
    SELECT EXISTS(
        SELECT 1 FROM membership_requests mr
        JOIN membership_packages mp ON mr.package_id = mp.id
        WHERE mr.id = p_request_id 
        AND mp.name = 'Ultimate'
    ) INTO v_request_exists;
    
    IF NOT v_request_exists THEN
        RAISE EXCEPTION 'Ultimate request with ID % not found', p_request_id;
    END IF;
    
    -- Έλεγχος αριθμού δόσης
    IF p_installment_number NOT IN (1, 2, 3) THEN
        RAISE EXCEPTION 'Invalid installment number: %. Must be 1, 2, or 3', p_installment_number;
    END IF;

    -- Εισαγωγή ή ενημέρωση κλειδώματος
    INSERT INTO ultimate_installment_locks (
        membership_request_id,
        installment_number,
        locked_by,
        locked_at,
        created_at,
        updated_at
    )
    VALUES (
        p_request_id,
        p_installment_number,
        p_locked_by,
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (membership_request_id, installment_number)
    DO UPDATE SET
        locked_by = p_locked_by,
        locked_at = NOW(),
        deleted_at = NULL,
        deleted_by = NULL,
        updated_at = NOW();

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error locking installment: %', SQLERRM;
END;
$$;

-- ========================================
-- ΒΗΜΑ 5: ΔΙΟΡΘΩΣΗ delete_ultimate_third_installment FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION delete_ultimate_third_installment(
    p_request_id UUID,
    p_deleted_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request_exists BOOLEAN := FALSE;
BEGIN
    -- Έλεγχος αν υπάρχει το Ultimate request
    SELECT EXISTS(
        SELECT 1 FROM membership_requests mr
        JOIN membership_packages mp ON mr.package_id = mp.id
        WHERE mr.id = p_request_id 
        AND mp.name = 'Ultimate'
    ) INTO v_request_exists;
    
    IF NOT v_request_exists THEN
        RAISE EXCEPTION 'Ultimate request with ID % not found', p_request_id;
    END IF;

    -- Ενημέρωση ή εισαγωγή διαγραφής 3ης δόσης
    INSERT INTO ultimate_installment_locks (
        membership_request_id,
        installment_number,
        locked_by,
        deleted_at,
        deleted_by,
        created_at,
        updated_at
    )
    VALUES (
        p_request_id,
        3,
        p_deleted_by,
        NOW(),
        p_deleted_by,
        NOW(),
        NOW()
    )
    ON CONFLICT (membership_request_id, installment_number)
    DO UPDATE SET
        deleted_at = NOW(),
        deleted_by = p_deleted_by,
        updated_at = NOW();

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error deleting third installment: %', SQLERRM;
END;
$$;

-- ========================================
-- ΒΗΜΑ 6: ΕΛΕΓΧΟΣ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
-- ========================================

-- Έλεγχος user profile
SELECT 
    'User profile check:' as info,
    user_id,
    first_name,
    last_name,
    email,
    role
FROM user_profiles 
WHERE role = 'admin'
LIMIT 1;

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
    'Functions check:' as info,
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name IN ('lock_ultimate_installment', 'delete_ultimate_third_installment')
    AND routine_schema = 'public';

-- ========================================
-- ΒΗΜΑ 7: ΔΟΚΙΜΗ FUNCTIONS
-- ========================================

-- Δοκιμή της lock_ultimate_installment function
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
    
    -- Βρες ένα πραγματικό Ultimate request
    SELECT mr.id INTO test_request_id
    FROM membership_requests mr
    JOIN membership_packages mp ON mr.package_id = mp.id
    WHERE mp.name = 'Ultimate'
    LIMIT 1;
    
    IF test_request_id IS NOT NULL AND test_admin_id IS NOT NULL THEN
        -- Δοκιμή της function με τον πραγματικό admin user
        BEGIN
            SELECT lock_ultimate_installment(
                test_request_id,
                1,
                test_admin_id
            ) INTO test_result;
            
            RAISE NOTICE 'Ultimate locking test successful: %', test_result;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Ultimate locking test failed: %', SQLERRM;
        END;
    ELSE
        IF test_request_id IS NULL THEN
            RAISE NOTICE 'No Ultimate requests found for testing';
        END IF;
        IF test_admin_id IS NULL THEN
            RAISE NOTICE 'No admin user found for testing';
        END IF;
    END IF;
END $$;

-- Δοκιμή της delete_ultimate_third_installment function
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
    
    -- Βρες ένα πραγματικό Ultimate request
    SELECT mr.id INTO test_request_id
    FROM membership_requests mr
    JOIN membership_packages mp ON mr.package_id = mp.id
    WHERE mp.name = 'Ultimate'
    LIMIT 1;
    
    IF test_request_id IS NOT NULL AND test_admin_id IS NOT NULL THEN
        -- Δοκιμή της function με τον πραγματικό admin user
        BEGIN
            SELECT delete_ultimate_third_installment(
                test_request_id,
                test_admin_id
            ) INTO test_result;
            
            RAISE NOTICE 'Ultimate delete test successful: %', test_result;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Ultimate delete test failed: %', SQLERRM;
        END;
    ELSE
        IF test_request_id IS NULL THEN
            RAISE NOTICE 'No Ultimate requests found for testing';
        END IF;
        IF test_admin_id IS NULL THEN
            RAISE NOTICE 'No admin user found for testing';
        END IF;
    END IF;
END $$;

SELECT 'Ultimate locking fix applied successfully!' as status;
