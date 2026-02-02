-- ============================================================================
-- ΑΝΑΊΤΗΣΗ ΣΧΗΜΑ ΕΝΕΡΓΟΠΟΊΗΣΗΣ - PASSWORD RESET FUNCTION
-- ============================================================================
-- Χρησιμοποιείστε αυτό για να κάνετε password reset σε accounts
-- ============================================================================

-- Αν έχετε πρόσβαση στο Supabase Dashboard:
-- 1. Πηγαίνετε στο "Authentication" > "Users"
-- 2. Βρείτε το user: receptiongym2025@gmail.com
-- 3. Κάντε κλικ τα 3 dots > "Reset Password"
-- 4. Θα λάβει email με reset link

-- Αν θέλετε να κάνετε update το password απευθείας στη βάση:
-- (Προσοχή: Το password πρέπει να είναι hashed με bcrypt)

BEGIN;

-- Πρώτα, ας ελέγξουμε το current status
SELECT 
  email,
  id,
  email_confirmed_at,
  updated_at
FROM auth.users
WHERE email = 'receptiongym2025@gmail.com';

-- Αν θέλετε να ορίσετε ένα γνωστό password για testing:
-- Χρησιμοποιήστε το Supabase Auth API ή το dashboard

-- Για τώρα, ensure το email είναι verified:
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email = 'receptiongym2025@gmail.com';

-- Verify το user_profile role
SELECT 
  u.id,
  u.email,
  up.role,
  up.display_name
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email = 'receptiongym2025@gmail.com';

-- Ensure reception role
UPDATE user_profiles 
SET role = 'reception'
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'receptiongym2025@gmail.com'
);

SELECT '✅ Reception Account Verified!' as status;

COMMIT;

-- ============================================================================
-- ΣΥΝΔΕΣΗ - ΒΗΜΑΤΑ:
-- ============================================================================
--
-- Για ADMIN PANEL:
--   1. Πηγαίνετε στο login page
--   2. Email: admin@freegym.gr
--   3. Password: Admin@2024!
--   4. Κάντε κλικ "Login" 
--
-- Για RECEPTION PANEL:
--   1. Πηγαίνετε στο login page (reception version)
--   2. Email: receptiongym2025@gmail.com
--   3. Κάντε κλικ "Forgot Password"
--   4. Ελέγξτε το email σας για reset link
--   5. Ορίστε νέο password
--   6. Συνδεθείτε
--
-- ============================================================================
