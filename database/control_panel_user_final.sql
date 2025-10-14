-- Final Control Panel User Creation
-- Execute this step by step in Supabase SQL Editor

-- Step 1: Create user in auth.users
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
  NOW()
);

-- Step 2: Get the user ID and create profile
DO $$
DECLARE
    control_user_id UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO control_user_id 
    FROM auth.users 
    WHERE email = 'control@getfitskg.com';
    
    -- Insert into user_profiles
    INSERT INTO public.user_profiles (
        id,
        user_id,
        email,
        role,
        created_at,
        updated_at
    ) VALUES (
        control_user_id,
        control_user_id,
        'control@getfitskg.com',
        'control_panel',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Control Panel user created with ID: %', control_user_id;
END $$;

-- Step 3: Verify creation
SELECT 
    u.id,
    u.email,
    up.role,
    u.created_at
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE u.email = 'control@getfitskg.com';
