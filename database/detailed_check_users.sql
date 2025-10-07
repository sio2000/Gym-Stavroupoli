-- ΛΕΠΤΟΜΕΡΗΣ ΕΛΕΓΧΟΣ ΧΡΗΣΤΩΝ
-- Εκτέλεση στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΕΛΕΓΧΟΣ ΟΛΩΝ ΤΩΝ ΧΡΗΣΤΩΝ
-- ========================================

-- Όλοι οι χρήστες από auth.users
SELECT 
    'Όλοι οι χρήστες από auth.users:' as info,
    u.id,
    u.email,
    u.created_at,
    u.raw_user_meta_data
FROM auth.users u
ORDER BY u.created_at DESC;

-- Όλοι οι χρήστες από user_profiles
SELECT 
    'Όλοι οι χρήστες από user_profiles:' as info,
    up.user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.created_at
FROM user_profiles up
ORDER BY up.created_at DESC;

-- ========================================
-- ΒΗΜΑ 2: ΣΥΓΚΡΙΣΗ
-- ========================================

-- Χρήστες που υπάρχουν και στις δύο πίνακες
SELECT 
    'Χρήστες που υπάρχουν και στις δύο πίνακες:' as info,
    u.id as auth_id,
    u.email as auth_email,
    up.user_id as profile_id,
    up.email as profile_email,
    up.first_name,
    up.last_name
FROM auth.users u
INNER JOIN user_profiles up ON u.id = up.user_id
ORDER BY u.created_at DESC;

-- Χρήστες που υπάρχουν μόνο στον auth.users
SELECT 
    'Χρήστες που υπάρχουν ΜΟΝΟ στον auth.users:' as info,
    u.id,
    u.email,
    u.created_at,
    u.raw_user_meta_data->>'first_name' as first_name,
    u.raw_user_meta_data->>'last_name' as last_name
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL
ORDER BY u.created_at DESC;

-- Χρήστες που υπάρχουν μόνο στον user_profiles (δεν θα έπρεπε να υπάρχουν)
SELECT 
    'Χρήστες που υπάρχουν ΜΟΝΟ στον user_profiles:' as warning,
    up.user_id,
    up.email,
    up.first_name,
    up.last_name,
    up.created_at
FROM user_profiles up
LEFT JOIN auth.users u ON up.user_id = u.id
WHERE u.id IS NULL
ORDER BY up.created_at DESC;

-- ========================================
-- ΒΗΜΑ 3: ΣΤΑΤΙΣΤΙΚΑ
-- ========================================

-- Συνολικοί αριθμοί
SELECT 
    'Συνολικοί αριθμοί:' as summary,
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM user_profiles) as total_profile_users,
    (SELECT COUNT(*) FROM auth.users u INNER JOIN user_profiles up ON u.id = up.user_id) as users_in_both_tables,
    (SELECT COUNT(*) FROM auth.users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE up.user_id IS NULL) as users_only_in_auth,
    (SELECT COUNT(*) FROM user_profiles up LEFT JOIN auth.users u ON up.user_id = u.id WHERE u.id IS NULL) as users_only_in_profiles;

-- Success message
SELECT 'Λεπτομερής έλεγχος ολοκληρώθηκε!' as result;
