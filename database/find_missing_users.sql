-- ΕΥΡΕΣΗ ΧΡΗΣΤΩΝ ΠΟΥ ΛΕΙΠΟΥΝ
-- Εκτέλεση στο Supabase SQL Editor

-- ========================================
-- ΑΡΙΘΜΟΙ ΧΡΗΣΤΩΝ
-- ========================================

-- Συνολικοί χρήστες
SELECT 
    'Συνολικοί χρήστες auth.users' as description,
    COUNT(*) as count
FROM auth.users;

SELECT 
    'Συνολικοί χρήστες user_profiles' as description,
    COUNT(*) as count
FROM user_profiles;

-- ========================================
-- ΧΡΗΣΤΕΣ ΠΟΥ ΛΕΙΠΟΥΝ ΑΠΟ USER_PROFILES
-- ========================================

-- Αριθμός χρηστών που λείπουν
SELECT 
    'Χρήστες που λείπουν από user_profiles' as issue,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL;

-- Λεπτομέρειες χρηστών που λείπουν
SELECT 
    'Λεπτομέρειες χρηστών που λείπουν:' as info,
    u.id,
    u.email,
    u.created_at,
    u.raw_user_meta_data->>'first_name' as first_name,
    u.raw_user_meta_data->>'last_name' as last_name,
    u.raw_user_meta_data->>'phone' as phone
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL
ORDER BY u.created_at DESC;

-- ========================================
-- ΧΡΗΣΤΕΣ ΠΟΥ ΛΕΙΠΟΥΝ ΑΠΟ AUTH.USERS
-- ========================================

-- Αριθμός χρηστών που λείπουν (δεν θα έπρεπε να υπάρχουν)
SELECT 
    'Χρήστες που λείπουν από auth.users' as warning,
    COUNT(*) as count
FROM user_profiles up
LEFT JOIN auth.users u ON up.user_id = u.id
WHERE u.id IS NULL;

-- Λεπτομέρειες χρηστών που λείπουν από auth.users
SELECT 
    'Λεπτομέρειες χρηστών που λείπουν από auth.users:' as warning,
    up.user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.created_at
FROM user_profiles up
LEFT JOIN auth.users u ON up.user_id = u.id
WHERE u.id IS NULL
ORDER BY up.created_at DESC;

-- ========================================
-- ΣΥΝΟΨΗ
-- ========================================

-- Συνοψητική εμφάνιση
SELECT 
    'ΣΥΝΟΨΗ:' as summary,
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM user_profiles) as total_profile_users,
    (SELECT COUNT(*) FROM auth.users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE up.user_id IS NULL) as missing_from_profiles,
    (SELECT COUNT(*) FROM user_profiles up LEFT JOIN auth.users u ON up.user_id = u.id WHERE u.id IS NULL) as missing_from_auth;

-- Success message
SELECT 'Έλεγχος ολοκληρώθηκε!' as result;
