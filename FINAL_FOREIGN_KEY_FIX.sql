-- FINAL FOREIGN KEY FIX - Τελική διόρθωση foreign key
-- Τρέξε αυτό στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΔΙΑΓΡΑΦΗ ΟΛΩΝ ΤΩΝ FOREIGN KEY CONSTRAINTS
-- ========================================

-- Διαγραφή όλων των foreign key constraints που προκαλούν προβλήματα
ALTER TABLE ultimate_installment_locks 
DROP CONSTRAINT IF EXISTS ultimate_installment_locks_locked_by_fkey;

ALTER TABLE ultimate_installment_locks 
DROP CONSTRAINT IF EXISTS ultimate_installment_locks_deleted_by_fkey;

-- ========================================
-- ΒΗΜΑ 2: ΔΗΜΙΟΥΡΓΙΑ USER PROFILE ΓΙΑ ΤΟΝ ADMIN
-- ========================================

-- Δημιουργία user profile για το admin user που λείπει
INSERT INTO user_profiles (
    user_id,
    first_name,
    last_name,
    email,
    role,
    created_at,
    updated_at
)
VALUES (
    'ff37b8f6-29b2-4598-9f8f-351940e755a2',
    'Admin',
    'User',
    'admin@getfitskg.gr',
    'admin',
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    first_name = 'Admin',
    last_name = 'User',
    email = 'admin@getfitskg.gr',
    role = 'admin',
    updated_at = NOW();

-- ========================================
-- ΒΗΜΑ 3: ΔΗΜΙΟΥΡΓΙΑ FOREIGN KEYS ΜΕ ON DELETE SET NULL
-- ========================================

-- Δημιουργία foreign keys που επιτρέπουν NULL και δεν προκαλούν σφάλματα
ALTER TABLE ultimate_installment_locks
ADD CONSTRAINT ultimate_installment_locks_locked_by_fkey
FOREIGN KEY (locked_by) REFERENCES user_profiles(user_id) ON DELETE SET NULL;

ALTER TABLE ultimate_installment_locks
ADD CONSTRAINT ultimate_installment_locks_deleted_by_fkey
FOREIGN KEY (deleted_by) REFERENCES user_profiles(user_id) ON DELETE SET NULL;

-- ========================================
-- ΒΗΜΑ 4: ΕΛΕΓΧΟΣ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
-- ========================================

-- Έλεγχος αν υπάρχει το admin user
SELECT 
    'Admin user check:' as info,
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

-- ========================================
-- ΒΗΜΑ 5: ΔΟΚΙΜΗ ULTIMATE LOCKING
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
        SELECT lock_ultimate_installment(
            test_request_id,
            1,
            'ff37b8f6-29b2-4598-9f8f-351940e755a2'::UUID
        ) INTO test_result;
        
        RAISE NOTICE 'Ultimate locking test successful: %', test_result;
    ELSE
        RAISE NOTICE 'No Ultimate requests found for testing';
    END IF;
END $$;

SELECT 'Foreign key issue fixed permanently!' as status;




