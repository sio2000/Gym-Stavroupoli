-- Check existing users
SELECT id, email, role, full_name, created_at
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 10;
