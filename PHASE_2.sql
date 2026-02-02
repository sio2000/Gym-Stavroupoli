-- PHASE 2: DELETE LEAF NODES (User-specific audit and preference data)
-- Protected Accounts: admin@freegym.gr, receptiongym2025@gmail.com, mike@freegym.gr,
-- aristidis@freegym.gr, mpasaridis@freegym.gr, mposdelakidis@freegym.gr,
-- lefteris@freegym.gr, mpallas@freegym.gr, ioanna@freegym.gr, admin2new@freegym.gr

BEGIN;

DELETE FROM scan_audit_logs 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

DELETE FROM lesson_attendance 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

DELETE FROM absence_records 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

DELETE FROM referrals 
WHERE referrer_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

DELETE FROM user_kettlebell_points 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

DELETE FROM user_group_weekly_presets 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

DELETE FROM audit_logs 
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

SELECT '---PHASE 2 CHECK---' as checkpoint;
SELECT
  'scan_audit_logs' as table_name,
  COUNT(*) as remaining_rows
FROM scan_audit_logs
UNION ALL SELECT 'lesson_attendance', COUNT(*) FROM lesson_attendance
UNION ALL SELECT 'absence_records', COUNT(*) FROM absence_records
UNION ALL SELECT 'referrals', COUNT(*) FROM referrals
UNION ALL SELECT 'user_kettlebell_points', COUNT(*) FROM user_kettlebell_points
UNION ALL SELECT 'user_group_weekly_presets', COUNT(*) FROM user_group_weekly_presets
UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs;

COMMIT;
