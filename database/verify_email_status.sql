-- ΕΠΑΛΗΘΕΥΣΗ EMAIL CONFIRMATION STATUS
-- Εκτέλεση στο Supabase SQL Editor

-- ========================================
-- ΒΑΣΙΚΟΣ ΕΛΕΓΧΟΣ
-- ========================================

-- Συνολικοί χρήστες
SELECT 
    'Συνολικοί χρήστες' as description,
    COUNT(*) as count
FROM auth.users;

-- Χρήστες με email confirmation
SELECT 
    'Χρήστες με email confirmation' as description,
    COUNT(*) as count
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL;

-- Χρήστες χωρίς email confirmation
SELECT 
    'Χρήστες χωρίς email confirmation' as description,
    COUNT(*) as count
FROM auth.users 
WHERE email_confirmed_at IS NULL;

-- ========================================
-- ΛΕΠΤΟΜΕΡΕΙΕΣ
-- ========================================

-- Όλοι οι χρήστες με το status τους
SELECT 
    'Όλοι οι χρήστες με email status:' as info,
    u.id,
    u.email,
    u.created_at,
    u.email_confirmed_at,
    CASE 
        WHEN u.email_confirmed_at IS NOT NULL THEN 'Επιβεβαιωμένο ✓'
        ELSE 'Μη επιβεβαιωμένο ✗'
    END as email_status
FROM auth.users u
ORDER BY u.created_at DESC;

-- ========================================
-- ΣΤΑΤΙΣΤΙΚΑ
-- ========================================

-- Ποσοστό επιβεβαίωσης
SELECT 
    'Ποσοστό επιβεβαίωσης:' as info,
    ROUND(
        (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) * 100.0 / 
        (SELECT COUNT(*) FROM auth.users), 2
    ) as confirmation_percentage;

-- Success message
SELECT 'Επαλήθευση ολοκληρώθηκε!' as result;
