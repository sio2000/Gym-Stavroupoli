-- ΓΡΗΓΟΡΗ ΕΠΑΛΗΘΕΥΣΗ ΜΕΤΑΦΟΡΑΣ
-- Απλή εμφάνιση των αποτελεσμάτων
-- Εκτέλεση στο Supabase SQL Editor

-- ========================================
-- ΓΡΗΓΟΡΟΣ ΕΛΕΓΧΟΣ
-- ========================================

-- Συνολικοί αριθμοί
SELECT 
    'Auth Users' as table_name,
    COUNT(*) as count
FROM auth.users;

SELECT 
    'User Profiles' as table_name,
    COUNT(*) as count
FROM user_profiles;

-- Χρήστες που εξακολουθούν να λείπουν
SELECT 
    'Missing Users' as issue,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL;

-- ========================================
-- ΝΕΟΙ ΧΡΗΣΤΕΣ (ΠΡΟΣΦΑΤΟΙ)
-- ========================================

-- Χρήστες που προστέθηκαν τις τελευταίες 2 ώρες
SELECT 
    'Recently Added Users:' as info,
    up.user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.role,
    up.created_at
FROM user_profiles up
WHERE up.created_at > NOW() - INTERVAL '2 hours'
ORDER BY up.created_at DESC;

-- ========================================
-- ΣΥΝΟΛΙΚΗ ΛΙΣΤΑ ΧΡΗΣΤΩΝ
-- ========================================

-- Όλοι οι χρήστες με τα στοιχεία τους
SELECT 
    'All Users with Profiles:' as info,
    up.user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.role,
    up.language,
    up.created_at
FROM user_profiles up
ORDER BY up.created_at DESC;

-- Success message
SELECT 'Verification completed!' as result;
