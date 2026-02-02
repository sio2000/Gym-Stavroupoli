-- Check the three users in detail
SELECT 
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  phone_confirmed_at,
  last_sign_in_at,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data,
  is_sso_user,
  created_at,
  updated_at,
  deleted_at
FROM auth.users 
WHERE email IN ('paxexi5763@arqsis.com', 'admin@freegym.gr', 'receptiongym2025@gmail.com')
ORDER BY email;
