-- Make a user secretary
-- Replace 'receptiongym2025@gmail.com' with the actual email you used

UPDATE user_profiles 
SET role = 'secretary' 
WHERE email = 'receptiongym2025@gmail.com';

-- Verify the change
SELECT id, email, role, first_name, last_name 
FROM user_profiles 
WHERE email = 'receptiongym2025@gmail.com';
