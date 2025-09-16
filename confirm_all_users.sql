-- ΕΠΙΒΕΒΑΙΩΣΗ ΟΛΩΝ ΤΩΝ ΧΡΗΣΤΩΝ
-- Εκτέλεση στο Supabase SQL Editor

-- Επιβεβαίωση όλων των υπαρχόντων χρηστών που δεν έχουν επιβεβαιώσει το email
UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Εμφάνιση αποτελεσμάτων
SELECT 
    'Επιβεβαιωμένοι χρήστες:' as status,
    COUNT(*) as count
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL;

-- Εμφάνιση μη επιβεβαιωμένων χρήστες (αν υπάρχουν)
SELECT 
    'Μη επιβεβαιωμένοι χρήστες:' as status,
    COUNT(*) as count
FROM auth.users 
WHERE email_confirmed_at IS NULL;

-- Εμφάνιση όλων των χρηστών
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;
