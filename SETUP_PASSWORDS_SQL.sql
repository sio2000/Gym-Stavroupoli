-- ============================================================================
-- SETUP ADMIN & RECEPTION ACCOUNTS WITH SPECIFIC PASSWORDS
-- ============================================================================
-- Ρυθμίζει τα accounts με τους συγκεκριμένους κωδικούς:
-- Admin: admin@freegym.gr / admin123
-- Reception: receptiongym2025@gmail.com / Reception123!
-- ============================================================================
-- ΣΗΜΑΝΤΙΚΟ: Τα passwords στη Supabase δεν μπορούν να ενημερωθούν 
-- απευθείας μέσω SQL (είναι hashed με bcrypt).
-- Χρησιμοποιήστε το JavaScript script παρακάτω.
-- ============================================================================

-- SQL Part - Ρύθμιση accounts (χωρίς password)
BEGIN;

-- Ενεργοποίηση email
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email IN ('admin@freegym.gr', 'receptiongym2025@gmail.com')
AND email_confirmed_at IS NULL;

-- Δημιουργία user_profiles αν δεν υπάρχουν
INSERT INTO user_profiles (id, user_id, role)
SELECT id, id, 'admin'
FROM auth.users
WHERE email = 'admin@freegym.gr'
AND id NOT IN (SELECT id FROM user_profiles WHERE id = auth.users.id)
ON CONFLICT (id) DO UPDATE SET role = 'admin';

INSERT INTO user_profiles (id, user_id, role)
SELECT id, id, 'secretary'
FROM auth.users
WHERE email = 'receptiongym2025@gmail.com'
AND id NOT IN (SELECT id FROM user_profiles WHERE id = auth.users.id)
ON CONFLICT (id) DO UPDATE SET role = 'secretary';

-- Ενημέρωση roles (αν υπάρχουν ήδη)
UPDATE user_profiles 
SET role = 'admin'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@freegym.gr');

UPDATE user_profiles 
SET role = 'secretary'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'receptiongym2025@gmail.com');

-- Verification
SELECT 
  u.email,
  up.role,
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL THEN '✅ Email Verified'
    ELSE '❌ Email Not Verified'
  END as status
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email IN ('admin@freegym.gr', 'receptiongym2025@gmail.com')
ORDER BY u.email;

COMMIT;
