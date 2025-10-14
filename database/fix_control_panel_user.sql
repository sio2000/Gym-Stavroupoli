-- Fix Control Panel User Authentication
-- Execute this in Supabase SQL Editor

-- Step 1: Delete existing control panel user if exists
DELETE FROM public.user_profiles WHERE email = 'control@getfitskg.com';
DELETE FROM auth.users WHERE email = 'control@getfitskg.com';

-- Step 2: Create user in auth.users with proper structure
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
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
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'control@getfitskg.com',
  crypt('controlpanel123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Control Panel User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Step 3: Create user profile with proper structure
INSERT INTO public.user_profiles (
  id,
  user_id,
  email,
  role,
  created_at,
  updated_at
)
SELECT 
  u.id,
  u.id,
  u.email,
  'control_panel',
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'control@getfitskg.com';

-- Step 4: Verify the user was created correctly
SELECT 
  'Auth User' as type,
  u.id,
  u.email,
  u.role,
  u.email_confirmed_at,
  u.created_at
FROM auth.users u
WHERE u.email = 'control@getfitskg.com'

UNION ALL

SELECT 
  'Profile' as type,
  up.id,
  up.email,
  up.role,
  NULL as email_confirmed_at,
  up.created_at
FROM public.user_profiles up
WHERE up.email = 'control@getfitskg.com';
