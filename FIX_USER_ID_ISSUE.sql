-- FIX USER ID ISSUE - Διόρθωση user ID προβλήματος
-- Τρέξε αυτό στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΕΛΕΓΧΟΣ USER ID
-- ========================================

-- Έλεγχος αν υπάρχει το user ID στον auth.users
SELECT 
    'Auth users check:' as info,
    id,
    email,
    created_at
FROM auth.users 
WHERE id = 'ff37b8f6-29b2-4598-9f8f-351940e755a2';

-- Έλεγχος αν υπάρχει το user ID στον user_profiles
SELECT 
    'User profiles check:' as info,
    user_id,
    first_name,
    last_name,
    email,
    role
FROM user_profiles 
WHERE user_id = 'ff37b8f6-29b2-4598-9f8f-351940e755a2';

-- ========================================
-- ΒΗΜΑ 2: ΔΗΜΙΟΥΡΓΙΑ USER PROFILE (ΑΝ ΧΡΕΙΑΖΕΤΑΙ)
-- ========================================

-- Αν το user υπάρχει στον auth.users αλλά όχι στον user_profiles
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
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- ΒΗΜΑ 3: ΕΛΕΓΧΟΣ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
-- ========================================

-- Έλεγχος αν τώρα υπάρχει το user
SELECT 
    'Final check:' as info,
    user_id,
    first_name,
    last_name,
    email,
    role
FROM user_profiles 
WHERE user_id = 'ff37b8f6-29b2-4598-9f8f-351940e755a2';

-- Έλεγχος όλων των admin users
SELECT 
    'All admin users:' as info,
    user_id,
    first_name,
    last_name,
    email,
    role
FROM user_profiles 
WHERE role IN ('admin', 'super_admin')
ORDER BY created_at DESC;

SELECT 'User ID issue fixed!' as status;


