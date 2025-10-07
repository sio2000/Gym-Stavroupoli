-- ΕΠΑΛΗΘΕΥΣΗ ΜΕΤΑΦΟΡΑΣ ΧΡΗΣΤΩΝ
-- Εμφάνιση χρηστών που μεταφέρθηκαν από auth.users σε user_profiles
-- Εκτέλεση στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΣΥΝΟΛΙΚΗ ΚΑΤΑΣΤΑΣΗ
-- ========================================

SELECT 
    'Συνολικοί χρήστες auth.users' as table_name,
    COUNT(*) as count
FROM auth.users;

SELECT 
    'Συνολικοί χρήστες user_profiles' as table_name,
    COUNT(*) as count
FROM user_profiles;

-- Χρήστες που εξακολουθούν να λείπουν
SELECT 
    'Χρήστες που εξακολουθούν να λείπουν' as issue,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL;

-- ========================================
-- ΒΗΜΑ 2: ΧΡΗΣΤΕΣ ΠΟΥ ΜΕΤΑΦΕΡΘΗΚΑΝ
-- ========================================

-- Όλοι οι χρήστες που υπάρχουν και στις δύο πίνακες
SELECT 
    'Χρήστες που μεταφέρθηκαν επιτυχώς:' as info,
    u.id as auth_user_id,
    u.email as auth_email,
    u.created_at as auth_created,
    up.user_id as profile_user_id,
    up.first_name,
    up.last_name,
    up.email as profile_email,
    up.role,
    up.language,
    up.created_at as profile_created,
    CASE 
        WHEN u.email = up.email THEN 'Email Match ✓'
        ELSE 'Email Mismatch ✗'
    END as email_status
FROM auth.users u
INNER JOIN user_profiles up ON u.id = up.user_id
ORDER BY up.created_at DESC;

-- ========================================
-- ΒΗΜΑ 3: ΝΕΟΙ ΧΡΗΣΤΕΣ (ΠΡΟΣΦΑΤΟΙ)
-- ========================================

-- Χρήστες που προστέθηκαν τις τελευταίες 24 ώρες
SELECT 
    'Νέοι χρήστες (τελευταίες 24 ώρες):' as info,
    up.user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.role,
    up.language,
    up.created_at,
    EXTRACT(EPOCH FROM (NOW() - up.created_at))/3600 as hours_ago
FROM user_profiles up
WHERE up.created_at > NOW() - INTERVAL '24 hours'
ORDER BY up.created_at DESC;

-- ========================================
-- ΒΗΜΑ 4: ΣΤΑΤΙΣΤΙΚΑ ΜΕΤΑΦΟΡΑΣ
-- ========================================

-- Στατιστικά ανά ρόλο
SELECT 
    'Στατιστικά ανά ρόλο:' as info,
    role,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_profiles), 2) as percentage
FROM user_profiles
GROUP BY role
ORDER BY count DESC;

-- Στατιστικά ανά γλώσσα
SELECT 
    'Στατιστικά ανά γλώσσα:' as info,
    language,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_profiles), 2) as percentage
FROM user_profiles
GROUP BY language
ORDER BY count DESC;

-- ========================================
-- ΒΗΜΑ 5: ΕΛΕΓΧΟΣ ΠΡΟΒΛΗΜΑΤΩΝ
-- ========================================

-- Έλεγχος για διπλά emails
SELECT 
    'Διπλά emails (αν υπάρχουν):' as issue,
    email,
    COUNT(*) as count
FROM user_profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- Έλεγχος για κενά ονόματα
SELECT 
    'Χρήστες με κενά ονόματα:' as issue,
    user_id,
    first_name,
    last_name,
    email
FROM user_profiles
WHERE first_name IS NULL OR first_name = '' OR last_name IS NULL OR last_name = '';

-- ========================================
-- ΒΗΜΑ 6: ΣΥΓΚΡΙΣΗ ΠΡΙΝ ΚΑΙ ΜΕΤΑ
-- ========================================

-- Εμφάνιση χρηστών που υπάρχουν μόνο στον auth.users (δεν μεταφέρθηκαν)
SELECT 
    'Χρήστες που ΔΕΝ μεταφέρθηκαν:' as warning,
    u.id,
    u.email,
    u.created_at,
    u.raw_user_meta_data->>'first_name' as first_name_from_auth,
    u.raw_user_meta_data->>'last_name' as last_name_from_auth
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL
ORDER BY u.created_at DESC;

-- Success message
SELECT 'Επαλήθευση ολοκληρώθηκε!' as result;
