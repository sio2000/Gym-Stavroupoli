-- Create subscriptions for all 30 test bots with different packages and durations

-- PILATES Package
INSERT INTO subscriptions (id, user_id, package_id, status, start_date, end_date, created_at, updated_at) 
SELECT 
  gen_random_uuid() as id,
  u.id as user_id,
  'pilates' as package_id,
  'active' as status,
  CURRENT_DATE as start_date,
  CURRENT_DATE + INTERVAL '7 days' as end_date,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users u
WHERE u.email LIKE 'qa.bot+%@example.com'
LIMIT 30;

-- PILATES - 14 days
INSERT INTO subscriptions (id, user_id, package_id, status, start_date, end_date, created_at, updated_at) 
SELECT 
  gen_random_uuid() as id,
  u.id as user_id,
  'pilates' as package_id,
  'active' as status,
  CURRENT_DATE as start_date,
  CURRENT_DATE + INTERVAL '14 days' as end_date,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users u
WHERE u.email LIKE 'qa.bot+%@example.com'
LIMIT 30;

-- ULTIMATE Package - 7 days
INSERT INTO subscriptions (id, user_id, package_id, status, start_date, end_date, created_at, updated_at) 
SELECT 
  gen_random_uuid() as id,
  u.id as user_id,
  'ultimate' as package_id,
  'active' as status,
  CURRENT_DATE as start_date,
  CURRENT_DATE + INTERVAL '7 days' as end_date,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users u
WHERE u.email LIKE 'qa.bot+%@example.com'
LIMIT 30;

-- ULTIMATE - 30 days
INSERT INTO subscriptions (id, user_id, package_id, status, start_date, end_date, created_at, updated_at) 
SELECT 
  gen_random_uuid() as id,
  u.id as user_id,
  'ultimate' as package_id,
  'active' as status,
  CURRENT_DATE as start_date,
  CURRENT_DATE + INTERVAL '30 days' as end_date,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users u
WHERE u.email LIKE 'qa.bot+%@example.com'
LIMIT 30;

-- FREEGYM Package
INSERT INTO subscriptions (id, user_id, package_id, status, start_date, end_date, created_at, updated_at) 
SELECT 
  gen_random_uuid() as id,
  u.id as user_id,
  'freegym' as package_id,
  'active' as status,
  CURRENT_DATE as start_date,
  CURRENT_DATE + INTERVAL '90 days' as end_date,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users u
WHERE u.email LIKE 'qa.bot+%@example.com'
LIMIT 30;

-- ULTIMATE_MEDIUM - 30 days
INSERT INTO subscriptions (id, user_id, package_id, status, start_date, end_date, created_at, updated_at) 
SELECT 
  gen_random_uuid() as id,
  u.id as user_id,
  'ultimate_medium' as package_id,
  'active' as status,
  CURRENT_DATE as start_date,
  CURRENT_DATE + INTERVAL '30 days' as end_date,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users u
WHERE u.email LIKE 'qa.bot+%@example.com'
LIMIT 30;

-- Verify the subscriptions were created
SELECT 
  COUNT(*) as total_subscriptions,
  u.email,
  s.package_id,
  s.start_date,
  s.end_date
FROM subscriptions s
JOIN auth.users u ON s.user_id = u.id
WHERE u.email LIKE 'qa.bot+%@example.com'
GROUP BY u.email, s.package_id, s.start_date, s.end_date
ORDER BY u.email;
