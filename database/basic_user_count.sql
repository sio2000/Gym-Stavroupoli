-- ΒΑΣΙΚΟΣ ΕΛΕΓΧΟΣ ΑΡΙΘΜΩΝ ΧΡΗΣΤΩΝ
-- Εκτέλεση στο Supabase SQL Editor

-- Αριθμός χρηστών στον auth.users
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- Αριθμός χρηστών στον user_profiles  
SELECT COUNT(*) as user_profiles_count FROM user_profiles;

-- Χρήστες που λείπουν από user_profiles
SELECT COUNT(*) as missing_users_count 
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL;

-- Εμφάνιση των πρώτων 5 χρηστών από auth.users
SELECT 
    id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Εμφάνιση των πρώτων 5 χρηστών από user_profiles
SELECT 
    user_id,
    first_name,
    last_name,
    email,
    created_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;
