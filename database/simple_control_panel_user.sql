-- Simple Control Panel User Creation
-- Execute this in Supabase SQL Editor

-- First, check if user already exists
DO $$
DECLARE
    user_exists BOOLEAN;
    user_id UUID;
BEGIN
    -- Check if user already exists
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE email = 'control@getfitskg.com'
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        -- Create the user in auth.users
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
        
        RAISE NOTICE 'User created successfully';
    ELSE
        RAISE NOTICE 'User already exists';
    END IF;
    
    -- Get the user ID
    SELECT id INTO user_id FROM auth.users WHERE email = 'control@getfitskg.com';
    
    RAISE NOTICE 'User ID: %', user_id;
END $$;

-- Then create the user profile
INSERT INTO public.user_profiles (
  id,
  email,
  role,
  created_at,
  updated_at
) 
SELECT 
  u.id,
  u.email,
  'control_panel',
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'control@getfitskg.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'control_panel',
  updated_at = NOW();

-- Alternative method if the above doesn't work
DO $$
DECLARE
    user_id UUID;
    profile_exists BOOLEAN;
BEGIN
    -- Get user ID
    SELECT id INTO user_id FROM auth.users WHERE email = 'control@getfitskg.com';
    
    IF user_id IS NOT NULL THEN
        -- Check if profile exists
        SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = user_id) INTO profile_exists;
        
        IF NOT profile_exists THEN
            -- Create profile
            INSERT INTO public.user_profiles (id, email, role, created_at, updated_at)
            VALUES (user_id, 'control@getfitskg.com', 'control_panel', NOW(), NOW());
            RAISE NOTICE 'Profile created successfully';
        ELSE
            -- Update existing profile
            UPDATE public.user_profiles 
            SET role = 'control_panel', updated_at = NOW()
            WHERE id = user_id;
            RAISE NOTICE 'Profile updated successfully';
        END IF;
    END IF;
END $$;

-- Verify the user was created
SELECT 
  u.id,
  u.email,
  up.role,
  u.created_at
FROM auth.users u
JOIN public.user_profiles up ON u.id = up.id
WHERE u.email = 'control@getfitskg.com';
