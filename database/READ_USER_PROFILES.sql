-- Διάβασμα ολόκληρου του πίνακα user_profiles
SELECT 
    id,
    user_id,
    email,
    first_name,
    last_name,
    phone,
    created_at,
    updated_at
FROM user_profiles 
ORDER BY created_at;

-- Εμφάνιση στατιστικών
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN email LIKE '%test%' THEN 1 END) as test_emails,
    COUNT(CASE WHEN first_name LIKE '%test%' OR first_name IS NULL OR first_name = '' THEN 1 END) as invalid_first_names,
    COUNT(CASE WHEN last_name LIKE '%test%' OR last_name IS NULL OR last_name = '' THEN 1 END) as invalid_last_names,
    COUNT(CASE WHEN phone LIKE '%test%' OR phone IS NULL OR phone = '' THEN 1 END) as invalid_phones
FROM user_profiles;
