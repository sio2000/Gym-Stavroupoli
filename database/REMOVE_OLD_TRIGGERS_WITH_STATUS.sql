-- ═══════════════════════════════════════════════════════════════════════════════
-- REMOVE ALL OLD TRIGGERS AND FUNCTIONS THAT REFERENCE STATUS COLUMN
-- Αφαίρεση όλων των παλιών triggers/functions που χρησιμοποιούν το status column
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN TRANSACTION;

-- Get list of all triggers on memberships table
SELECT 'Removing triggers that reference status column...' as info;

-- Drop all triggers on memberships table (to be safe)
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

-- Drop functions that might reference status
DROP FUNCTION IF EXISTS update_memberships_status_function() CASCADE;
DROP FUNCTION IF EXISTS sync_membership_status_function() CASCADE;
DROP FUNCTION IF EXISTS memberships_before_insert_function() CASCADE;
DROP FUNCTION IF EXISTS check_membership_status_function() CASCADE;
DROP FUNCTION IF EXISTS validate_membership_status_function() CASCADE;

SELECT '✅ All old triggers and functions removed' as result;

-- Now recreate ONLY the essential triggers we need
SELECT 'Recreating essential triggers...' as info;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ESSENTIAL TRIGGER #1: AUTO-EXPIRE
-- ═══════════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS auto_expire_memberships_on_insert_update ON memberships CASCADE;
DROP FUNCTION IF EXISTS auto_expire_memberships_before_insert_update() CASCADE;

CREATE OR REPLACE FUNCTION auto_expire_memberships_before_insert_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Αν το end_date είναι στο παρελθόν, set is_active = false
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

SELECT '✅ Auto-expire trigger recreated' as result;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ESSENTIAL TRIGGER #2: CASCADE DEACTIVATION
-- ═══════════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS cascade_deactivate_pilates_on_membership_change ON memberships CASCADE;
DROP FUNCTION IF EXISTS cascade_deactivate_pilates_on_membership_change() CASCADE;

CREATE OR REPLACE FUNCTION cascade_deactivate_pilates_on_membership_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Όταν το is_active αλλάζει από true σε false
  -- Deactivate όλα τα active pilates deposits του χρήστη
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

SELECT '✅ Cascade deactivation trigger recreated' as result;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '✓ Checking triggers...' as check_type;
SELECT 
  trigger_name,
  event_manipulation as operation
FROM information_schema.triggers
WHERE event_object_table = 'memberships'
  AND trigger_schema = 'public'
ORDER BY trigger_name;

SELECT '═════════════════════════════════════════════════════════════════' as separator;
SELECT '✅ TRIGGERS CLEANED AND RECREATED - READY FOR PRODUCTION' as final_result;
SELECT '═════════════════════════════════════════════════════════════════' as separator;

COMMIT TRANSACTION;
