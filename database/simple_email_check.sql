-- ΑΠΛΟΣ ΕΛΕΓΧΟΣ EMAIL CONFIRMATION
-- Εκτέλεση στο Supabase SQL Editor

-- ========================================
-- ΒΑΣΙΚΟΣ ΕΛΕΓΧΟΣ
-- ========================================

-- Συνολικοί χρήστες
SELECT COUNT(*) as total_users FROM auth.users;

-- Χρήστες που έχουν επιβεβαιώσει το email
SELECT COUNT(*) as confirmed_users 
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL;

-- Χρήστες που ΔΕΝ έχουν επιβεβαιώσει το email
SELECT COUNT(*) as unconfirmed_users 
FROM auth.users 
WHERE email_confirmed_at IS NULL;

-- ========================================
-- ΧΡΗΣΤΕΣ ΧΩΡΙΣ EMAIL CONFIRMATION
-- ========================================

-- Λίστα χρηστών που δεν έχουν επιβεβαιώσει το email
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    confirmation_sent_at
FROM auth.users 
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- ========================================
-- ΣΤΑΤΙΣΤΙΚΑ
-- ========================================

-- Ποσοστό επιβεβαίωσης
SELECT 
    ROUND(
        (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) * 100.0 / 
        (SELECT COUNT(*) FROM auth.users), 2
    ) as confirmation_percentage;

-- Success message
SELECT 'Έλεγχος ολοκληρώθηκε!' as result;
