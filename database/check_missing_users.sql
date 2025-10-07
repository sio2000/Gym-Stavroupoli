-- ΕΛΕΓΧΟΣ ΧΡΗΣΤΩΝ ΠΟΥ ΛΕΙΠΟΥΝ ΑΠΟ USER_PROFILES
-- Γρήγορος έλεγχος της κατάστασης πριν την προσθήκη
-- Εκτέλεση στο Supabase SQL Editor

-- ========================================
-- ΓΡΗΓΟΡΟΣ ΕΛΕΓΧΟΣ ΚΑΤΑΣΤΑΣΗΣ
-- ========================================

-- Συνολικοί χρήστες
SELECT 
    'Συνολικοί χρήστες auth.users' as table_name,
    COUNT(*) as count
FROM auth.users;

SELECT 
    'Συνολικοί χρήστες user_profiles' as table_name,
    COUNT(*) as count
FROM user_profiles;

-- Χρήστες που λείπουν από user_profiles
SELECT 
    'Χρήστες που λείπουν από user_profiles' as issue,
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
    u.raw_user_meta_data->>'first_name' as first_name_from_meta,
    u.raw_user_meta_data->>'last_name' as last_name_from_meta,
    u.raw_user_meta_data->>'phone' as phone_from_meta
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL
ORDER BY u.created_at DESC;

-- ========================================
-- ΕΛΕΓΧΟΣ ΠΡΟΒΛΗΜΑΤΩΝ
-- ========================================

-- Έλεγχος για διπλό email στο user_profiles
SELECT 
    'Διπλά emails στο user_profiles:' as issue,
    email,
    COUNT(*) as count
FROM user_profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- Έλεγχος για διπλό user_id στο user_profiles
SELECT 
    'Διπλά user_ids στο user_profiles:' as issue,
    user_id,
    COUNT(*) as count
FROM user_profiles
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Success message
SELECT 'Έλεγχος ολοκληρώθηκε!' as result;
