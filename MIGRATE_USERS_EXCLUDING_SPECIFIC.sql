-- MIGRATE USERS FROM AUTH.USERS TO USER_PROFILES
-- Εξαίρεση 2 συγκεκριμένων χρηστών
-- Εκτέλεση στο Supabase SQL Editor

-- Πρώτα, ας ελέγξουμε πόσους χρήστες έχουμε
SELECT 
    'Total Auth Users' as description,
    COUNT(*) as count
FROM auth.users;

-- Ελέγχος χρηστών που έχουν ήδη προφίλ
SELECT 
    'Users with existing profiles' as description,
    COUNT(*) as count
FROM auth.users u
INNER JOIN user_profiles up ON u.id = up.user_id;

-- Ελέγχος χρηστών χωρίς προφίλ
SELECT 
    'Users without profiles' as description,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL;

-- Εμφάνιση των 2 χρηστών που θα εξαιρεθούν
SELECT 
    'Users to be excluded' as description,
    u.id,
    u.email,
    u.created_at
FROM auth.users u
WHERE u.id IN (
    'ba49ecaa-b20e-4880-ad45-2a440a749301',
    'fd6f30f3-989a-4494-91a3-c89a21ad7852'
)
OR u.email IN (
    'jarepih781@cnguopin.com',
    'wixaji9042@artvara.com'
);

-- Κύρια εντολή μεταφοράς χρηστών
-- Μεταφορά όλων των χρηστών από auth.users σε user_profiles
-- Εξαίρεση των 2 συγκεκριμένων χρηστών
INSERT INTO user_profiles (
    user_id,
    first_name,
    last_name,
    email,
    phone,
    role,
    language,
    notification_preferences,
    created_at,
    updated_at
)
SELECT 
    u.id as user_id,
    COALESCE(u.raw_user_meta_data->>'first_name', '') as first_name,
    COALESCE(u.raw_user_meta_data->>'last_name', '') as last_name,
    u.email,
    COALESCE(u.raw_user_meta_data->>'phone', NULL) as phone,
    COALESCE(u.raw_user_meta_data->>'role', 'user') as role,
    COALESCE(u.raw_user_meta_data->>'language', 'el') as language,
    COALESCE(
        u.raw_user_meta_data->'notification_preferences',
        '{"sms": false, "push": true, "email": true}'::jsonb
    ) as notification_preferences,
    u.created_at,
    u.updated_at
FROM auth.users u
WHERE u.id NOT IN (
    'ba49ecaa-b20e-4880-ad45-2a440a749301',
    'fd6f30f3-989a-4494-91a3-c89a21ad7852'
)
AND u.email NOT IN (
    'jarepih781@cnguopin.com',
    'wixaji9042@artvara.com'
)
AND NOT EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Επαλήθευση αποτελεσμάτων
SELECT 
    'Migration completed' as status,
    COUNT(*) as total_profiles_after
FROM user_profiles;

-- Εμφάνιση όλων των προφίλ μετά τη μεταφορά
SELECT 
    up.user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.role,
    up.created_at
FROM user_profiles up
ORDER BY up.created_at DESC;

-- Ελέγχος ότι οι 2 χρήστες δεν μεταφέρθηκαν
SELECT 
    'Excluded users check' as description,
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCCESS: Excluded users not found in user_profiles'
        ELSE 'WARNING: Some excluded users found in user_profiles'
    END as result
FROM user_profiles up
WHERE up.user_id IN (
    'ba49ecaa-b20e-4880-ad45-2a440a749301',
    'fd6f30f3-989a-4494-91a3-c89a21ad7852'
)
OR up.email IN (
    'jarepih781@cnguopin.com',
    'wixaji9042@artvara.com'
);

-- Τελικό μήνυμα επιτυχίας
SELECT 'Migration completed successfully! All users transferred except the 2 specified users.' as message;

