-- Update Control Panel User Role
-- Execute this after creating user via Supabase Dashboard

-- Update the user profile role to control_panel
UPDATE public.user_profiles 
SET role = 'control_panel', updated_at = NOW()
WHERE email = 'control@getfitskg.com';

-- Verify the update
SELECT 
  up.id,
  up.email,
  up.role,
  up.updated_at
FROM public.user_profiles up
WHERE up.email = 'control@getfitskg.com';
