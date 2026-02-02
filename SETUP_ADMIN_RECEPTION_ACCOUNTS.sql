-- ============================================================================
-- ADMIN & RECEPTION PANEL ACCESS - SETUP SCRIPT
-- ============================================================================
-- Ρυθμίζει τα accounts για σύνδεση στα admin & reception panels
-- 
-- ADMIN PANEL:  admin@freegym.gr
-- RECEPTION PANEL: receptiongym2025@gmail.com
-- ============================================================================

BEGIN;

-- ΒΗΜΑ 1: Verification - Έλεγχος ότι τα accounts υπάρχουν
SELECT 
  email,
  id,
  email_confirmed_at,
  confirmed_at,
  last_sign_in_at,
  created_at
FROM auth.users
WHERE email IN ('admin@freegym.gr', 'receptiongym2025@gmail.com')
ORDER BY email;

-- ΒΗΜΑ 2: Ensure email_confirmed_at είναι SET (αν δεν είναι)
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email IN ('admin@freegym.gr', 'receptiongym2025@gmail.com')
AND email_confirmed_at IS NULL;

-- ΒΗΜΑ 3: Ensure είναι ενεργά (not banned)
UPDATE auth.users 
SET ban_duration = null
WHERE email IN ('admin@freegym.gr', 'receptiongym2025@gmail.com')
AND ban_duration IS NOT NULL;

-- ΒΗΜΑ 4: Έλεγχος user_profiles - πρέπει να υπάρχουν
SELECT 
  u.email,
  up.id as profile_id,
  up.display_name,
  up.role
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email IN ('admin@freegym.gr', 'receptiongym2025@gmail.com');

-- ΒΗΜΑ 5: Update roles αν χρειάζεται
UPDATE user_profiles 
SET role = 'admin'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@freegym.gr')
AND role != 'admin';

UPDATE user_profiles 
SET role = 'reception'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'receptiongym2025@gmail.com')
AND role != 'reception';

-- ΒΗΜΑ 6: Verification τελικό
SELECT '✅ ADMIN & RECEPTION ACCOUNTS READY' as status;

SELECT 
  email,
  role,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Verified'
    ELSE '❌ Not Verified'
  END as email_status,
  CASE 
    WHEN ban_duration IS NULL THEN '✅ Active'
    ELSE '❌ Banned'
  END as account_status
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email IN ('admin@freegym.gr', 'receptiongym2025@gmail.com')
ORDER BY email;

COMMIT;

-- ============================================================================
-- ΣΗΜΑΝΤΙΚΟ: Αφού εκτελέσετε το script παραπάνω, χρησιμοποιήστε τα στοιχεία:
--
-- ADMIN PANEL LOGIN:
--   Email: admin@freegym.gr
--   Password: Admin@2024!
--
-- RECEPTION PANEL LOGIN:
--   Email: receptiongym2025@gmail.com
--   Password: [κάνε password reset διότι δεν υπάρχει recorded]
--
-- ============================================================================
-- Αν χρειάζεται PASSWORD RESET για reception:
-- Χρησιμοποιήστε το "Forgot Password" link στο login page
-- ή εκτελέστε το αρχείο: RESET_PASSWORD_RECEPTION.sql
-- ============================================================================
