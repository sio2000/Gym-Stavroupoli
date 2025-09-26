-- Pilates Deposits rollback (DOWN)

DROP VIEW IF EXISTS public.pilates_slots_with_occupancy;

DROP FUNCTION IF EXISTS public.check_and_expire_pilates_deposits();
DROP FUNCTION IF EXISTS public.cancel_pilates_booking(uuid, uuid);
DROP FUNCTION IF EXISTS public.book_pilates_class(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_active_pilates_deposit(uuid);

-- Drop constraints first (will be auto-dropped with table, but explicit for clarity)
ALTER TABLE IF EXISTS public.pilates_deposits DROP CONSTRAINT IF EXISTS pilates_deposits_non_negative;

-- Drop policies if exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pilates_deposits' AND policyname='pilates_deposits_select_own_or_admin') THEN
    DROP POLICY pilates_deposits_select_own_or_admin ON public.pilates_deposits;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pilates_deposits' AND policyname='pilates_deposits_modify_admin_only') THEN
    DROP POLICY pilates_deposits_modify_admin_only ON public.pilates_deposits;
  END IF;
END$$;

DROP INDEX IF EXISTS public.idx_pilates_deposits_active;
DROP INDEX IF EXISTS public.idx_pilates_deposits_user;

DROP TABLE IF EXISTS public.pilates_deposits;


