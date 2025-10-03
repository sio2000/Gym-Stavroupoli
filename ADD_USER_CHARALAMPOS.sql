-- ΠΡΟΣΘΕΣΗ ΧΡΗΣΤΗ ΧΑΡΑΛΑΜΠΟΣ ΧΑΡΙΠΙΔΗΣ
-- Εκτέλεση στο Supabase SQL Editor

-- Δημιουργία χρήστη στο auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '4f9640fa-3ffe-4a17-ab2c-36cb570cb085', -- Το UID που δόθηκε
    'authenticated',
    'authenticated',
    'xarismanx@gmail.com',
    crypt('temp123456', gen_salt('bf')), -- Προσωρινός κωδικός
    NOW(),
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "ΧΑΡΑΛΑΜΠΟΣ", "last_name": "ΧΑΡΙΠΙΔΗΣ"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- Δημιουργία προφίλ χρήστη στο user_profiles
INSERT INTO public.user_profiles (
    user_id,
    first_name,
    last_name,
    email,
    role,
    language,
    notification_preferences,
    created_at,
    updated_at
) VALUES (
    '4f9640fa-3ffe-4a17-ab2c-36cb570cb085',
    'ΧΑΡΑΛΑΜΠΟΣ',
    'ΧΑΡΙΠΙΔΗΣ',
    'xarismanx@gmail.com',
    'user',
    'el',
    '{"sms": false, "push": true, "email": true}',
    NOW(),
    NOW()
);

-- Επαλήθευση ότι ο χρήστης δημιουργήθηκε σωστά
SELECT 
    'ΧΡΗΣΤΗΣ ΔΗΜΙΟΥΡΓΗΘΗΚΕ ΕΠΙΤΥΧΩΣ!' as message,
    u.email as email,
    'temp123456' as temporary_password,
    up.first_name,
    up.last_name,
    up.role,
    up.language,
    'Ο χρήστης πρέπει να αλλάξει τον κωδικό του στο πρώτο login' as instruction
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.id = '4f9640fa-3ffe-4a17-ab2c-36cb570cb085';
