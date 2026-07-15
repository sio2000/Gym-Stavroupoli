-- ============================================================================
-- NEW PERSONAL SYSTEM (PERSONAL ΑΤΟΜΙΚΟ + ΟΜΑΔΙΚΟ WOD) - UP MIGRATION
-- ============================================================================
-- Replaces the legacy personal_training_schedules-based Personal system.
-- Legacy tables are NOT dropped (data preserved, UI stops using them).
--
-- Creates:
--   1. package_type 'personal' + two packages (Personal Ατομικό, Ομαδικό WOD)
--   2. memberships.duration_type value 'personal_freestyle'
--   3. personal_subscriptions   (subscription metadata per membership)
--   4. personal_class_slots     (trainer-created lesson slots)
--   5. personal_bookings        (bookings per slot/user)
--   6. personal_deposits        (lesson credits per subscription)
--   7. personal_weekly_refills  (weekly top-up audit for WOD self-booking)
--   8. personal_slots_with_occupancy view
--   9. RPCs: book_personal_class, cancel_personal_booking,
--            process_personal_weekly_refills, get_personal_refill_status
--  10. RLS policies (pattern: ENABLE_PILATES_RLS_CRITICAL.sql)
--
-- Idempotent: safe to run multiple times.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1) Extend membership_packages.package_type CHECK with 'personal'
-- ============================================================================
DO $$
DECLARE
  v_conname text;
BEGIN
  SELECT c.conname INTO v_conname
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'membership_packages'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%package_type%';

  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.membership_packages DROP CONSTRAINT %I', v_conname);
  END IF;

  ALTER TABLE public.membership_packages
    ADD CONSTRAINT membership_packages_package_type_check
    CHECK (package_type = ANY (ARRAY['standard'::text, 'free_gym'::text, 'pilates'::text, 'ultimate'::text, 'personal'::text]));
EXCEPTION WHEN duplicate_object THEN
  NULL; -- constraint already correct
END$$;

-- ============================================================================
-- 2) Extend memberships.duration_type CHECK with 'personal_freestyle'
-- ============================================================================
DO $$
DECLARE
  v_conname text;
  v_def text;
BEGIN
  SELECT c.conname, pg_get_constraintdef(c.oid) INTO v_conname, v_def
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'memberships'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%duration_type%';

  IF v_conname IS NOT NULL AND v_def NOT ILIKE '%personal_freestyle%' THEN
    EXECUTE format('ALTER TABLE public.memberships DROP CONSTRAINT %I', v_conname);
    ALTER TABLE public.memberships
      ADD CONSTRAINT memberships_duration_type_check
      CHECK (duration_type = ANY (ARRAY[
        'year'::text, 'semester'::text, '3 Μήνες'::text, 'month'::text, 'lesson'::text,
        'pilates_trial'::text, 'pilates_1month'::text, 'pilates_2months'::text,
        'pilates_3months'::text, 'pilates_6months'::text, 'pilates_1year'::text,
        'ultimate_1year'::text, 'personal_freestyle'::text
      ]));
  END IF;
END$$;

-- ============================================================================
-- 3) Packages: Personal Ατομικό + Ομαδικό WOD
--    price = 0 (η γραμματεία πληκτρολογεί ποσό/points σε κάθε αγορά)
--    ΔΕΝ εμφανίζονται στο user-side Membership page (φιλτράρει ονόματα).
-- ============================================================================
INSERT INTO public.membership_packages (name, description, price, duration_days, package_type, is_active)
SELECT 'Personal Ατομικό', 'Νέο σύστημα Personal - Ατομικά μαθήματα (κλείνονται από τη γραμματεία)', 0, 30, 'personal', true
WHERE NOT EXISTS (SELECT 1 FROM public.membership_packages WHERE name = 'Personal Ατομικό');

INSERT INTO public.membership_packages (name, description, price, duration_days, package_type, is_active)
SELECT 'Ομαδικό WOD', 'Νέο σύστημα Personal - Ομαδικά μαθήματα WOD', 0, 30, 'personal', true
WHERE NOT EXISTS (SELECT 1 FROM public.membership_packages WHERE name = 'Ομαδικό WOD');

