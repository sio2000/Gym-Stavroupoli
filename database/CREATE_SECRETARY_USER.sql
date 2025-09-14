-- Create Secretary User
-- This script creates a secretary user for testing the QR scanner

-- First, let's check if we have any existing users
SELECT id, email, role FROM user_profiles WHERE role = 'secretary';

-- If no secretary exists, we'll create one
-- Note: You'll need to create this user through the normal signup process
-- and then update their role to 'secretary'

-- Update an existing user to secretary role (replace with actual user ID)
-- UPDATE user_profiles SET role = 'secretary' WHERE id = 'YOUR_USER_ID_HERE';

-- Or create a test secretary user (you'll need to sign up first)
-- After signup, run this to make them a secretary:
-- UPDATE user_profiles SET role = 'secretary' WHERE email = 'secretary@test.com';

-- Check the result
SELECT id, email, role FROM user_profiles WHERE role = 'secretary';
