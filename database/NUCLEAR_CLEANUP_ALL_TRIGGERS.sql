-- ═══════════════════════════════════════════════════════════════════════════════
-- NUCLEAR OPTION: Remove ALL triggers and rebuild ONLY what's needed
-- Αφαίρεση ΠΑΝΩΝ triggers και δημιουργία μόνο των απαραίτητων
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN TRANSACTION;

SELECT '🔥 STARTING NUCLEAR CLEANUP - Removing ALL triggers on memberships...' as phase;

-- Step 1: Drop ALL triggers on memberships table (using CASCADE to handle any dependencies)
DROP TRIGGER IF EXISTS auto_expire_memberships_on_insert_update ON memberships CASCADE;
DROP TRIGGER IF EXISTS cascade_deactivate_pilates_on_membership_change ON memberships CASCADE;
DROP TRIGGER IF EXISTS memberships_cascade_pilates_deactivation ON memberships CASCADE;
DROP TRIGGER IF EXISTS memberships_cascade_deposits ON memberships CASCADE;
DROP TRIGGER IF EXISTS update_memberships_auto_renew ON memberships CASCADE;
DROP TRIGGER IF EXISTS update_memberships_status ON memberships CASCADE;
DROP TRIGGER IF EXISTS update_membership_status ON memberships CASCADE;
DROP TRIGGER IF EXISTS memberships_auto_expire ON memberships CASCADE;
DROP TRIGGER IF EXISTS memberships_set_status ON memberships CASCADE;
DROP TRIGGER IF EXISTS auto_update_membership_status ON memberships CASCADE;
DROP TRIGGER IF EXISTS sync_membership_status ON memberships CASCADE;
DROP TRIGGER IF EXISTS memberships_before_insert_update ON memberships CASCADE;
DROP TRIGGER IF EXISTS memberships_before_update ON memberships CASCADE;
DROP TRIGGER IF EXISTS memberships_insert_set_status ON memberships CASCADE;
DROP TRIGGER IF EXISTS check_membership_status ON memberships CASCADE;
DROP TRIGGER IF EXISTS validate_membership_status ON memberships CASCADE;
DROP TRIGGER IF EXISTS memberships_insert_trigger ON memberships CASCADE;
DROP TRIGGER IF EXISTS memberships_update_trigger ON memberships CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON memberships CASCADE;
DROP TRIGGER IF EXISTS before_insert_set_defaults ON memberships CASCADE;
DROP TRIGGER IF EXISTS before_update_set_updated_at ON memberships CASCADE;

SELECT '✅ All triggers on memberships dropped' as result;

-- Step 2: Drop ALL associated functions (with CASCADE to handle trigger dependencies)
DROP FUNCTION IF EXISTS auto_expire_memberships_before_insert_update() CASCADE;
DROP FUNCTION IF EXISTS cascade_deactivate_pilates_on_membership_change() CASCADE;
DROP FUNCTION IF EXISTS cascade_deactivate_deposits() CASCADE;
DROP FUNCTION IF EXISTS update_memberships_status_function() CASCADE;
DROP FUNCTION IF EXISTS sync_membership_status_function() CASCADE;
DROP FUNCTION IF EXISTS memberships_before_insert_function() CASCADE;
DROP FUNCTION IF EXISTS check_membership_status_function() CASCADE;
DROP FUNCTION IF EXISTS validate_membership_status_function() CASCADE;
DROP FUNCTION IF EXISTS set_updated_at_on_update() CASCADE;

SELECT '✅ All functions dropped' as result;

-- Step 3: Verify memberships table columns (should NOT have status)
SELECT 'Verifying memberships table structure...' as check;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'memberships'
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '─────────────────────────────────────────────────────────────────' as separator;

-- Step 4: Recreate ONLY the TWO essential triggers
SELECT '▶️  Creating essential triggers...' as phase;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGER #1: Auto-expire on insert/update (BEFORE INSERT OR UPDATE)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE FUNCTION auto_expire_memberships_before_insert_update()
RETURNS TRIGGER AS $$
BEGIN
  -- DO NOT SET status - only set is_active based on end_date
  IF NEW.end_date < CURRENT_DATE THEN
    NEW.is_active := false;
  ELSE
    NEW.is_active := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_expire_memberships_on_insert_update
BEFORE INSERT OR UPDATE ON memberships
FOR EACH ROW
EXECUTE FUNCTION auto_expire_memberships_before_insert_update();

SELECT '✅ Trigger #1 (auto-expire) created' as result;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGER #2: Cascade deactivation (AFTER UPDATE)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE FUNCTION cascade_deactivate_pilates_on_membership_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when is_active changes from true to false
  IF NEW.is_active = false AND OLD.is_active = true THEN
    UPDATE pilates_deposits 
    SET is_active = false, updated_at = NOW()
    WHERE user_id = NEW.user_id 
      AND is_active = true;
    
    RAISE NOTICE 'Deactivated pilates deposits for user % (membership expired %)', 
      NEW.user_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cascade_deactivate_pilates_on_membership_change
AFTER UPDATE ON memberships
FOR EACH ROW
EXECUTE FUNCTION cascade_deactivate_pilates_on_membership_change();

SELECT '✅ Trigger #2 (cascade deactivation) created' as result;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '─────────────────────────────────────────────────────────────────' as separator;
SELECT 'Verifying triggers...' as check;

SELECT 
  trigger_name,
  event_manipulation as operation,
  event_object_table as table_name
FROM information_schema.triggers
WHERE event_object_table = 'memberships'
  AND trigger_schema = 'public'
ORDER BY trigger_name;

SELECT '─────────────────────────────────────────────────────────────────' as separator;
SELECT 'Verifying functions...' as check;

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%memberships%' OR routine_name LIKE '%pilates%')
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

SELECT '═════════════════════════════════════════════════════════════════' as separator;
SELECT '✅ NUCLEAR CLEANUP COMPLETE - Database ready for production' as final_result;
SELECT '═════════════════════════════════════════════════════════════════' as separator;

COMMIT TRANSACTION;