-- ============================================================================
-- 4) personal_subscriptions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.personal_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  membership_id uuid NOT NULL UNIQUE REFERENCES public.memberships(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('personal', 'wod')),
  booking_mode text NOT NULL CHECK (booking_mode IN ('self', 'staff')),
  weekly_frequency integer CHECK (weekly_frequency IS NULL OR (weekly_frequency >= 1 AND weekly_frequency <= 7)),
  total_lessons integer NOT NULL CHECK (total_lessons > 0),
  duration_weeks integer CHECK (duration_weeks IS NULL OR duration_weeks > 0),
  is_freestyle boolean NOT NULL DEFAULT false,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT personal_subscriptions_mode_valid CHECK (
    -- PERSONAL ΑΤΟΜΙΚΟ: πάντα "εμείς τους κλείνουμε"
    (kind = 'personal' AND booking_mode = 'staff') OR kind = 'wod'
  )
);

CREATE INDEX IF NOT EXISTS idx_personal_subscriptions_user ON public.personal_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_subscriptions_active ON public.personal_subscriptions(is_active, end_date);

-- ============================================================================
-- 5) personal_class_slots
--    Default χωρητικότητα ορίζεται στο app: personal=1, wod=10 (αλλάζει ανά μάθημα)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.personal_class_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('personal', 'wod')),
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  max_capacity integer NOT NULL CHECK (max_capacity > 0),
  trainer_name text NOT NULL,
  room text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT personal_class_slots_time_valid CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_personal_class_slots_date ON public.personal_class_slots(date, start_time);
CREATE INDEX IF NOT EXISTS idx_personal_class_slots_kind ON public.personal_class_slots(kind, is_active);

-- ============================================================================
-- 6) personal_bookings
--    booking_source: 'user' (έκλεισε μόνος του) | 'staff' (γραμματεία/trainer)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.personal_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES public.personal_class_slots(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.personal_subscriptions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  booking_source text NOT NULL DEFAULT 'user' CHECK (booking_source IN ('user', 'staff')),
  booked_by uuid REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT personal_bookings_slot_user_unique UNIQUE (slot_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_personal_bookings_user ON public.personal_bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_personal_bookings_slot ON public.personal_bookings(slot_id, status);

-- ============================================================================
-- 7) personal_deposits (πιστώσεις μαθημάτων)
--    staff mode: όλα τα μαθήματα upfront (deposit = total_lessons)
--    self  mode (WOD): weekly top-up στο weekly_target, χωρίς μεταφορά
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.personal_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL UNIQUE REFERENCES public.personal_subscriptions(id) ON DELETE CASCADE,
  deposit_remaining integer NOT NULL DEFAULT 0 CHECK (deposit_remaining >= 0),
  weekly_target integer CHECK (weekly_target IS NULL OR weekly_target > 0),
  credited_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personal_deposits_user ON public.personal_deposits(user_id, is_active);

-- ============================================================================
-- 8) personal_weekly_refills (audit εβδομαδιαίων ανανεώσεων)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.personal_weekly_refills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.personal_subscriptions(id) ON DELETE CASCADE,
  refill_date date NOT NULL,
  refill_week_number integer NOT NULL CHECK (refill_week_number > 0),
  previous_deposit_amount integer NOT NULL,
  new_deposit_amount integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT personal_weekly_refills_unique UNIQUE (subscription_id, refill_week_number)
);

-- ============================================================================
-- 9) Occupancy view
-- ============================================================================
CREATE OR REPLACE VIEW public.personal_slots_with_occupancy AS
SELECT s.id AS slot_id,
       s.kind,
       s.date,
       s.start_time,
       s.end_time,
       s.max_capacity,
       s.trainer_name,
       s.room,
       s.notes,
       s.is_active,
       s.created_by,
       COALESCE(b.booked_count, 0) AS booked_count
FROM public.personal_class_slots s
LEFT JOIN (
  SELECT slot_id, COUNT(*) AS booked_count
  FROM public.personal_bookings
  WHERE status = 'confirmed'
  GROUP BY slot_id
) b ON b.slot_id = s.id;

