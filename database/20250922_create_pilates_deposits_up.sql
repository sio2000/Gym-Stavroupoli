-- Pilates Deposits: table, constraints, RPCs, and cron expiration (UP)
-- Safe, idempotent where possible; use CONCURRENTLY for indexes

-- 1) Enable required extensions (safe if exists)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Table: pilates_deposits
CREATE TABLE IF NOT EXISTS public.pilates_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  package_id uuid REFERENCES public.membership_packages(id) ON DELETE SET NULL,
  deposit_remaining integer NOT NULL DEFAULT 0,
  credited_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3) Indexes (CONCURRENTLY requires separate transaction blocks in psql; Supabase migration runner may not allow). Using regular for compatibility.
CREATE INDEX IF NOT EXISTS idx_pilates_deposits_user ON public.pilates_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_pilates_deposits_active ON public.pilates_deposits(is_active);

-- 4) RLS (align with existing patterns)
ALTER TABLE public.pilates_deposits ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  -- simple policies: owners can read, admins can manage (assume role claim exists)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pilates_deposits' AND policyname = 'pilates_deposits_select_own_or_admin'
  ) THEN
    CREATE POLICY pilates_deposits_select_own_or_admin ON public.pilates_deposits
      FOR SELECT USING (
        auth.uid() = user_id OR (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pilates_deposits' AND policyname = 'pilates_deposits_modify_admin_only'
  ) THEN
    CREATE POLICY pilates_deposits_modify_admin_only ON public.pilates_deposits
      FOR ALL USING (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
      ) WITH CHECK (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
      );
  END IF;
END$$;

-- 5) Prevent negative deposits at DB level
ALTER TABLE public.pilates_deposits
  ADD CONSTRAINT pilates_deposits_non_negative CHECK (deposit_remaining >= 0);

-- 6) Helper: get active deposit for user (the most recent active)
CREATE OR REPLACE FUNCTION public.get_active_pilates_deposit(p_user_id uuid)
RETURNS public.pilates_deposits AS $$
  SELECT * FROM public.pilates_deposits
  WHERE user_id = p_user_id AND is_active = true
  ORDER BY credited_at DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- 7) Atomic booking RPC: decrements deposit and inserts booking if capacity allows
--    Ensures idempotency via unique(user_id, slot_id)
CREATE OR REPLACE FUNCTION public.book_pilates_class(p_user_id uuid, p_slot_id uuid)
RETURNS TABLE (booking_id uuid, deposit_remaining integer) AS $$
DECLARE
  v_deposit public.pilates_deposits;
  v_capacity integer;
  v_booked integer;
  v_existing uuid;
