-- 🔧 ΔΙΟΡΘΩΣΗ EMAIL CONFIRMATION ΠΡΟΒΛΗΜΑΤΟΣ
-- Εκτέλεση στο Supabase SQL Editor

-- ΒΗΜΑ 1: Επιβεβαίωση όλων των υπαρχόντων χρηστών
-- Αυτό θα επιτρέψει σε όλους τους υπάρχοντες χρήστες να συνδεθούν
UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- ΒΗΜΑ 2: Δημιουργία profile για χρήστες που δεν έχουν
-- Αυτό θα διορθώσει το foreign key constraint error
INSERT INTO public.user_profiles (
    user_id,
    email,
    first_name,
    last_name,
    role,
    language,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(au.raw_user_meta_data->>'last_name', 'User'),
    'user',
    'el',
    NOW(),
    NOW()
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE up.user_id IS NULL;

-- ΒΗΜΑ 3: Εμφάνιση στατιστικών
SELECT 
    'Επιβεβαιωμένοι χρήστες:' as status,
    COUNT(*) as count
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL;

SELECT 
    'Χρήστες με profile:' as status,
    COUNT(*) as count
FROM public.user_profiles;

-- ΒΗΜΑ 4: Εμφάνιση των τελευταίων χρηστών για έλεγχο
SELECT 
    au.id,
    au.email,
    au.email_confirmed_at,
    up.first_name,
    up.last_name,
    au.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
ORDER BY au.created_at DESC
LIMIT 10;

-- 🎯 Μήνυμα επιτυχίας
SELECT '✅ Διόρθωση ολοκληρώθηκε! Όλοι οι χρήστες μπορούν τώρα να συνδεθούν.' as message;
