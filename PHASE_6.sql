-- PHASE 6: POST-DELETION VERIFICATION
-- Verifies successful deletion while preserving protected accounts
-- Protected Accounts: admin@freegym.gr, receptiongym2025@gmail.com, mike@freegym.gr,
-- aristidis@freegym.gr, mpasaridis@freegym.gr, mposdelakidis@freegym.gr,
-- lefteris@freegym.gr, mpallas@freegym.gr, ioanna@freegym.gr, admin2new@freegym.gr

SELECT 'PHASE 6: POST-DELETION VERIFICATION' as phase_marker;

SELECT 'USER-GENERATED DATA VERIFICATION (Should be empty or only protected users):' as check_type;
SELECT
  'user_profiles' as table_name,
  COUNT(*) as remaining_rows,
  CASE WHEN COUNT(*) <= 10 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM user_profiles
WHERE id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
)
UNION ALL SELECT
  'memberships',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM memberships
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
)
UNION ALL SELECT
  'membership_requests',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM membership_requests
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
)
UNION ALL SELECT
  'pilates_deposits',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM pilates_deposits
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
)
UNION ALL SELECT
  'pilates_bookings',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM pilates_bookings
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
)
UNION ALL SELECT
  'lesson_bookings',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM lesson_bookings
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
)
UNION ALL SELECT
  'lesson_attendance',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM lesson_attendance
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
)
UNION ALL SELECT
  'bookings',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM bookings
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
)
UNION ALL SELECT
  'qr_codes',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM qr_codes
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
)
UNION ALL SELECT
  'scan_audit_logs',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM scan_audit_logs
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
)
UNION ALL SELECT
  'payments',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM payments
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
)
UNION ALL SELECT
  'absence_records',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM absence_records
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
)
UNION ALL SELECT
  'referrals',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM referrals
WHERE referrer_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
)
UNION ALL SELECT
  'user_kettlebell_points',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM user_kettlebell_points
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
)
UNION ALL SELECT
  'user_group_weekly_presets',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM user_group_weekly_presets
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
)
UNION ALL SELECT
  'audit_logs',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM audit_logs
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
)
UNION ALL SELECT
  'personal_training_codes',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM personal_training_codes
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
)
UNION ALL SELECT
  'personal_training_schedules',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM personal_training_schedules
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
)
UNION ALL SELECT
  'group_assignments',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM group_assignments
WHERE user_id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
)
UNION ALL SELECT
  'membership_logs',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM membership_logs
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
)
ORDER BY remaining_rows DESC;

SELECT '' as separator;
SELECT 'PROTECTED ACCOUNTS VERIFICATION (Should be intact):' as check_type;
SELECT
  'Protected Admin/Trainer Accounts' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) = 10 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM auth.users
WHERE email IN (
  'admin@freegym.gr',
  'receptiongym2025@gmail.com',
  'mike@freegym.gr',
  'aristidis@freegym.gr',
  'mpasaridis@freegym.gr',
  'mposdelakidis@freegym.gr',
  'lefteris@freegym.gr',
  'mpallas@freegym.gr',
  'ioanna@freegym.gr',
  'admin2new@freegym.gr'
);

SELECT '' as separator;
SELECT 'PROTECTED TABLES VERIFICATION:' as check_type;
SELECT
  'membership_packages' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END as status
FROM membership_packages
UNION ALL SELECT
  'membership_package_durations',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM membership_package_durations
UNION ALL SELECT
  'lesson_categories',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM lesson_categories
UNION ALL SELECT
  'rooms',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM rooms
UNION ALL SELECT
  'lessons',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM lessons
UNION ALL SELECT
  'lesson_schedules',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM lesson_schedules
UNION ALL SELECT
  'trainers',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM trainers
UNION ALL SELECT
  'group_schedule_templates',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM group_schedule_templates
UNION ALL SELECT
  'pilates_schedule_slots',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM pilates_schedule_slots
ORDER BY row_count DESC;
