-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 1: CRITICAL DATABASE FIXES
-- Run this ENTIRE file in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- TRANSACTION: All changes atomically applied
BEGIN TRANSACTION;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX #1: AUTO-DEACTIVATE EXPIRED MEMBERSHIPS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'FIX #1: Creating auto-expire trigger...' as status;

-- Drop existing trigger if present
DROP TRIGGER IF EXISTS expire_membership_before_trigger ON memberships;
DROP FUNCTION IF EXISTS auto_deactivate_expired_memberships();

-- Create function that auto-sets is_active = false when end_date < TODAY
CREATE OR REPLACE FUNCTION auto_deactivate_expired_memberships()
RETURNS TRIGGER AS $$
BEGIN
  -- If end_date is in the past, mark membership as inactive
  IF NEW.end_date < CURRENT_DATE THEN
    NEW.is_active := false;
  ELSE
    NEW.is_active := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger on INSERT and UPDATE
CREATE TRIGGER expire_membership_before_trigger
BEFORE INSERT OR UPDATE ON memberships
FOR EACH ROW
EXECUTE FUNCTION auto_deactivate_expired_memberships();

SELECT '✅ Auto-expire trigger created' as result;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX #2: CASCADE DEACTIVATE PILATES DEPOSITS WHEN MEMBERSHIP EXPIRES
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'FIX #2: Creating cascade deactivation trigger...' as status;

-- Drop existing trigger if present
DROP TRIGGER IF EXISTS cascade_deactivate_deposits_trigger ON memberships;
DROP FUNCTION IF EXISTS cascade_deactivate_pilates_deposits();

-- Create function that deactivates pilates deposits when membership becomes inactive
CREATE OR REPLACE FUNCTION cascade_deactivate_pilates_deposits()
RETURNS TRIGGER AS $$
BEGIN
  -- When a membership is deactivated (is_active: true → false)
  -- Deactivate all active pilates deposits for this user
  IF NEW.is_active = false AND OLD.is_active = true THEN
    UPDATE pilates_deposits 
    SET is_active = false, updated_at = NOW()
    WHERE user_id = NEW.user_id 
      AND is_active = true
      AND package_id IN (
        SELECT id FROM membership_packages WHERE name = 'Pilates'
      );
    
    RAISE NOTICE 'Deactivated pilates deposits for user % (membership %)', 
      NEW.user_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger on UPDATE (after we've already set is_active)
CREATE TRIGGER cascade_deactivate_deposits_trigger
AFTER UPDATE ON memberships
FOR EACH ROW
EXECUTE FUNCTION cascade_deactivate_pilates_deposits();

SELECT '✅ Cascade deactivation trigger created' as result;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX #3: REPAIR EXISTING EXPIRED MEMBERSHIPS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'FIX #3: Repairing existing expired memberships...' as status;

-- Find and deactivate all expired memberships that are still marked active
UPDATE memberships
SET is_active = false, updated_at = NOW()
WHERE end_date < CURRENT_DATE 
  AND is_active = true;

GET DIAGNOSTICS UPDATE_COUNT = ROW_COUNT;
SELECT format('✅ Deactivated %s expired memberships', UPDATE_COUNT) as result;

-- Cascade deactivate their pilates deposits
UPDATE pilates_deposits
SET is_active = false, updated_at = NOW()
WHERE is_active = true
  AND user_id IN (
    SELECT user_id FROM memberships 
    WHERE is_active = false AND end_date < CURRENT_DATE
  );

GET DIAGNOSTICS UPDATE_COUNT = ROW_COUNT;
SELECT format('✅ Deactivated %s orphaned pilates deposits', UPDATE_COUNT) as result;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX #4: VERIFY RLS POLICIES ALLOW ADMIN OPERATIONS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'FIX #4: Checking RLS policies...' as status;

-- Check if RLS is enabled
SELECT 
  table_name,
  CASE WHEN rowsecurity THEN '✅ RLS ENABLED' ELSE '⚠️  RLS DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public' AND table_name = 'memberships';

-- List existing policies
SELECT 
  policyname,
  'Policy exists' as status
FROM pg_policies
WHERE tablename = 'memberships'
  AND policyname LIKE '%admin%';

SELECT '⚠️  Verify RLS policies manually in Supabase console' as reminder;
SELECT 'Required: Policy allowing admin/secretary INSERT access' as requirement;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'VERIFICATION QUERIES:' as section;
SELECT '─────────────────────────────────────────────────────────────────' as separator;

SELECT 'Q1: Triggers created successfully?' as query;
SELECT 
  trigger_name,
  event_manipulation,
  'EXISTS' as status
FROM information_schema.triggers
WHERE event_object_table IN ('memberships', 'pilates_deposits')
  AND trigger_name LIKE '%expire%' OR trigger_name LIKE '%cascade%'
ORDER BY trigger_name;

SELECT '─────────────────────────────────────────────────────────────────' as separator;

SELECT 'Q2: Expired memberships correctly marked?' as query;
SELECT
  'Expired and INACTIVE (correct)' as status,
  COUNT(*) as count
FROM memberships
WHERE end_date < CURRENT_DATE AND is_active = false
UNION ALL
SELECT
  'Expired but STILL ACTIVE (ERROR)' as status,
  COUNT(*) as count
FROM memberships
WHERE end_date < CURRENT_DATE AND is_active = true;

SELECT '─────────────────────────────────────────────────────────────────' as separator;

SELECT 'Q3: Orphaned deposits correctly handled?' as query;
SELECT
  'Active deposits for inactive memberships' as metric,
  COUNT(DISTINCT pd.user_id) as affected_users
FROM pilates_deposits pd
INNER JOIN memberships m ON pd.user_id = m.user_id
WHERE pd.is_active = true AND m.is_active = false;

SELECT '─────────────────────────────────────────────────────────────────' as separator;

SELECT 'Q4: Data integrity check' as query;
SELECT
  'Total memberships' as metric,
  COUNT(*) as count
FROM memberships
UNION ALL
SELECT 'Active memberships', COUNT(*) FROM memberships WHERE is_active = true
UNION ALL
SELECT 'Expired & marked inactive', COUNT(*) FROM memberships 
  WHERE end_date < CURRENT_DATE AND is_active = false
UNION ALL
SELECT 'Pilates deposits', COUNT(*) FROM pilates_deposits
UNION ALL
SELECT 'Active pilates deposits', COUNT(*) FROM pilates_deposits WHERE is_active = true;

COMMIT TRANSACTION;

SELECT '═══════════════════════════════════════════════════════════════════' as final_status;
SELECT '✅ PHASE 1 FIXES COMPLETED' as result;
SELECT '⚠️  Verify queries above show expected results' as reminder;
SELECT 'Run tests again with: npm run test:diagnostics' as next_step;