-- ============================================================================
-- 10) RPC: get active personal subscription (server-side helper)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_active_personal_subscription(p_user_id uuid, p_kind text DEFAULT NULL)
RETURNS SETOF public.personal_subscriptions AS $$
  SELECT ps.*
  FROM public.personal_subscriptions ps
  JOIN public.memberships m ON m.id = ps.membership_id
  WHERE ps.user_id = p_user_id
    AND ps.is_active = true
    AND m.status = 'active'
    AND m.deleted_at IS NULL
    AND m.end_date >= CURRENT_DATE
    AND (p_kind IS NULL OR ps.kind = p_kind)
  ORDER BY ps.created_at DESC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- 11) RPC: book_personal_class (atomic, μοντέλο book_pilates_class)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.book_personal_class(
  p_user_id uuid,
  p_slot_id uuid,
  p_booked_by uuid DEFAULT NULL,
  p_source text DEFAULT 'user'
)
RETURNS TABLE (booking_id uuid, deposit_remaining integer) AS $$
DECLARE
  v_slot public.personal_class_slots;
  v_sub public.personal_subscriptions;
  v_deposit public.personal_deposits;
  v_booked integer;
  v_existing public.personal_bookings;
  v_new_id uuid;
BEGIN
  IF p_source NOT IN ('user', 'staff') THEN
    RAISE EXCEPTION 'Invalid booking source';
  END IF;

  -- slot
  SELECT * INTO v_slot FROM public.personal_class_slots
  WHERE id = p_slot_id AND is_active = true;
  IF v_slot.id IS NULL THEN
    RAISE EXCEPTION 'Slot not available';
  END IF;

  -- active subscription matching slot kind
  SELECT * INTO v_sub FROM public.get_active_personal_subscription(p_user_id, v_slot.kind) LIMIT 1;
  IF v_sub.id IS NULL THEN
    RAISE EXCEPTION 'No active membership';
  END IF;

  -- booking mode enforcement:
  -- staff mode subscriptions: μόνο γραμματεία/trainer κλείνει
  IF v_sub.booking_mode = 'staff' AND p_source = 'user' THEN
    RAISE EXCEPTION 'Staff booking only';
  END IF;

  -- το slot πρέπει να είναι εντός περιόδου συνδρομής
  IF v_slot.date < v_sub.start_date OR v_slot.date > v_sub.end_date THEN
    RAISE EXCEPTION 'Slot outside subscription period';
  END IF;

  -- existing booking (unique slot_id+user_id)
  SELECT * INTO v_existing FROM public.personal_bookings
  WHERE user_id = p_user_id AND slot_id = p_slot_id;
  IF v_existing.id IS NOT NULL AND v_existing.status = 'confirmed' THEN
    SELECT * INTO v_deposit FROM public.personal_deposits WHERE subscription_id = v_sub.id;
    RETURN QUERY SELECT v_existing.id, COALESCE(v_deposit.deposit_remaining, 0);
    RETURN;
  END IF;

  -- capacity
  SELECT COUNT(*) INTO v_booked FROM public.personal_bookings
  WHERE slot_id = p_slot_id AND status = 'confirmed';
  IF v_booked >= v_slot.max_capacity THEN
    RAISE EXCEPTION 'Slot full';
  END IF;

  -- deposit (lock)
  SELECT * INTO v_deposit FROM public.personal_deposits
  WHERE subscription_id = v_sub.id FOR UPDATE;
  IF v_deposit.id IS NULL OR v_deposit.is_active = false OR v_deposit.deposit_remaining <= 0 THEN
    RAISE EXCEPTION 'No active deposit';
  END IF;
  IF v_deposit.expires_at IS NOT NULL AND v_deposit.expires_at < now() THEN
    RAISE EXCEPTION 'Deposit expired';
  END IF;

  -- decrement
  UPDATE public.personal_deposits pd
    SET deposit_remaining = pd.deposit_remaining - 1,
        updated_at = now()
    WHERE pd.id = v_deposit.id;

  -- insert or reactivate booking
  IF v_existing.id IS NOT NULL THEN
    UPDATE public.personal_bookings
      SET status = 'confirmed',
          booking_source = p_source,
          booked_by = COALESCE(p_booked_by, p_user_id),
          subscription_id = v_sub.id,
          updated_at = now()
      WHERE id = v_existing.id;
    v_new_id := v_existing.id;
  ELSE
    INSERT INTO public.personal_bookings (slot_id, user_id, subscription_id, status, booking_source, booked_by)
    VALUES (p_slot_id, p_user_id, v_sub.id, 'confirmed', p_source, COALESCE(p_booked_by, p_user_id))
    RETURNING id INTO v_new_id;
  END IF;

  SELECT pd.deposit_remaining INTO v_deposit.deposit_remaining
  FROM public.personal_deposits pd WHERE pd.id = v_deposit.id;

  RETURN QUERY SELECT v_new_id, v_deposit.deposit_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 12) RPC: cancel_personal_booking (επιστρέφει πίστωση)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cancel_personal_booking(p_booking_id uuid, p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_booking public.personal_bookings;
  v_deposit_id uuid;
  v_restored integer := 0;
BEGIN
  SELECT * INTO v_booking FROM public.personal_bookings
  WHERE id = p_booking_id AND user_id = p_user_id;
  IF v_booking.id IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking.status <> 'confirmed' THEN
    RETURN 0;
  END IF;

  UPDATE public.personal_bookings
    SET status = 'cancelled', updated_at = now()
    WHERE id = p_booking_id;

  SELECT id INTO v_deposit_id FROM public.personal_deposits
  WHERE subscription_id = v_booking.subscription_id FOR UPDATE;
  IF v_deposit_id IS NOT NULL THEN
    UPDATE public.personal_deposits
      SET deposit_remaining = deposit_remaining + 1, is_active = true, updated_at = now()
      WHERE id = v_deposit_id;
    v_restored := 1;
  END IF;

  RETURN v_restored;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 13) RPC: process_personal_weekly_refills
