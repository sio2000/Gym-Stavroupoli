-- Complete Control Panel Setup
-- Execute this script step by step in Supabase SQL Editor

-- Step 1: Update user_profiles role constraint to include control_panel
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('user', 'trainer', 'admin', 'secretary', 'control_panel'));

-- Step 2: Create user in auth.users (only if not exists)
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
  updated_at
) 
SELECT 
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
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'control@getfitskg.com'
);

-- Step 3: Create user profile (only if not exists)
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
WHERE u.email = 'control@getfitskg.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_profiles WHERE id = u.id
);

-- Step 4: Verify the setup
SELECT 
  'User Created' as status,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
WHERE u.email = 'control@getfitskg.com'

UNION ALL

SELECT 
  'Profile Created' as status,
  up.id,
  up.email,
  up.created_at
FROM public.user_profiles up
WHERE up.email = 'control@getfitskg.com';
