-- ΑΠΛΟΣ ΕΛΕΓΧΟΣ ΧΡΗΣΤΩΝ ΠΟΥ ΛΕΙΠΟΥΝ
-- Εκτέλεση στο Supabase SQL Editor

-- ========================================
-- ΒΑΣΙΚΟΣ ΕΛΕΓΧΟΣ
-- ========================================

-- Συνολικοί χρήστες σε κάθε πίνακα
SELECT 
    'Συνολικοί χρήστες auth.users' as description,
    COUNT(*) as count
FROM auth.users;

SELECT 
    'Συνολικοί χρήστες user_profiles' as description,
    COUNT(*) as count
FROM user_profiles;

-- ========================================
-- ΧΡΗΣΤΕΣ ΠΟΥ ΛΕΙΠΟΥΝ
-- ========================================

-- Χρήστες που υπάρχουν στον auth.users αλλά όχι στον user_profiles
SELECT 
    'Χρήστες που λείπουν από user_profiles:' as issue,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL;

-- ========================================
-- ΛΕΠΤΟΜΕΡΕΙΕΣ ΧΡΗΣΤΩΝ ΠΟΥ ΛΕΙΠΟΥΝ
-- ========================================

-- Εμφάνιση όλων των χρηστών που λείπουν
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
-- ΣΥΝΟΨΗ
-- ========================================

-- Συνοψητική εμφάνιση
SELECT 
    'ΣΥΝΟΨΗ:' as summary,
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM user_profiles) as total_profile_users,
    (SELECT COUNT(*) FROM auth.users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE up.user_id IS NULL) as missing_users;

-- Success message
SELECT 'Έλεγχος ολοκληρώθηκε!' as result;
