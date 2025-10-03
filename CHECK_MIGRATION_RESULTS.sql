-- CHECK MIGRATION RESULTS - ΕΛΕΓΧΟΣ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
-- Εκτέλεση μετά τη μεταφορά χρηστών

-- Συνολικός αριθμός χρηστών στο auth.users
SELECT 
    'Total Auth Users' as description,
    COUNT(*) as count
FROM auth.users;

-- Συνολικός αριθμός προφίλ στο user_profiles
SELECT 
    'Total User Profiles' as description,
    COUNT(*) as count
FROM user_profiles;

-- Χρήστες που έχουν προφίλ
SELECT 
    'Users with profiles' as description,
    COUNT(*) as count
FROM auth.users u
INNER JOIN user_profiles up ON u.id = up.user_id;

-- Χρήστες χωρίς προφίλ (που θα έπρεπε να είναι μόνο οι 2 που εξαιρέσαμε)
SELECT 
    'Users without profiles' as description,
    u.id,
    u.email,
    u.created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL;

-- Ελέγχος ότι οι 2 εξαιρεμένοι χρήστες δεν έχουν προφίλ
SELECT 
    'Excluded users status' as description,
    u.id,
    u.email,
    CASE 
        WHEN up.user_id IS NULL THEN 'CORRECTLY EXCLUDED'
        ELSE 'ERROR: Should be excluded but has profile'
    END as status
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.id IN (
    'ba49ecaa-b20e-4880-ad45-2a440a749301',
    'fd6f30f3-989a-4494-91a3-c89a21ad7852'
)
OR u.email IN (
    'jarepih781@cnguopin.com',
    'wixaji9042@artvara.com'
);

-- Εμφάνιση όλων των προφίλ
SELECT 
    'All user profiles' as description,
    up.user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.role,
    up.created_at
FROM user_profiles up
ORDER BY up.created_at DESC;

