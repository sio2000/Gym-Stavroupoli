-- Ultra Simple Control Panel User Creation
-- Execute this in Supabase SQL Editor

-- Step 1: Create user in auth.users (only if not exists)
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

-- Step 2: Create user profile (only if not exists)
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

-- Step 3: Verify the user was created
SELECT 
  u.id,
  u.email,
  up.role,
  u.created_at
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE u.email = 'control@getfitskg.com';
