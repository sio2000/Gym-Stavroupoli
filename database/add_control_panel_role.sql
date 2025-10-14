-- Add control_panel role to user_profiles table
-- Execute this FIRST before creating the user

-- Step 1: Drop the existing check constraint
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Step 2: Add the new check constraint with control_panel role
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('user', 'trainer', 'admin', 'secretary', 'control_panel'));

-- Step 3: Verify the constraint was updated
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'user_profiles_role_check';
