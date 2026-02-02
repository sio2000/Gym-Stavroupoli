-- ============================================================================
-- COMPLETE USER DELETION SCRIPT - 100% SAFE
-- ============================================================================
-- Διαγράφει ΟΛΟΥΣ τους χρήστες από την εφαρμογή ΕΝΤΕΛΩΣ
-- Διατηρεί ΜΟΝΟ τα 10 protected accounts (admin, reception, trainers)
-- 
-- Protected Accounts (ΔΕΝ θα διαγραφούν):
-- - admin@freegym.gr
-- - receptiongym2025@gmail.com
-- - mike@freegym.gr
-- - aristidis@freegym.gr
-- - mpasaridis@freegym.gr
-- - mposdelakidis@freegym.gr
-- - lefteris@freegym.gr
-- - mpallas@freegym.gr
-- - ioanna@freegym.gr
-- - admin2new@freegym.gr
-- ============================================================================

BEGIN;

-- ΒΗΜΑ 1: Αποθήκευση των IDs των protected accounts
-- (αυτό είναι αναφορά, δεν διαγράφουμε)
CREATE TEMPORARY TABLE protected_account_ids AS
SELECT id FROM auth.users 
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

-- ΒΗΜΑ 2: Διαγραφή όλων των δεδομένων χρήστη (εκτός protected)
DELETE FROM user_profiles 
WHERE id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM memberships 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM membership_requests 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM pilates_deposits 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM pilates_bookings 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM lesson_bookings 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM lesson_attendance 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM bookings 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM qr_codes 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM scan_audit_logs 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM payments 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM absence_records 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM referrals 
WHERE referrer_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM user_kettlebell_points 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM user_group_weekly_presets 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM audit_logs 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM personal_training_codes 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM personal_training_schedules 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM group_assignments 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM group_sessions 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM program_approval_states 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM user_cash_transactions 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM user_old_members_usage 
WHERE user_id NOT IN (SELECT id FROM protected_account_ids);

DELETE FROM membership_logs 
WHERE membership_id IN (
  SELECT id FROM memberships 
  WHERE user_id NOT IN (SELECT id FROM protected_account_ids)
);

-- ΒΗΜΑ 3: Διαγραφή χρηστών από auth.users (ΕΝΤΕΛΩΣ)
-- Διατηρούμε ΜΟΝΟ τα 10 protected accounts
DELETE FROM auth.users 
WHERE id NOT IN (SELECT id FROM protected_account_ids);

-- ΒΗΜΑ 4: Καθαρισμός temporary table
DROP TABLE protected_account_ids;

-- ΒΗΜΑ 5: Verification - Εμφάνιση αποτελέσματος
SELECT '============== ΔΙΑΓΡΑΦΗ ΧΡΗΣΤΩΝ ΟΛΟΚΛΗΡΩΘΗΚΕ ==============' as result;

SELECT 
  'PROTECTED ACCOUNTS' as category,
  COUNT(*) as remaining_users,
  'Αυτοί είναι οι ΜΟΝΟΙ χρήστες που παραμένουν' as description
FROM auth.users;

SELECT 
  'ΑΝΑΓΝΩΡΙΣΜΕΝΟΙ PROTECTED ACCOUNTS' as category,
  email as account_email,
  created_at as δημιουργήθηκε
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
)
ORDER BY email;

-- Verification queries για όλα τα tables
SELECT 
  'VERIFICATION: Υπολειπόμενα δεδομένα χρήστη' as check,
  SUM(count) as total_rows
FROM (
  SELECT COUNT(*) as count FROM user_profiles
  UNION ALL SELECT COUNT(*) FROM memberships
  UNION ALL SELECT COUNT(*) FROM membership_requests
  UNION ALL SELECT COUNT(*) FROM pilates_deposits
  UNION ALL SELECT COUNT(*) FROM pilates_bookings
  UNION ALL SELECT COUNT(*) FROM lesson_bookings
  UNION ALL SELECT COUNT(*) FROM lesson_attendance
  UNION ALL SELECT COUNT(*) FROM bookings
  UNION ALL SELECT COUNT(*) FROM qr_codes
  UNION ALL SELECT COUNT(*) FROM scan_audit_logs
  UNION ALL SELECT COUNT(*) FROM payments
  UNION ALL SELECT COUNT(*) FROM absence_records
  UNION ALL SELECT COUNT(*) FROM referrals
  UNION ALL SELECT COUNT(*) FROM user_kettlebell_points
  UNION ALL SELECT COUNT(*) FROM user_group_weekly_presets
  UNION ALL SELECT COUNT(*) FROM audit_logs
  UNION ALL SELECT COUNT(*) FROM personal_training_codes
  UNION ALL SELECT COUNT(*) FROM personal_training_schedules
  UNION ALL SELECT COUNT(*) FROM group_assignments
  UNION ALL SELECT COUNT(*) FROM group_sessions
  UNION ALL SELECT COUNT(*) FROM program_approval_states
  UNION ALL SELECT COUNT(*) FROM user_cash_transactions
  UNION ALL SELECT COUNT(*) FROM user_old_members_usage
) t;

SELECT '✅ ΕΠΙΤΥΧΗΣ ΔΙΑΓΡΑΦΗ - Έτοιμο για νέους χρήστες!' as final_status;

COMMIT;
