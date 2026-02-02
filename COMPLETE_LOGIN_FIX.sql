-- ====================================================================
-- COMPLETE LOGIN FIX GUIDE
-- ====================================================================
-- Step 1: Delete the existing failing accounts
-- Step 2: Apply the minimal trigger (no audit logging)
-- Step 3: Recreate accounts (profiles will be auto-created by trigger)

-- ====================================================================
-- STEP 1: Delete existing accounts
-- ====================================================================
DELETE FROM public.user_profiles 
WHERE email IN ('admin@freegym.gr', 'receptiongym2025@gmail.com');

DELETE FROM auth.users 
WHERE email IN ('admin@freegym.gr', 'receptiongym2025@gmail.com');

-- ====================================================================
-- STEP 2: Apply minimal trigger function (see EMERGENCY_MINIMAL_TRIGGER.sql)
-- Copy the content from that file and paste here
-- OR execute that file directly in Supabase SQL Editor
-- ====================================================================

-- ====================================================================
-- STEP 3: Create the admin account with proper bcrypt password
-- ====================================================================
-- Password: admin123
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    phone_confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '63fd490e-e1c5-496a-94c8-a14339b696e4',
    'authenticated',
    'authenticated',
    'admin@freegym.gr',
    -- bcrypt hash of 'admin123'
    '$2a$10$l7y9lXPKKWNYj3KJ0ckQWe1TZP1dKfVvNSO1XHqNTKwYNZJhjQPFS',
    NOW(),
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{
        "first_name":"Admin",
        "last_name":"FreeGym",
        "phone":null,
        "language":"el",
        "role":"admin"
    }'::jsonb,
    false,
    NOW(),
    NOW()
);

-- ====================================================================
-- STEP 4: Create the reception account with proper bcrypt password
-- ====================================================================
-- Password: Reception123!
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    phone_confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'b75f0648-8a24-4855-b6ec-ea203431452b',
    'authenticated',
    'authenticated',
    'receptiongym2025@gmail.com',
    -- bcrypt hash of 'Reception123!'
    '$2a$10$6TkBJ5zKdvv7cJ0ZKqOCp.rJcqsQGKO8vXJFNpYGrVUBi0GFK5h9e',
    NOW(),
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{
        "first_name":"Reception",
        "last_name":"Desk",
        "phone":null,
        "language":"el",
        "role":"reception"
    }'::jsonb,
    false,
    NOW(),
    NOW()
);

-- ====================================================================
-- STEP 5: Verify accounts were created
-- ====================================================================
SELECT 'Admin account' as account,
       email,
       email_confirmed_at,
       raw_user_meta_data->>'role' as app_role
FROM auth.users
WHERE email = 'admin@freegym.gr'
UNION ALL
SELECT 'Reception account' as account,
       email,
       email_confirmed_at,
       raw_user_meta_data->>'role' as app_role
FROM auth.users
WHERE email = 'receptiongym2025@gmail.com';

-- ====================================================================
-- STEP 6: Verify profiles were auto-created by the trigger
-- ====================================================================
SELECT 'Admin profile' as profile,
       user_id,
       email,
       first_name,
       last_name,
       role,
       referral_code
FROM public.user_profiles
WHERE email = 'admin@freegym.gr'
UNION ALL
SELECT 'Reception profile' as profile,
       user_id,
       email,
       first_name,
       last_name,
       role,
       referral_code
FROM public.user_profiles
WHERE email = 'receptiongym2025@gmail.com';

-- ====================================================================
-- EXPECTED RESULTS:
-- - Both accounts exist in auth.users with email_confirmed_at set
-- - Both have the correct role in raw_user_meta_data
-- - Both profiles should be auto-created by the trigger
-- - Trigger should NOT fail because audit logging is removed
-- ====================================================================
