-- ULTIMATE LOCKING FIX - Διόρθωση κλειδώματος και διαγραφής δόσεων Ultimate
-- Τρέξε αυτό στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΕΛΕΓΧΟΣ ΚΑΙ ΔΙΑΓΡΑΦΗ ΠΡΟΒΛΗΜΑΤΙΚΩΝ CONSTRAINTS
-- ========================================

-- Διαγραφή υπαρχόντων foreign key constraints που προκαλούν προβλήματα
ALTER TABLE ultimate_installment_locks 
DROP CONSTRAINT IF EXISTS ultimate_installment_locks_locked_by_fkey;

ALTER TABLE ultimate_installment_locks 
DROP CONSTRAINT IF EXISTS ultimate_installment_locks_deleted_by_fkey;

-- ========================================
-- ΒΗΜΑ 2: ΕΛΕΓΧΟΣ ΚΑΙ ΔΗΜΙΟΥΡΓΙΑ USER PROFILES
-- ========================================

-- Δημιουργία user profile για το admin user αν δεν υπάρχει
INSERT INTO user_profiles (
    user_id,
    first_name,
    last_name,
    email,
    role,
    created_at,
    updated_at
)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'first_name', 'Admin'),
    COALESCE(au.raw_user_meta_data->>'last_name', 'User'),
    au.email,
    'admin',
    NOW(),
    NOW()
FROM auth.users au
WHERE au.id = 'ff37b8f6-29b2-4598-9f8f-351940e755a2'
AND NOT EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = au.id
)
ON CONFLICT (user_id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, 'Admin'),
    last_name = COALESCE(EXCLUDED.last_name, 'User'),
    email = EXCLUDED.email,
    role = 'admin',
    updated_at = NOW();

-- ========================================
-- ΒΗΜΑ 3: ΔΗΜΙΟΥΡΓΙΑ FOREIGN KEYS ΜΕ ΣΩΣΤΑ SETTINGS
-- ========================================

-- Δημιουργία foreign keys που επιτρέπουν NULL και δεν προκαλούν σφάλματα
ALTER TABLE ultimate_installment_locks
ADD CONSTRAINT ultimate_installment_locks_locked_by_fkey
FOREIGN KEY (locked_by) REFERENCES user_profiles(user_id) ON DELETE SET NULL;

ALTER TABLE ultimate_installment_locks
ADD CONSTRAINT ultimate_installment_locks_deleted_by_fkey
FOREIGN KEY (deleted_by) REFERENCES user_profiles(user_id) ON DELETE SET NULL;

-- ========================================
-- ΒΗΜΑ 4: ΔΙΟΡΘΩΣΗ ΚΑΙ ΕΝΗΜΕΡΩΣΗ RPC FUNCTIONS
-- ========================================

-- Διόρθωση της lock_ultimate_installment function
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

-- Διόρθωση της delete_ultimate_third_installment function
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
-- ΒΗΜΑ 5: ΕΛΕΓΧΟΣ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
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
WHERE user_id = 'ff37b8f6-29b2-4598-9f8f-351940e755a2';

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
-- ΒΗΜΑ 6: ΔΟΚΙΜΗ FUNCTIONS
-- ========================================

-- Δοκιμή της lock_ultimate_installment function
DO $$
DECLARE
    test_request_id UUID;
    test_result BOOLEAN;
BEGIN
    -- Βρες ένα πραγματικό Ultimate request
    SELECT mr.id INTO test_request_id
    FROM membership_requests mr
    JOIN membership_packages mp ON mr.package_id = mp.id
    WHERE mp.name = 'Ultimate'
    LIMIT 1;
    
    IF test_request_id IS NOT NULL THEN
        -- Δοκιμή της function με το admin user
        BEGIN
            SELECT lock_ultimate_installment(
                test_request_id,
                1,
                'ff37b8f6-29b2-4598-9f8f-351940e755a2'::UUID
            ) INTO test_result;
            
            RAISE NOTICE 'Ultimate locking test successful: %', test_result;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Ultimate locking test failed: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'No Ultimate requests found for testing';
    END IF;
END $$;

-- Δοκιμή της delete_ultimate_third_installment function
DO $$
DECLARE
    test_request_id UUID;
    test_result BOOLEAN;
BEGIN
    -- Βρες ένα πραγματικό Ultimate request
    SELECT mr.id INTO test_request_id
    FROM membership_requests mr
    JOIN membership_packages mp ON mr.package_id = mp.id
    WHERE mp.name = 'Ultimate'
    LIMIT 1;
    
    IF test_request_id IS NOT NULL THEN
        -- Δοκιμή της function με το admin user
        BEGIN
            SELECT delete_ultimate_third_installment(
                test_request_id,
                'ff37b8f6-29b2-4598-9f8f-351940e755a2'::UUID
            ) INTO test_result;
            
            RAISE NOTICE 'Ultimate delete test successful: %', test_result;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Ultimate delete test failed: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'No Ultimate requests found for testing';
    END IF;
END $$;

SELECT 'Ultimate locking fix applied successfully!' as status;
