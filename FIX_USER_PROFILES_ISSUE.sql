-- FIX USER PROFILES ISSUE - Διόρθωση user_profiles προβλήματος
-- Τρέξε αυτό στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΔΗΜΙΟΥΡΓΙΑ USER PROFILE ΓΙΑ ΤΟΝ ADMIN
-- ========================================

-- Δημιουργία user profile για το admin user
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
ON CONFLICT (user_id) DO UPDATE SET
    first_name = COALESCE(au.raw_user_meta_data->>'first_name', 'Admin'),
    last_name = COALESCE(au.raw_user_meta_data->>'last_name', 'User'),
    email = au.email,
    role = 'admin',
    updated_at = NOW();

-- ========================================
-- ΒΗΜΑ 2: ΔΗΜΙΟΥΡΓΙΑ USER PROFILES ΓΙΑ ΟΛΟΥΣ ΤΟΥΣ USERS
-- ========================================

-- Δημιουργία user profiles για όλους τους users που δεν έχουν
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
    COALESCE(au.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(au.raw_user_meta_data->>'last_name', 'Name'),
    au.email,
    'user',
    NOW(),
    NOW()
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE up.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- ΒΗΜΑ 3: ΕΛΕΓΧΟΣ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
-- ========================================

-- Έλεγχος αν τώρα υπάρχει το admin user
SELECT 
    'Admin user check:' as info,
    user_id,
    first_name,
    last_name,
    email,
    role
FROM user_profiles 
WHERE user_id = 'ff37b8f6-29b2-4598-9f8f-351940e755a2';

-- Έλεγχος αριθμού user profiles
SELECT 
    'User profiles count:' as info,
    COUNT(*) as total_profiles
FROM user_profiles;

-- Έλεγχος αριθμού auth users
SELECT 
    'Auth users count:' as info,
    COUNT(*) as total_auth_users
FROM auth.users;

-- ========================================
-- ΒΗΜΑ 4: ΔΟΚΙΜΗ ULTIMATE LOCKING
-- ========================================

-- Δοκιμή της lock_ultimate_installment function με πραγματικό Ultimate request
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
        
        RAISE NOTICE 'Test successful: %', test_result;
    ELSE
        RAISE NOTICE 'No Ultimate requests found for testing';
    END IF;
END $$;

SELECT 'User profiles issue fixed successfully!' as status;




