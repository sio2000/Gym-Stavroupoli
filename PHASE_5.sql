-- PHASE 5: DELETE USER PROFILES (POINT OF NO RETURN)
-- ⚠️ This is permanent - ensure PHASE 1-4 completed successfully first
-- Protected Accounts: admin@freegym.gr, receptiongym2025@gmail.com, mike@freegym.gr,
-- aristidis@freegym.gr, mpasaridis@freegym.gr, mposdelakidis@freegym.gr,
-- lefteris@freegym.gr, mpallas@freegym.gr, ioanna@freegym.gr, admin2new@freegym.gr

BEGIN;

DELETE FROM user_profiles
WHERE id NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@freegym.gr', 'receptiongym2025@gmail.com', 'mike@freegym.gr',
    'aristidis@freegym.gr', 'mpasaridis@freegym.gr', 'mposdelakidis@freegym.gr',
    'lefteris@freegym.gr', 'mpallas@freegym.gr', 'ioanna@freegym.gr', 'admin2new@freegym.gr'
  )
);

SELECT '---PHASE 5 CHECK---' as checkpoint;
SELECT
  'user_profiles' as table_name,
  COUNT(*) as remaining_rows
FROM user_profiles
UNION ALL SELECT 'memberships', COUNT(*) FROM memberships
UNION ALL SELECT 'membership_requests', COUNT(*) FROM membership_requests
UNION ALL SELECT 'pilates_deposits', COUNT(*) FROM pilates_deposits
UNION ALL SELECT 'pilates_bookings', COUNT(*) FROM pilates_bookings
UNION ALL SELECT 'lesson_bookings', COUNT(*) FROM lesson_bookings
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'group_assignments', COUNT(*) FROM group_assignments;

COMMIT;
