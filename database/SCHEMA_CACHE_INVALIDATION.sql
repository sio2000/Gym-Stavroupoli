-- ═══════════════════════════════════════════════════════════════════════════════
-- SCHEMA CACHE INVALIDATION: Force rebuild with no caching
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN TRANSACTION;

SELECT 'Force dropping ALL triggers with aggressive cascade...' as action;

-- Drop ALL triggers with full cascade on public schema
DROP TRIGGER IF EXISTS auto_expire_memberships_on_insert_update ON public.memberships CASCADE;
DROP TRIGGER IF EXISTS cascade_deactivate_pilates_on_membership_change ON public.memberships CASCADE;

-- Also try without schema prefix
DROP TRIGGER IF EXISTS auto_expire_memberships_on_insert_update ON memberships CASCADE;
DROP TRIGGER IF EXISTS cascade_deactivate_pilates_on_membership_change ON memberships CASCADE;

-- Force drop ALL functions with CASCADE
DROP FUNCTION IF EXISTS public.auto_expire_memberships_before_insert_update() CASCADE;
DROP FUNCTION IF EXISTS public.cascade_deactivate_pilates_on_membership_change() CASCADE;
DROP FUNCTION IF EXISTS auto_expire_memberships_before_insert_update() CASCADE;
DROP FUNCTION IF EXISTS cascade_deactivate_pilates_on_membership_change() CASCADE;

SELECT '✅ All triggers and functions force-dropped' as result;

-- Small delay
SELECT pg_sleep(0.5) as delay;

SELECT 'Rebuilding functions WITHOUT IMMUTABLE (no caching)...' as action;

-- Function 1 - WITHOUT IMMUTABLE to avoid caching
CREATE FUNCTION public.auto_expire_memberships_before_insert_update()
RETURNS TRIGGER 
LANGUAGE plpgsql
STRICT
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired BOOLEAN;
BEGIN
  v_expired := NEW.end_date < CURRENT_DATE;
  
  IF v_expired THEN
    NEW.is_active := false;
  ELSE
    NEW.is_active := true;
  END IF;
  
  RETURN NEW;
END;
$$;

SELECT '✅ Function 1 created (no IMMUTABLE)' as result;

-- Function 2 - cascade deactivation
CREATE FUNCTION public.cascade_deactivate_pilates_on_membership_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
STRICT
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.is_active IS FALSE) AND (OLD.is_active IS TRUE) THEN
    UPDATE public.pilates_deposits 
    SET is_active = false, updated_at = NOW()
    WHERE user_id = NEW.user_id 
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;

SELECT '✅ Function 2 created' as result;

SELECT 'Creating triggers...' as action;

-- Trigger 1
CREATE TRIGGER auto_expire_memberships_on_insert_update
BEFORE INSERT OR UPDATE ON public.memberships
FOR EACH ROW
EXECUTE FUNCTION public.auto_expire_memberships_before_insert_update();

SELECT '✅ Trigger 1 created' as result;

-- Trigger 2
CREATE TRIGGER cascade_deactivate_pilates_on_membership_change
AFTER UPDATE ON public.memberships
FOR EACH ROW
EXECUTE FUNCTION public.cascade_deactivate_pilates_on_membership_change();

SELECT '✅ Trigger 2 created' as result;

SELECT 'Verifying triggers...' as action;

SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'memberships'
ORDER BY trigger_name;

SELECT '═════════════════════════════════════════════════════════════════' as final;
SELECT '✅ SCHEMA CACHE RESET - Functions rebuilt without IMMUTABLE' as result;
SELECT '═════════════════════════════════════════════════════════════════' as final;

COMMIT TRANSACTION;
