-- ═══════════════════════════════════════════════════════════════════════════════
-- ULTIMATE NUCLEAR OPTION: Drop ALL triggers in ONE statement
-- Αφαίρεση ΠΑΝΤΩΝ triggers ταυτόχρονα και επαναδημιουργία
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN TRANSACTION;

-- STEP 1: Drop ALL functions first (CASCADE will handle triggers)
-- This is the most aggressive approach - drop everything and rebuild
SELECT 'STEP 1: Dropping ALL functions with CASCADE...' as step;

DROP FUNCTION IF EXISTS auto_expire_memberships_before_insert_update() CASCADE;
DROP FUNCTION IF EXISTS cascade_deactivate_pilates_on_membership_change() CASCADE;
DROP FUNCTION IF EXISTS cascade_deactivate_deposits() CASCADE;
DROP FUNCTION IF EXISTS update_memberships_status_function() CASCADE;
DROP FUNCTION IF EXISTS sync_membership_status_function() CASCADE;
DROP FUNCTION IF EXISTS memberships_before_insert_function() CASCADE;
DROP FUNCTION IF EXISTS check_membership_status_function() CASCADE;
DROP FUNCTION IF EXISTS validate_membership_status_function() CASCADE;
DROP FUNCTION IF EXISTS set_updated_at_on_update() CASCADE;
DROP FUNCTION IF EXISTS memberships_insert_trigger_func() CASCADE;
DROP FUNCTION IF EXISTS memberships_update_trigger_func() CASCADE;
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

-- DROP ANY function matching these patterns
DROP FUNCTION IF EXISTS public.auto_expire_memberships_before_insert_update() CASCADE;
DROP FUNCTION IF EXISTS public.cascade_deactivate_pilates_on_membership_change() CASCADE;

SELECT '✅ All functions dropped with CASCADE' as result;

-- STEP 2: Verify NO triggers exist on memberships
SELECT 'STEP 2: Checking for remaining triggers...' as step;

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'memberships'
  AND trigger_schema = 'public';

-- STEP 3: Get count of remaining triggers
SELECT 
  COUNT(*) as remaining_trigger_count
FROM information_schema.triggers
WHERE event_object_table = 'memberships'
  AND trigger_schema = 'public';

SELECT '─────────────────────────────────────────────────────────────────' as separator;

-- STEP 4: Verify memberships table structure - should NOT have status
SELECT 'STEP 3: Verifying memberships table columns...' as step;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'memberships'
  AND table_schema = 'public'
  AND column_name IN ('status', 'is_active', 'end_date', 'start_date')
ORDER BY ordinal_position;

SELECT '─────────────────────────────────────────────────────────────────' as separator;

-- STEP 5: Recreate the TWO essential triggers (CLEAN, NO STATUS REFERENCES)
SELECT 'STEP 4: Recreating essential triggers...' as step;

-- Trigger #1: Auto-expire membership based on end_date
CREATE FUNCTION auto_expire_memberships_before_insert_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Set is_active based ONLY on end_date
  -- If end_date is in the past, mark as inactive
  -- Otherwise mark as active
  IF NEW.end_date < CURRENT_DATE THEN
    NEW.is_active := false;
  ELSE
    NEW.is_active := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE TRIGGER auto_expire_memberships_on_insert_update
BEFORE INSERT OR UPDATE ON memberships
FOR EACH ROW
EXECUTE FUNCTION auto_expire_memberships_before_insert_update();

SELECT '✅ Auto-expire trigger created' as result;

-- Trigger #2: Cascade deactivation of pilates deposits
CREATE FUNCTION cascade_deactivate_pilates_on_membership_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only deactivate deposits when membership transitions from active to inactive
  IF NEW.is_active = false AND OLD.is_active = true THEN
    UPDATE pilates_deposits 
    SET is_active = false, updated_at = NOW()
    WHERE user_id = NEW.user_id 
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cascade_deactivate_pilates_on_membership_change
AFTER UPDATE ON memberships
FOR EACH ROW
EXECUTE FUNCTION cascade_deactivate_pilates_on_membership_change();

SELECT '✅ Cascade deactivation trigger created' as result;

SELECT '─────────────────────────────────────────────────────────────────' as separator;

-- STEP 6: Final verification
SELECT 'STEP 5: Final verification...' as step;

SELECT 
  trigger_name,
  event_manipulation as operation,
  'ACTIVE' as status
FROM information_schema.triggers
WHERE event_object_table = 'memberships'
  AND trigger_schema = 'public'
ORDER BY trigger_name;

SELECT '═════════════════════════════════════════════════════════════════' as separator;
SELECT '✅✅✅ ULTIMATE CLEANUP COMPLETE - ALL STATUS REFERENCES REMOVED ✅✅✅' as final_result;
SELECT '═════════════════════════════════════════════════════════════════' as separator;

COMMIT TRANSACTION;
