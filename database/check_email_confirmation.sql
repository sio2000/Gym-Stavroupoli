-- ΕΛΕΓΧΟΣ ΧΡΗΣΤΩΝ ΠΟΥ ΔΕΝ ΕΧΟΥΝ ΑΠΟΔΕΧΤΕΙ EMAIL CONFIRMATION
-- Εκτέλεση στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΕΛΕΓΧΟΣ EMAIL CONFIRMATION ΣΤΟΝ AUTH.USERS
-- ========================================

-- Χρήστες που δεν έχουν επιβεβαιώσει το email
SELECT 
    'Χρήστες που δεν έχουν επιβεβαιώσει το email:' as info,
    COUNT(*) as count
FROM auth.users 
WHERE email_confirmed_at IS NULL;

-- Λεπτομέρειες χρηστών που δεν έχουν επιβεβαιώσει το email
SELECT 
    'Λεπτομέρειες χρηστών χωρίς email confirmation:' as info,
    u.id,
    u.email,
    u.created_at,
    u.email_confirmed_at,
    u.confirmation_sent_at,
    u.confirmation_token,
    u.raw_user_meta_data->>'first_name' as first_name,
    u.raw_user_meta_data->>'last_name' as last_name
FROM auth.users u
WHERE u.email_confirmed_at IS NULL
ORDER BY u.created_at DESC;

-- ========================================
-- ΒΗΜΑ 2: ΣΥΓΚΡΙΣΗ ΜΕ USER_PROFILES
-- ========================================

-- Χρήστες που δεν έχουν email confirmation ΑΛΛΑ έχουν προφίλ
SELECT 
    'Χρήστες χωρίς email confirmation αλλά με προφίλ:' as info,
    u.id,
    u.email,
    u.email_confirmed_at,
    up.first_name,
    up.last_name,
    up.created_at as profile_created
FROM auth.users u
INNER JOIN user_profiles up ON u.id = up.user_id
WHERE u.email_confirmed_at IS NULL
ORDER BY u.created_at DESC;

-- Χρήστες που δεν έχουν email confirmation ΚΑΙ δεν έχουν προφίλ
SELECT 
    'Χρήστες χωρίς email confirmation ΚΑΙ χωρίς προφίλ:' as warning,
    u.id,
    u.email,
    u.created_at,
    u.email_confirmed_at,
    u.raw_user_meta_data->>'first_name' as first_name,
    u.raw_user_meta_data->>'last_name' as last_name
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.email_confirmed_at IS NULL 
  AND up.user_id IS NULL
ORDER BY u.created_at DESC;

-- ========================================
-- ΒΗΜΑ 3: ΣΤΑΤΙΣΤΙΚΑ EMAIL CONFIRMATION
-- ========================================

-- Συνολικοί αριθμοί
SELECT 
    'Συνολικοί αριθμοί:' as summary,
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
    (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NULL) as unconfirmed_users,
    (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NULL AND id IN (SELECT user_id FROM user_profiles)) as unconfirmed_with_profile,
    (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NULL AND id NOT IN (SELECT user_id FROM user_profiles)) as unconfirmed_without_profile;

-- Ποσοστό επιβεβαίωσης
SELECT 
    'Ποσοστό επιβεβαίωσης email:' as info,
    ROUND(
        (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) * 100.0 / 
        (SELECT COUNT(*) FROM auth.users), 2
    ) as confirmation_percentage;

-- ========================================
-- ΒΗΜΑ 4: ΧΡΟΝΟΛΟΓΙΑ CONFIRMATION
-- ========================================

-- Χρήστες που δημιουργήθηκαν αλλά δεν επιβεβαίωσαν εδώ και καιρό
SELECT 
    'Χρήστες που δεν επιβεβαίωσαν εδώ και 7+ ημέρες:' as warning,
    u.id,
    u.email,
    u.created_at,
    u.email_confirmed_at,
    EXTRACT(DAYS FROM (NOW() - u.created_at)) as days_since_creation
FROM auth.users u
WHERE u.email_confirmed_at IS NULL 
  AND u.created_at < NOW() - INTERVAL '7 days'
ORDER BY u.created_at ASC;

-- Χρήστες που δημιουργήθηκαν πρόσφατα και δεν επιβεβαίωσαν
SELECT 
    'Χρήστες που δεν επιβεβαίωσαν πρόσφατα (τελευταίες 24 ώρες):' as info,
    u.id,
    u.email,
    u.created_at,
    u.email_confirmed_at,
    EXTRACT(HOURS FROM (NOW() - u.created_at)) as hours_since_creation
FROM auth.users u
WHERE u.email_confirmed_at IS NULL 
  AND u.created_at > NOW() - INTERVAL '24 hours'
ORDER BY u.created_at DESC;

-- ========================================
-- ΒΗΜΑ 5: ΕΛΕΓΧΟΣ CONFIRMATION TOKENS
-- ========================================

-- Χρήστες με confirmation tokens (περιμένουν επιβεβαίωση)
SELECT 
    'Χρήστες με confirmation tokens:' as info,
    u.id,
    u.email,
    u.created_at,
    u.confirmation_sent_at,
    u.confirmation_token,
    EXTRACT(HOURS FROM (NOW() - u.confirmation_sent_at)) as hours_since_token_sent
FROM auth.users u
WHERE u.confirmation_token IS NOT NULL
  AND u.email_confirmed_at IS NULL
ORDER BY u.confirmation_sent_at DESC;

-- Success message
SELECT 'Έλεγχος email confirmation ολοκληρώθηκε!' as result;