BEGIN
  -- check existing booking
  SELECT id INTO v_existing FROM public.pilates_bookings 
  WHERE user_id = p_user_id AND slot_id = p_slot_id AND status = 'confirmed';
  IF v_existing IS NOT NULL THEN
    -- return current deposit state without double-decrement
    SELECT * INTO v_deposit FROM public.get_active_pilates_deposit(p_user_id);
    RETURN QUERY SELECT v_existing, COALESCE(v_deposit.deposit_remaining, 0);
    RETURN;
  END IF;

  -- check slot capacity
  SELECT max_capacity INTO v_capacity FROM public.pilates_schedule_slots WHERE id = p_slot_id AND is_active = true;
  IF v_capacity IS NULL THEN
    RAISE EXCEPTION 'Slot not available';
  END IF;
  SELECT COUNT(*) INTO v_booked FROM public.pilates_bookings WHERE slot_id = p_slot_id AND status = 'confirmed';
  IF v_booked >= v_capacity THEN
    RAISE EXCEPTION 'Slot full';
  END IF;

  -- get active deposit
  SELECT * INTO v_deposit FROM public.get_active_pilates_deposit(p_user_id);
  IF v_deposit.id IS NULL OR v_deposit.is_active = false OR v_deposit.deposit_remaining <= 0 THEN
    RAISE EXCEPTION 'No active deposit';
  END IF;

  -- atomic: lock deposit row to avoid race
  PERFORM 1 FROM public.pilates_deposits WHERE id = v_deposit.id FOR UPDATE;

  -- re-check deposit after lock
  SELECT deposit_remaining INTO v_deposit.deposit_remaining FROM public.pilates_deposits WHERE id = v_deposit.id;
  IF v_deposit.deposit_remaining <= 0 THEN
    RAISE EXCEPTION 'Deposit empty';
  END IF;

  -- decrement deposit (fully qualify to avoid ambiguity)
  UPDATE public.pilates_deposits AS pd
    SET deposit_remaining = pd.deposit_remaining - 1,
        updated_at = now(),
        is_active = CASE WHEN pd.deposit_remaining - 1 <= 0 THEN false ELSE pd.is_active END
    WHERE pd.id = v_deposit.id;

  -- create booking
  INSERT INTO public.pilates_bookings (user_id, slot_id, status)
  VALUES (p_user_id, p_slot_id, 'confirmed')
  ON CONFLICT (user_id, slot_id) DO NOTHING
  RETURNING id INTO v_existing;

  IF v_existing IS NULL THEN
    -- booking already existed concurrently; revert decrement we just did
    UPDATE public.pilates_deposits
      SET deposit_remaining = deposit_remaining + 1,
          is_active = true,
          updated_at = now()
      WHERE id = v_deposit.id;
    -- return current state
    SELECT * INTO v_deposit FROM public.get_active_pilates_deposit(p_user_id);
    RETURN QUERY SELECT (SELECT id FROM public.pilates_bookings WHERE user_id=p_user_id AND slot_id=p_slot_id AND status='confirmed' LIMIT 1), COALESCE(v_deposit.deposit_remaining,0);
    RETURN;
  END IF;

  -- success: return updated remaining
  SELECT pd.deposit_remaining INTO v_deposit.deposit_remaining FROM public.pilates_deposits pd WHERE pd.id = v_deposit.id;
  RETURN QUERY SELECT v_existing, v_deposit.deposit_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8) Cancel booking RPC: sets status cancelled and restores deposit if applicable
CREATE OR REPLACE FUNCTION public.cancel_pilates_booking(p_booking_id uuid, p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_slot uuid;
  v_was_confirmed boolean;
  v_deposit_id uuid;
  v_restored integer := 0;
BEGIN
  SELECT slot_id, (status = 'confirmed') INTO v_slot, v_was_confirmed FROM public.pilates_bookings WHERE id = p_booking_id AND user_id = p_user_id;
  IF v_slot IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  UPDATE public.pilates_bookings SET status = 'cancelled', updated_at = now() WHERE id = p_booking_id;

  IF v_was_confirmed THEN
    -- restore to latest active or last deposit
    SELECT id INTO v_deposit_id FROM public.pilates_deposits WHERE user_id = p_user_id ORDER BY credited_at DESC LIMIT 1 FOR UPDATE;
    IF v_deposit_id IS NOT NULL THEN
      UPDATE public.pilates_deposits SET deposit_remaining = deposit_remaining + 1, is_active = true, updated_at = now() WHERE id = v_deposit_id;
      v_restored := 1;
    END IF;
  END IF;

  RETURN v_restored;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9) Expiration function: deactivates deposits when expired or empty
CREATE OR REPLACE FUNCTION public.check_and_expire_pilates_deposits()
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.pilates_deposits
    SET is_active = false,
        updated_at = now()
    WHERE is_active = true AND (
      deposit_remaining <= 0 OR (expires_at IS NOT NULL AND expires_at < now())
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 10) Occupancy view for fast aggregates
CREATE OR REPLACE VIEW public.pilates_slots_with_occupancy AS
SELECT s.id AS slot_id,
       s.date,
       s.start_time,
       s.end_time,
       s.max_capacity,
       s.is_active,
       COALESCE(b.booked_count, 0) AS booked_count
FROM public.pilates_schedule_slots s
LEFT JOIN (
  SELECT slot_id, COUNT(*) AS booked_count
  FROM public.pilates_bookings
  WHERE status = 'confirmed'
  GROUP BY slot_id
) b ON b.slot_id = s.id;

-- NOTE: Scheduling of check_and_expire_pilates_deposits should be done via Supabase cron (config outside SQL), documented in PR.


