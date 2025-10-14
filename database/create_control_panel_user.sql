-- Create Control Panel User
-- This script creates a new user with control_panel role for accessing the Control Panel

-- Insert into auth.users (Supabase Auth)
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
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'control@getfitskg.com', -- Change this email as needed
  crypt('controlpanel123', gen_salt('bf')), -- Change this password as needed
  NOW(),
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Control Panel User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Get the user ID that was just created
DO $$
DECLARE
    control_user_id UUID;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO control_user_id 
    FROM auth.users 
    WHERE email = 'control@getfitskg.com'
    LIMIT 1;
    
    -- Insert into user_profiles
    INSERT INTO public.user_profiles (
        id,
        email,
        role,
        created_at,
        updated_at
    ) VALUES (
        control_user_id,
        'control@getfitskg.com',
        'control_panel',
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        role = 'control_panel',
        updated_at = NOW();
    
    -- Grant necessary permissions for control panel user
    -- Allow access to membership packages
    INSERT INTO public.membership_packages_policies (
        id,
        role,
        operation,
        policy_name,
        definition,
        check_expression
    ) VALUES (
        gen_random_uuid(),
        'control_panel',
        'SELECT',
        'control_panel_select_membership_packages',
        'true',
        'true'
    ) ON CONFLICT (policy_name) DO NOTHING;
    
    INSERT INTO public.membership_packages_policies (
        id,
        role,
        operation,
        policy_name,
        definition,
        check_expression
    ) VALUES (
        gen_random_uuid(),
        'control_panel',
        'UPDATE',
        'control_panel_update_membership_packages',
        'true',
        'true'
    ) ON CONFLICT (policy_name) DO NOTHING;
    
    -- Allow access to membership package durations
    INSERT INTO public.membership_package_durations_policies (
        id,
        role,
        operation,
        policy_name,
        definition,
        check_expression
    ) VALUES (
        gen_random_uuid(),
        'control_panel',
        'SELECT',
        'control_panel_select_durations',
        'true',
        'true'
    ) ON CONFLICT (policy_name) DO NOTHING;
    
    INSERT INTO public.membership_package_durations_policies (
        id,
        role,
        operation,
        policy_name,
        definition,
        check_expression
    ) VALUES (
        gen_random_uuid(),
        'control_panel',
        'UPDATE',
        'control_panel_update_durations',
        'true',
        'true'
    ) ON CONFLICT (policy_name) DO NOTHING;
    
    -- Allow access to membership requests
    INSERT INTO public.membership_requests_policies (
        id,
        role,
        operation,
        policy_name,
        definition,
        check_expression
    ) VALUES (
        gen_random_uuid(),
        'control_panel',
        'SELECT',
        'control_panel_select_requests',
        'true',
        'true'
    ) ON CONFLICT (policy_name) DO NOTHING;
    
    INSERT INTO public.membership_requests_policies (
        id,
        role,
        operation,
        policy_name,
        definition,
        check_expression
    ) VALUES (
        gen_random_uuid(),
        'control_panel',
        'UPDATE',
        'control_panel_update_requests',
        'true',
        'true'
    ) ON CONFLICT (policy_name) DO NOTHING;
    
    -- Allow access to cash transactions
    INSERT INTO public.cash_transactions_policies (
        id,
        role,
        operation,
        policy_name,
        definition,
        check_expression
    ) VALUES (
        gen_random_uuid(),
        'control_panel',
        'SELECT',
        'control_panel_select_cash',
        'true',
        'true'
    ) ON CONFLICT (policy_name) DO NOTHING;
    
    INSERT INTO public.cash_transactions_policies (
        id,
        role,
        operation,
        policy_name,
        definition,
        check_expression
    ) VALUES (
        gen_random_uuid(),
        'control_panel',
        'INSERT',
        'control_panel_insert_cash',
        'true',
        'true'
    ) ON CONFLICT (policy_name) DO NOTHING;
    
    -- Allow access to user profiles (for users information tab)
    INSERT INTO public.user_profiles_policies (
        id,
        role,
        operation,
        policy_name,
        definition,
        check_expression
    ) VALUES (
        gen_random_uuid(),
        'control_panel',
        'SELECT',
        'control_panel_select_users',
        'true',
        'true'
    ) ON CONFLICT (policy_name) DO NOTHING;
    
    -- Allow access to Pilates schedules
    INSERT INTO public.pilates_schedules_policies (
        id,
        role,
        operation,
        policy_name,
        definition,
        check_expression
    ) VALUES (
        gen_random_uuid(),
        'control_panel',
        'SELECT',
        'control_panel_select_pilates',
        'true',
        'true'
    ) ON CONFLICT (policy_name) DO NOTHING;
    
    INSERT INTO public.pilates_schedules_policies (
        id,
        role,
        operation,
        policy_name,
        definition,
        check_expression
    ) VALUES (
        gen_random_uuid(),
        'control_panel',
        'INSERT',
        'control_panel_insert_pilates',
        'true',
        'true'
    ) ON CONFLICT (policy_name) DO NOTHING;
    
    INSERT INTO public.pilates_schedules_policies (
        id,
        role,
        operation,
        policy_name,
        definition,
        check_expression
    ) VALUES (
        gen_random_uuid(),
        'control_panel',
        'UPDATE',
        'control_panel_update_pilates',
        'true',
        'true'
    ) ON CONFLICT (policy_name) DO NOTHING;
    
    INSERT INTO public.pilates_schedules_policies (
        id,
        role,
        operation,
        policy_name,
        definition,
        check_expression
    ) VALUES (
        gen_random_uuid(),
        'control_panel',
        'DELETE',
        'control_panel_delete_pilates',
        'true',
        'true'
    ) ON CONFLICT (policy_name) DO NOTHING;
    
    RAISE NOTICE 'Control Panel user created successfully with ID: %', control_user_id;
    
END $$;

-- Display the created user information
SELECT 
    u.id,
    u.email,
    up.role,
    u.created_at
FROM auth.users u
JOIN public.user_profiles up ON u.id = up.id
WHERE u.email = 'control@getfitskg.com';
