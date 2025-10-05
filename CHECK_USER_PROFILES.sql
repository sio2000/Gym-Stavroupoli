-- CHECK USER PROFILES - Έλεγχος user_profiles πίνακα
-- Τρέξε αυτό στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΕΛΕΓΧΟΣ AUTH.USERS
-- ========================================

-- Έλεγχος αν υπάρχει το user στον auth.users
SELECT 
    'Auth users check:' as info,
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE id = 'ff37b8f6-29b2-4598-9f8f-351940e755a2';

-- ========================================
-- ΒΗΜΑ 2: ΕΛΕΓΧΟΣ USER_PROFILES
-- ========================================

-- Έλεγχος αν υπάρχει το user στον user_profiles
SELECT 
    'User profiles check:' as info,
    user_id,
    first_name,
    last_name,
    email,
    role,
    created_at
FROM user_profiles 
WHERE user_id = 'ff37b8f6-29b2-4598-9f8f-351940e755a2';

-- ========================================
-- ΒΗΜΑ 3: ΕΛΕΓΧΟΣ ΟΛΩΝ ΤΩΝ USERS
-- ========================================

-- Έλεγχος όλων των users στον auth.users
SELECT 
    'All auth users:' as info,
    id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- Έλεγχος όλων των users στον user_profiles
SELECT 
    'All user profiles:' as info,
    user_id,
    first_name,
    last_name,
    email,
    role,
    created_at
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- ΒΗΜΑ 4: ΕΛΕΓΧΟΣ ΔΙΑΦΟΡΩΝ
-- ========================================

-- Users που υπάρχουν στον auth.users αλλά όχι στον user_profiles
SELECT 
    'Missing from user_profiles:' as info,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE up.user_id IS NULL
ORDER BY au.created_at DESC;

-- Users που υπάρχουν στον user_profiles αλλά όχι στον auth.users
SELECT 
    'Missing from auth.users:' as info,
    up.user_id,
    up.email,
    up.created_at
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE au.id IS NULL
ORDER BY up.created_at DESC;

SELECT 'User profiles check completed!' as status;




