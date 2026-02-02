-- ═══════════════════════════════════════════════════════════════════════════════
-- ABSOLUTE FINAL SOLUTION: Remove triggers one by one, rebuild clean
-- Χωρίς CASCADE, σταδιακά αφαίρεση
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN TRANSACTION;

SELECT '🔥 STEP 1: Dropping triggers individually (no CASCADE)...' as step;

-- Drop triggers ONE BY ONE - this ensures they're gone
DROP TRIGGER IF EXISTS auto_expire_memberships_on_insert_update ON memberships;
DROP TRIGGER IF EXISTS cascade_deactivate_pilates_on_membership_change ON memberships;

-- Wait a moment - also drop any other hidden triggers
DROP TRIGGER IF EXISTS memberships_cascade_pilates_deactivation ON memberships;
DROP TRIGGER IF EXISTS memberships_cascade_deposits ON memberships;
DROP TRIGGER IF EXISTS update_memberships_auto_renew ON memberships;
DROP TRIGGER IF EXISTS update_memberships_status ON memberships;
DROP TRIGGER IF EXISTS auto_update_membership_status ON memberships;

SELECT '✅ All triggers removed' as result;

SELECT '─────────────────────────────────────────────────────────────────' as separator;

-- Verify triggers are gone
SELECT 'STEP 2: Verifying triggers are gone...' as step;
SELECT 
  COUNT(*) as remaining_triggers
FROM information_schema.triggers
WHERE event_object_table = 'memberships'
  AND trigger_schema = 'public';

SELECT '─────────────────────────────────────────────────────────────────' as separator;

-- Now drop functions (these should have no dependencies)
SELECT 'STEP 3: Dropping all functions...' as step;

DROP FUNCTION IF EXISTS auto_expire_memberships_before_insert_update();
DROP FUNCTION IF EXISTS cascade_deactivate_pilates_on_membership_change();
DROP FUNCTION IF EXISTS cascade_deactivate_deposits();

SELECT '✅ All functions removed' as result;

SELECT '─────────────────────────────────────────────────────────────────' as separator;

-- RECREATE: Function #1 - DO NOT reference status
SELECT 'STEP 4: Recreating functions (NO status references)...' as step;

CREATE OR REPLACE FUNCTION auto_expire_memberships_before_insert_update()
RETURNS TRIGGER AS $$
BEGIN
  -- ONLY set is_active based on end_date
  -- Never reference the status column
  IF NEW.end_date < CURRENT_DATE THEN
    NEW.is_active := false;
  ELSE
    NEW.is_active := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

SELECT '✅ Function #1 created' as result;

-- RECREATE: Function #2 - for cascade deactivation
CREATE OR REPLACE FUNCTION cascade_deactivate_pilates_on_membership_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = false AND OLD.is_active = true THEN
    UPDATE pilates_deposits 
    SET is_active = false, updated_at = NOW()
    WHERE user_id = NEW.user_id 
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

SELECT '✅ Function #2 created' as result;

SELECT '─────────────────────────────────────────────────────────────────' as separator;

-- RECREATE: Triggers
SELECT 'STEP 5: Recreating triggers...' as step;

CREATE TRIGGER auto_expire_memberships_on_insert_update
BEFORE INSERT OR UPDATE ON memberships
FOR EACH ROW
EXECUTE FUNCTION auto_expire_memberships_before_insert_update();

SELECT '✅ Trigger #1 created' as result;

CREATE TRIGGER cascade_deactivate_pilates_on_membership_change
AFTER UPDATE ON memberships
FOR EACH ROW
EXECUTE FUNCTION cascade_deactivate_pilates_on_membership_change();

SELECT '✅ Trigger #2 created' as result;

SELECT '─────────────────────────────────────────────────────────────────' as separator;

-- FINAL VERIFICATION
SELECT 'STEP 6: Final verification...' as step;

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'memberships'
  AND trigger_schema = 'public'
ORDER BY trigger_name;

SELECT '═════════════════════════════════════════════════════════════════' as separator;
SELECT '✅✅✅ ABSOLUTE FINAL CLEANUP COMPLETE ✅✅✅' as final_result;
SELECT 'Triggers recreated with NO status references' as info;
SELECT '═════════════════════════════════════════════════════════════════' as separator;

COMMIT TRANSACTION;
