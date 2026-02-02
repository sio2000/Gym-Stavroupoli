-- PHASE 4: DELETE SUBSCRIPTION DATA (Memberships and deposits)
-- Protected Accounts: admin@freegym.gr, receptiongym2025@gmail.com, mike@freegym.gr,
-- aristidis@freegym.gr, mpasaridis@freegym.gr, mposdelakidis@freegym.gr,
-- lefteris@freegym.gr, mpallas@freegym.gr, ioanna@freegym.gr, admin2new@freegym.gr

BEGIN;

DELETE FROM membership_requests 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

DELETE FROM memberships 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

DELETE FROM pilates_deposits 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

DELETE FROM membership_logs 
WHERE membership_id IN (
  SELECT id FROM memberships 
  WHERE user_id NOT IN (
    SELECT id FROM auth.users 
    WHERE email IN (
      'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
      'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
      'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
    )
  )
);

SELECT '---PHASE 4 CHECK---' as checkpoint;
SELECT
  'membership_requests' as table_name,
  COUNT(*) as remaining_rows
FROM membership_requests
UNION ALL SELECT 'memberships', COUNT(*) FROM memberships
UNION ALL SELECT 'pilates_deposits', COUNT(*) FROM pilates_deposits
UNION ALL SELECT 'membership_logs', COUNT(*) FROM membership_logs;

COMMIT;
