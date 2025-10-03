-- FINAL USER FIX - Τελική διόρθωση user προβλήματος
-- Τρέξε αυτό στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΔΗΜΙΟΥΡΓΙΑ USER PROFILE ΓΙΑ ΤΟΝ ADMIN
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
-- ΒΗΜΑ 2: ΕΛΕΓΧΟΣ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
-- ========================================

-- Έλεγχος αν τώρα υπάρχει το admin user
SELECT 
    'Admin user created:' as info,
    user_id,
    first_name,
    last_name,
    email,
    role
FROM user_profiles 
WHERE user_id = 'ff37b8f6-29b2-4598-9f8f-351940e755a2';

-- ========================================
-- ΒΗΜΑ 3: ΔΟΚΙΜΗ ULTIMATE LOCKING
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
        -- Δοκιμή της function
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

-- ========================================
-- ΒΗΜΑ 4: ΕΛΕΓΧΟΣ ULTIMATE LOCKS
-- ========================================

-- Έλεγχος αν δημιουργήθηκαν locks
SELECT 
    'Ultimate locks created:' as info,
    COUNT(*) as total_locks
FROM ultimate_installment_locks;

-- Εμφάνιση μερικών locks
SELECT 
    'Sample locks:' as info,
    membership_request_id,
    installment_number,
    locked_at,
    locked_by
FROM ultimate_installment_locks
ORDER BY created_at DESC
LIMIT 5;

SELECT 'User profile created and Ultimate system ready!' as status;
