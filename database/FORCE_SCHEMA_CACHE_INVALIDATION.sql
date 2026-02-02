-- ═══════════════════════════════════════════════════════════════════════════════
-- FORCE SCHEMA CACHE INVALIDATION
-- Αναγκάζει το Supabase REST API να ανανεώσει το schema
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN TRANSACTION;

-- STEP 1: Drop ALL old triggers completely
SELECT 'Dropping all triggers...' as action;

DROP TRIGGER IF EXISTS auto_expire_memberships_on_insert_update ON public.memberships CASCADE;
DROP TRIGGER IF EXISTS cascade_deactivate_pilates_on_membership_change ON public.memberships CASCADE;

SELECT '✅ Triggers dropped' as result;

-- STEP 2: Drop ALL old functions
SELECT 'Dropping all functions...' as action;

DROP FUNCTION IF EXISTS public.auto_expire_memberships_before_insert_update() CASCADE;
DROP FUNCTION IF EXISTS public.cascade_deactivate_pilates_on_membership_change() CASCADE;

SELECT '✅ Functions dropped' as result;

-- STEP 3: Force schema cache invalidation by modifying the table
SELECT 'Forcing schema cache invalidation...' as action;

-- Add a temporary column to force schema reload
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS _cache_invalidation TIMESTAMPTZ DEFAULT NOW();

-- Now drop it - this forces Supabase to reload the schema
ALTER TABLE public.memberships DROP COLUMN IF EXISTS _cache_invalidation;

SELECT '✅ Schema cache invalidated' as result;

-- STEP 4: Rebuild functions with NO caching issues
SELECT 'Rebuilding functions...' as action;

CREATE FUNCTION public.auto_expire_memberships_before_insert_update()
RETURNS TRIGGER 
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
AS $$
BEGIN
  IF (NEW.end_date < CURRENT_DATE) THEN
    NEW.is_active := FALSE;
  ELSE
    NEW.is_active := TRUE;
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.cascade_deactivate_pilates_on_membership_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
AS $$
BEGIN
  IF (NEW.is_active IS DISTINCT FROM OLD.is_active) AND (NEW.is_active = FALSE) THEN
    UPDATE public.pilates_deposits 
    SET is_active = FALSE, updated_at = NOW()
    WHERE user_id = NEW.user_id 
      AND is_active = TRUE;
  END IF;
  RETURN NEW;
END;
$$;

SELECT '✅ Functions rebuilt' as result;

-- STEP 5: Rebuild triggers
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

-- STEP 6: Force another schema cache invalidation
SELECT 'Final schema cache invalidation...' as action;

ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS _final_cache_invalidation TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.memberships DROP COLUMN IF EXISTS _final_cache_invalidation;

SELECT '✅ Final invalidation complete' as result;

SELECT '─────────────────────────────────────────────────────────────────' as separator;

SELECT 'VERIFICATION:' as check;

SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'memberships'
ORDER BY trigger_name;

SELECT '═════════════════════════════════════════════════════════════════' as final;
SELECT '✅ FORCE SCHEMA CACHE INVALIDATION COMPLETE' as result;
SELECT 'REST API should now recognize correct schema' as note;
SELECT '═════════════════════════════════════════════════════════════════' as final;

COMMIT TRANSACTION;
