-- ============================================================================
-- EMERGENCY FIX: Mark all expired memberships as inactive
-- ============================================================================
-- This is a simplified version that ONLY fixes the expired memberships
-- Run this in Supabase SQL Editor if the previous script didn't work
-- ============================================================================

-- STEP 1: Show what's wrong (for verification)
SELECT 
  'BEFORE FIX' as step,
  COUNT(*) as count,
  'Memberships with end_date < TODAY but still marked as active' as description
FROM memberships
WHERE (is_active = true OR status = 'active')
  AND end_date < CURRENT_DATE;

-- STEP 2: FIX IT - Mark all expired memberships as inactive
UPDATE memberships
SET 
  is_active = false,
  status = 'expired',
  updated_at = NOW()
WHERE end_date < CURRENT_DATE
  AND (is_active = true OR status = 'active');

-- STEP 3: Verify the fix
SELECT 
  'AFTER FIX' as step,
  COUNT(*) as count,
  'Should be 0 if fix worked' as description
FROM memberships
WHERE (is_active = true OR status = 'active')
  AND end_date < CURRENT_DATE;

-- STEP 4: Show all expired memberships (should all have is_active=false, status='expired')
SELECT 
  m.id,
  m.user_id,
  m.end_date,
  m.is_active,
  m.status,
  mp.name as package_name,
  up.first_name,
  up.last_name
FROM memberships m
LEFT JOIN membership_packages mp ON m.package_id = mp.id
LEFT JOIN user_profiles up ON m.user_id = up.user_id
WHERE m.end_date < CURRENT_DATE
ORDER BY m.end_date DESC;
