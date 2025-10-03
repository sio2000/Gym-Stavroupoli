-- SIMPLE MIGRATE USERS - ΑΠΛΗ ΜΕΤΑΦΟΡΑ ΧΡΗΣΤΩΝ
-- Εξαίρεση 2 συγκεκριμένων χρηστών
-- Εκτέλεση στο Supabase SQL Editor

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

