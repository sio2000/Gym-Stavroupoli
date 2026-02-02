-- PHASE 3: DELETE TRANSACTIONAL DATA (Bookings, payments, sessions)
-- Protected Accounts: admin@freegym.gr, receptiongym2025@gmail.com, mike@freegym.gr,
-- aristidis@freegym.gr, mpasaridis@freegym.gr, mposdelakidis@freegym.gr,
-- lefteris@freegym.gr, mpallas@freegym.gr, ioanna@freegym.gr, admin2new@freegym.gr

BEGIN;

DELETE FROM pilates_bookings 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

DELETE FROM lesson_bookings 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

DELETE FROM qr_codes 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

DELETE FROM bookings 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

DELETE FROM payments 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

DELETE FROM personal_training_codes 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

DELETE FROM group_assignments 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

DELETE FROM group_sessions 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

DELETE FROM program_approval_states 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

DELETE FROM user_cash_transactions 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

DELETE FROM user_old_members_usage 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

SELECT '---PHASE 3 CHECK---' as checkpoint;
SELECT
  'pilates_bookings' as table_name,
  COUNT(*) as remaining_rows
FROM pilates_bookings
UNION ALL SELECT 'lesson_bookings', COUNT(*) FROM lesson_bookings
UNION ALL SELECT 'qr_codes', COUNT(*) FROM qr_codes
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'personal_training_codes', COUNT(*) FROM personal_training_codes
UNION ALL SELECT 'group_assignments', COUNT(*) FROM group_assignments
UNION ALL SELECT 'group_sessions', COUNT(*) FROM group_sessions
UNION ALL SELECT 'program_approval_states', COUNT(*) FROM program_approval_states
UNION ALL SELECT 'user_cash_transactions', COUNT(*) FROM user_cash_transactions
UNION ALL SELECT 'user_old_members_usage', COUNT(*) FROM user_old_members_usage;

COMMIT;
