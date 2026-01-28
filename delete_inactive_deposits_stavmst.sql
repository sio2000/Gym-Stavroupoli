-- ============================================================================
-- SAFE SQL: Delete INACTIVE deposits for stavmst18@gmail.com
-- Keep only the ACTIVE deposit
-- ============================================================================
-- User: Μαστοροδήμου Σταυρούλα
-- Email: stavmst18@gmail.com
-- Referral Code: E4CF7CC0
-- ============================================================================

BEGIN TRANSACTION;

-- Step 1: Check current state
SELECT 
  up.user_id,
  up.email,
  up.first_name,
  pd.id,
  pd.is_active,
  pd.credited_at,
  pd.expires_at,
  pd.deposit_remaining
FROM public.user_profiles up
LEFT JOIN public.pilates_deposits pd ON up.user_id = pd.user_id
WHERE up.email = 'stavmst18@gmail.com'
ORDER BY pd.is_active DESC, pd.created_at DESC;

-- Step 2: Count inactive deposits before deletion
WITH user_data AS (
  SELECT up.user_id FROM public.user_profiles up WHERE up.email = 'stavmst18@gmail.com'
)
SELECT 
  COUNT(*) as inactive_count,
  'Inactive deposits to be deleted' as status
FROM public.pilates_deposits pd
WHERE pd.user_id = (SELECT user_id FROM user_data)
  AND pd.is_active = false;

-- Step 3: SAFE DELETE - Delete INACTIVE deposits only
WITH user_data AS (
  SELECT up.user_id FROM public.user_profiles up WHERE up.email = 'stavmst18@gmail.com'
)
DELETE FROM public.pilates_deposits pd
WHERE pd.user_id = (SELECT user_id FROM user_data)
  AND pd.is_active = false
RETURNING 
  id,
  deposit_remaining,
  is_active,
  'DELETED' as action;

-- Step 4: Verify final state - should show only ACTIVE deposit
SELECT 
  up.user_id,
  up.email,
  up.first_name,
  COUNT(pd.id) as total_deposits,
  COUNT(CASE WHEN pd.is_active = true THEN 1 END) as active_deposits,
  COUNT(CASE WHEN pd.is_active = false THEN 1 END) as inactive_deposits
FROM public.user_profiles up
LEFT JOIN public.pilates_deposits pd ON up.user_id = pd.user_id
WHERE up.email = 'stavmst18@gmail.com'
GROUP BY up.user_id, up.email, up.first_name;

-- Final check: Show remaining active deposit
SELECT 
  pd.id,
  pd.is_active,
  pd.credited_at,
  pd.expires_at,
  pd.deposit_remaining,
  'REMAINING ACTIVE DEPOSIT' as status
FROM public.pilates_deposits pd
WHERE pd.user_id IN (
  SELECT up.user_id FROM public.user_profiles up WHERE up.email = 'stavmst18@gmail.com'
)
  AND pd.is_active = true;

COMMIT;

-- ============================================================================
-- Notes:
-- ✅ Uses email as safe identifier (unique constraint)
-- ✅ Only deletes deposits with is_active = false
-- ✅ Keeps all active deposits
-- ✅ Wrapped in transaction for safety
-- ✅ Includes verification steps before and after
-- ✅ No cascade delete - only pilates_deposits table affected
-- ============================================================================
