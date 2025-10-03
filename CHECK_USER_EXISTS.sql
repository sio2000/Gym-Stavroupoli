-- ΕΛΕΓΧΟΣ ΥΠΑΡΞΗΣ ΧΡΗΣΤΗ
-- Ελέγχουμε αν ο χρήστης υπάρχει ήδη

-- Έλεγχος στο auth.users
SELECT 
    'AUTH USERS CHECK' as table_name,
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE id = '4f9640fa-3ffe-4a17-ab2c-36cb570cb085';

-- Έλεγχος στο user_profiles
SELECT 
    'USER PROFILES CHECK' as table_name,
    user_id,
    first_name,
    last_name,
    email,
    role,
    created_at
FROM public.user_profiles 
WHERE user_id = '4f9640fa-3ffe-4a17-ab2c-36cb570cb085';