--     Top-up στο weekly_target για ενεργές WOD self συνδρομές (χωρίς μεταφορά).
--     Καλείται από το app (page load) - μοντέλο Ultimate refill.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_personal_weekly_refills()
RETURNS TABLE (processed_count integer) AS $$
DECLARE
  v_sub RECORD;
  v_week integer;
  v_prev integer;
  v_count integer := 0;
BEGIN
  FOR v_sub IN
    SELECT ps.id, ps.user_id, ps.start_date, ps.end_date, pd.id AS deposit_id,
           pd.deposit_remaining, pd.weekly_target
    FROM public.personal_subscriptions ps
    JOIN public.memberships m ON m.id = ps.membership_id
    JOIN public.personal_deposits pd ON pd.subscription_id = ps.id
    WHERE ps.is_active = true
      AND ps.booking_mode = 'self'
      AND pd.weekly_target IS NOT NULL
      AND m.status = 'active'
      AND m.deleted_at IS NULL
      AND m.end_date >= CURRENT_DATE
      AND ps.start_date <= CURRENT_DATE
      AND ps.end_date >= CURRENT_DATE
  LOOP
    -- τρέχουσα εβδομάδα από την ενεργοποίηση (week 1 = start_date)
    v_week := FLOOR((CURRENT_DATE - v_sub.start_date) / 7) + 1;

    -- week 1 πιστώνεται στην αγορά, refills από week 2
    IF v_week >= 2 AND NOT EXISTS (
      SELECT 1 FROM public.personal_weekly_refills
      WHERE subscription_id = v_sub.id AND refill_week_number = v_week
    ) THEN
      v_prev := v_sub.deposit_remaining;

      UPDATE public.personal_deposits
        SET deposit_remaining = v_sub.weekly_target,
            is_active = true,
            updated_at = now()
        WHERE id = v_sub.deposit_id;

      INSERT INTO public.personal_weekly_refills
        (user_id, subscription_id, refill_date, refill_week_number, previous_deposit_amount, new_deposit_amount)
      VALUES
        (v_sub.user_id, v_sub.id, CURRENT_DATE, v_week, v_prev, v_sub.weekly_target)
      ON CONFLICT (subscription_id, refill_week_number) DO NOTHING;

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 14) RPC: get_personal_refill_status (για εμφάνιση "επόμενο refill")
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_personal_refill_status(p_user_id uuid)
RETURNS TABLE (
  subscription_id uuid,
  next_refill_date date,
  next_refill_week integer,
  current_deposit_amount integer,
  target_deposit_amount integer
) AS $$
  SELECT ps.id AS subscription_id,
         (ps.start_date + (FLOOR((CURRENT_DATE - ps.start_date) / 7) + 1) * 7)::date AS next_refill_date,
         (FLOOR((CURRENT_DATE - ps.start_date) / 7) + 2)::integer AS next_refill_week,
         pd.deposit_remaining AS current_deposit_amount,
         pd.weekly_target AS target_deposit_amount
  FROM public.personal_subscriptions ps
  JOIN public.memberships m ON m.id = ps.membership_id
  JOIN public.personal_deposits pd ON pd.subscription_id = ps.id
  WHERE ps.user_id = p_user_id
    AND ps.is_active = true
    AND ps.booking_mode = 'self'
    AND pd.weekly_target IS NOT NULL
    AND m.status = 'active'
    AND m.deleted_at IS NULL
    AND m.end_date >= CURRENT_DATE
  ORDER BY ps.created_at DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- 15) RLS
