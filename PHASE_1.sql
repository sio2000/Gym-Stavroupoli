-- PHASE 1: BASELINE ROW COUNTS
-- Protected Accounts (Excluded from all deletions):
-- admin@freegym.gr, receptiongym2025@gmail.com, mike@freegym.gr, 
-- aristidis@freegym.gr, mpasaridis@freegym.gr, mposdelakidis@freegym.gr,
-- lefteris@freegym.gr, mpallas@freegym.gr, ioanna@freegym.gr, admin2new@freegym.gr

SELECT 'PHASE 1: BASELINE ROW COUNTS' as phase_marker;

SELECT
  'user_profiles' as table_name,
  COUNT(*) as row_count,
  'PRIMARY CASCADE HUB' as category
FROM user_profiles
UNION ALL SELECT
  'memberships',
  COUNT(*),
  'USER SUBSCRIPTIONS'
FROM memberships
UNION ALL SELECT
  'membership_requests',
  COUNT(*),
  'USER SUBSCRIPTIONS'
FROM membership_requests
UNION ALL SELECT
  'pilates_deposits',
  COUNT(*),
  'USER SUBSCRIPTIONS'
FROM pilates_deposits
UNION ALL SELECT
  'pilates_bookings',
  COUNT(*),
  'USER TRANSACTIONS'
FROM pilates_bookings
UNION ALL SELECT
  'lesson_bookings',
  COUNT(*),
  'USER TRANSACTIONS'
FROM lesson_bookings
UNION ALL SELECT
  'lesson_attendance',
  COUNT(*),
  'USER TRANSACTIONS'
FROM lesson_attendance
UNION ALL SELECT
  'bookings',
  COUNT(*),
  'USER TRANSACTIONS'
FROM bookings
UNION ALL SELECT
  'qr_codes',
  COUNT(*),
  'USER TRANSACTIONS'
FROM qr_codes
UNION ALL SELECT
  'scan_audit_logs',
  COUNT(*),
  'USER TRANSACTIONS'
FROM scan_audit_logs
UNION ALL SELECT
  'payments',
  COUNT(*),
  'USER TRANSACTIONS'
FROM payments
UNION ALL SELECT
  'absence_records',
  COUNT(*),
  'USER DATA'
FROM absence_records
UNION ALL SELECT
  'referrals',
  COUNT(*),
  'USER DATA'
FROM referrals
UNION ALL SELECT
  'user_kettlebell_points',
  COUNT(*),
  'USER DATA'
FROM user_kettlebell_points
UNION ALL SELECT
  'user_group_weekly_presets',
  COUNT(*),
  'USER DATA'
FROM user_group_weekly_presets
UNION ALL SELECT
  'audit_logs',
  COUNT(*),
  'USER DATA'
FROM audit_logs
UNION ALL SELECT
  'personal_training_codes',
  COUNT(*),
  'USER DATA'
FROM personal_training_codes
UNION ALL SELECT
  'personal_training_schedules',
  COUNT(*),
  'USER DATA'
FROM personal_training_schedules
UNION ALL SELECT
  'group_assignments',
  COUNT(*),
  'USER DATA'
FROM group_assignments
UNION ALL SELECT
  'membership_logs',
  COUNT(*),
  'USER DATA'
FROM membership_logs
ORDER BY row_count DESC;

SELECT 'PROTECTED TABLES (DO NOT DELETE):' as verification;
SELECT
  'membership_packages' as table_name,
  COUNT(*) as row_count,
  'PROTECTED' as status
FROM membership_packages
UNION ALL SELECT
  'membership_package_durations',
  COUNT(*),
  'PROTECTED'
FROM membership_package_durations
UNION ALL SELECT
  'lesson_categories',
  COUNT(*),
  'PROTECTED'
FROM lesson_categories
UNION ALL SELECT
  'rooms',
  COUNT(*),
  'PROTECTED'
FROM rooms
UNION ALL SELECT
  'lessons',
  COUNT(*),
  'PROTECTED'
FROM lessons
UNION ALL SELECT
  'lesson_schedules',
  COUNT(*),
  'PROTECTED'
FROM lesson_schedules
UNION ALL SELECT
  'trainers',
  COUNT(*),
  'PROTECTED'
FROM trainers
UNION ALL SELECT
  'group_schedule_templates',
  COUNT(*),
  'PROTECTED'
FROM group_schedule_templates
UNION ALL SELECT
  'pilates_schedule_slots',
  COUNT(*),
  'PROTECTED'
FROM pilates_schedule_slots
ORDER BY row_count DESC;
