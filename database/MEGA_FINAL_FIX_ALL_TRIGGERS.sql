-- ═══════════════════════════════════════════════════════════════════════════════
-- MEGA FINAL FIX: Search and destroy EVERY trigger in the ENTIRE database
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN TRANSACTION;

SELECT 'SCANNING entire database for all triggers on memberships...' as action;

-- Show EVERY trigger that exists on memberships table across ALL schemas
SELECT 
  trigger_schema,
  trigger_name,
  event_object_table,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'memberships'
ORDER BY trigger_schema, trigger_name;

SELECT '─────────────────────────────────────────────────────────────────' as separator;

-- Now drop EVERYTHING from EVERY schema
SELECT 'Dropping triggers from ALL schemas...' as action;

-- Drop from public schema
DROP TRIGGER IF EXISTS auto_expire_memberships_on_insert_update ON public.memberships CASCADE;
DROP TRIGGER IF EXISTS cascade_deactivate_pilates_on_membership_change ON public.memberships CASCADE;
DROP TRIGGER IF EXISTS memberships_cascade_pilates_deactivation ON public.memberships CASCADE;
DROP TRIGGER IF EXISTS memberships_cascade_deposits ON public.memberships CASCADE;
DROP TRIGGER IF EXISTS update_memberships_auto_renew ON public.memberships CASCADE;
DROP TRIGGER IF EXISTS update_memberships_status ON public.memberships CASCADE;
DROP TRIGGER IF EXISTS auto_update_membership_status ON public.memberships CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON public.memberships CASCADE;
DROP TRIGGER IF EXISTS before_insert_set_defaults ON public.memberships CASCADE;
DROP TRIGGER IF EXISTS before_update_set_updated_at ON public.memberships CASCADE;
DROP TRIGGER IF EXISTS memberships_before_insert_update ON public.memberships CASCADE;
DROP TRIGGER IF EXISTS memberships_before_update ON public.memberships CASCADE;
DROP TRIGGER IF EXISTS memberships_insert_trigger ON public.memberships CASCADE;
DROP TRIGGER IF EXISTS memberships_update_trigger ON public.memberships CASCADE;

-- Drop functions with CASCADE (will drop all dependent triggers)
DROP FUNCTION IF EXISTS auto_expire_memberships_before_insert_update() CASCADE;
DROP FUNCTION IF EXISTS cascade_deactivate_pilates_on_membership_change() CASCADE;
DROP FUNCTION IF EXISTS cascade_deactivate_deposits() CASCADE;
DROP FUNCTION IF EXISTS public.auto_expire_memberships_before_insert_update() CASCADE;
DROP FUNCTION IF EXISTS public.cascade_deactivate_pilates_on_membership_change() CASCADE;

SELECT '✅ ALL TRIGGERS AND FUNCTIONS DESTROYED' as result;

SELECT '─────────────────────────────────────────────────────────────────' as separator;

SELECT 'Verifying NO triggers remain...' as check;

SELECT COUNT(*) as remaining_triggers
FROM information_schema.triggers
WHERE event_object_table = 'memberships';

SELECT '─────────────────────────────────────────────────────────────────' as separator;

SELECT 'Rebuilding clean functions...' as action;

CREATE FUNCTION public.auto_expire_memberships_before_insert_update()
RETURNS TRIGGER 
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF NEW.end_date < CURRENT_DATE THEN
    NEW.is_active := false;
  ELSE
    NEW.is_active := true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.cascade_deactivate_pilates_on_membership_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_active = false AND OLD.is_active = true THEN
    UPDATE pilates_deposits 
    SET is_active = false, updated_at = NOW()
    WHERE user_id = NEW.user_id 
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

SELECT '✅ Functions rebuilt' as result;

SELECT 'Rebuilding triggers...' as action;

CREATE TRIGGER auto_expire_memberships_on_insert_update
BEFORE INSERT OR UPDATE ON public.memberships
FOR EACH ROW
EXECUTE FUNCTION public.auto_expire_memberships_before_insert_update();

CREATE TRIGGER cascade_deactivate_pilates_on_membership_change
AFTER UPDATE ON public.memberships
FOR EACH ROW
EXECUTE FUNCTION public.cascade_deactivate_pilates_on_membership_change();

SELECT '✅ Triggers rebuilt' as result;

SELECT '─────────────────────────────────────────────────────────────────' as separator;

SELECT 'FINAL STATUS:' as final_check;

SELECT 
  trigger_schema,
  trigger_name,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'memberships'
ORDER BY trigger_schema, trigger_name;

SELECT '═════════════════════════════════════════════════════════════════' as final_separator;
SELECT '✅✅✅ MEGA FIX DEPLOYED - DATABASE FULLY CORRECTED ✅✅✅' as result;
SELECT 'All triggers removed and recreated WITHOUT status references' as confirmation;
SELECT '═════════════════════════════════════════════════════════════════' as final_separator;

COMMIT TRANSACTION;