-- ============================================================================
ALTER TABLE public.personal_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_class_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_weekly_refills ENABLE ROW LEVEL SECURITY;

-- personal_subscriptions
DROP POLICY IF EXISTS "personal_subscriptions_select" ON public.personal_subscriptions;
CREATE POLICY "personal_subscriptions_select" ON public.personal_subscriptions
  FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'secretary', 'trainer')
    )
  );
DROP POLICY IF EXISTS "personal_subscriptions_manage" ON public.personal_subscriptions;
CREATE POLICY "personal_subscriptions_manage" ON public.personal_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'secretary')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'secretary')
    )
  );

-- personal_class_slots: όλοι οι authenticated βλέπουν ενεργά slots,
-- admin/secretary/trainer διαχειρίζονται
DROP POLICY IF EXISTS "personal_class_slots_select" ON public.personal_class_slots;
CREATE POLICY "personal_class_slots_select" ON public.personal_class_slots
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "personal_class_slots_manage" ON public.personal_class_slots;
CREATE POLICY "personal_class_slots_manage" ON public.personal_class_slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'secretary', 'trainer')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'secretary', 'trainer')
    )
  );

-- personal_bookings: χρήστης βλέπει δικές του, staff βλέπει όλες
DROP POLICY IF EXISTS "personal_bookings_select" ON public.personal_bookings;
CREATE POLICY "personal_bookings_select" ON public.personal_bookings
  FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'secretary', 'trainer')
    )
  );
DROP POLICY IF EXISTS "personal_bookings_manage" ON public.personal_bookings;
CREATE POLICY "personal_bookings_manage" ON public.personal_bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'secretary', 'trainer')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'secretary', 'trainer')
    )
  );

-- personal_deposits: owner read, staff manage
DROP POLICY IF EXISTS "personal_deposits_select" ON public.personal_deposits;
CREATE POLICY "personal_deposits_select" ON public.personal_deposits
  FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'secretary', 'trainer')
    )
  );
DROP POLICY IF EXISTS "personal_deposits_manage" ON public.personal_deposits;
CREATE POLICY "personal_deposits_manage" ON public.personal_deposits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'secretary')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'secretary')
    )
  );

-- personal_weekly_refills: owner read, staff read
DROP POLICY IF EXISTS "personal_weekly_refills_select" ON public.personal_weekly_refills;
CREATE POLICY "personal_weekly_refills_select" ON public.personal_weekly_refills
  FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'secretary', 'trainer')
    )
  );

-- ============================================================================
-- 16) Grants (RPCs εκτελούνται από authenticated)
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.get_active_personal_subscription(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_personal_class(uuid, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_personal_booking(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_personal_weekly_refills() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_personal_refill_status(uuid) TO authenticated;

-- ============================================================================
-- DONE
-- ============================================================================
SELECT 'NEW_PERSONAL_SYSTEM_UP applied successfully' AS result;
