-- ═══════════════════════════════════════════════════════════════
-- FINAL COMPLETE PILATES BOOKING FIX - IDEMPOTENT VERSION
-- Safe to run multiple times - DROP IF EXISTS before CREATE
-- ═══════════════════════════════════════════════════════════════

-- PART 1: Fix RPC Function (Ambiguous Column Error)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.book_pilates_class(p_user_id uuid, p_slot_id uuid)
RETURNS TABLE (booking_id uuid, deposit_remaining integer) AS $$
DECLARE
  v_deposit public.pilates_deposits;
  v_capacity integer;
  v_booked integer;
  v_existing uuid;
  v_updated_deposit integer;  -- FIX: Explicit variable to avoid ambiguity
BEGIN
  -- check existing booking
  SELECT id INTO v_existing FROM public.pilates_bookings 
  WHERE user_id = p_user_id AND slot_id = p_slot_id AND status = 'confirmed';
  IF v_existing IS NOT NULL THEN
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

  -- re-check deposit after lock (FIX: fully qualified)
  SELECT pd.deposit_remaining INTO v_updated_deposit 
  FROM public.pilates_deposits pd 
  WHERE pd.id = v_deposit.id;
  
  IF v_updated_deposit <= 0 THEN
    RAISE EXCEPTION 'Deposit empty';
  END IF;

  -- decrement deposit
  UPDATE public.pilates_deposits AS pd
    SET deposit_remaining = pd.deposit_remaining - 1,
        updated_at = now(),
        is_active = CASE WHEN pd.deposit_remaining - 1 <= 0 THEN false ELSE pd.is_active END
    WHERE pd.id = v_deposit.id;

  -- create booking (no ON CONFLICT - will handle duplicates manually)
  INSERT INTO public.pilates_bookings (user_id, slot_id, status)
  VALUES (p_user_id, p_slot_id, 'confirmed')
  RETURNING id INTO v_existing;

  -- If insert failed (duplicate), fetch existing booking
  IF v_existing IS NULL THEN
    SELECT id INTO v_existing FROM public.pilates_bookings 
    WHERE user_id = p_user_id AND slot_id = p_slot_id AND status = 'confirmed';
    
    -- If still null, revert deposit decrement
    IF v_existing IS NULL THEN
      UPDATE public.pilates_deposits AS pd
        SET deposit_remaining = pd.deposit_remaining + 1,
            is_active = true,
            updated_at = now()
        WHERE pd.id = v_deposit.id;
      SELECT * INTO v_deposit FROM public.get_active_pilates_deposit(p_user_id);
      RETURN QUERY SELECT NULL::uuid, COALESCE(v_deposit.deposit_remaining, 0);
      RETURN;
    END IF;
  END IF;

  -- success: return updated remaining (FIX: fully qualified)
  SELECT pd.deposit_remaining INTO v_updated_deposit 
  FROM public.pilates_deposits pd 
  WHERE pd.id = v_deposit.id;
  
  RETURN QUERY SELECT v_existing, v_updated_deposit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- PART 2: Enable RLS για Pilates Tables
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.pilates_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilates_schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilates_deposits ENABLE ROW LEVEL SECURITY;


-- PART 3: Fix RLS Policies για Trainers - IDEMPOTENT VERSION
-- ═══════════════════════════════════════════════════════════════

-- Policies για pilates_bookings

-- DROP old policies (IF EXISTS for idempotency)
DROP POLICY IF EXISTS "Users can view own pilates bookings" ON public.pilates_bookings;
DROP POLICY IF EXISTS "Admins can view all pilates bookings" ON public.pilates_bookings;
DROP POLICY IF EXISTS "Users can create own pilates bookings" ON public.pilates_bookings;
DROP POLICY IF EXISTS "Users can update own pilates bookings" ON public.pilates_bookings;
DROP POLICY IF EXISTS "Admins can manage all pilates bookings" ON public.pilates_bookings;
DROP POLICY IF EXISTS "pilates_bookings_select_policy" ON public.pilates_bookings;
DROP POLICY IF EXISTS "pilates_bookings_insert_policy" ON public.pilates_bookings;
DROP POLICY IF EXISTS "pilates_bookings_update_own_policy" ON public.pilates_bookings;
DROP POLICY IF EXISTS "pilates_bookings_admin_manage_policy" ON public.pilates_bookings;

-- CREATE updated policies
CREATE POLICY "pilates_bookings_select_policy" ON public.pilates_bookings
    FOR SELECT USING (
        -- Users see their own bookings
        auth.uid() = user_id
        OR
        -- Trainers, Admins, Secretaries see ALL bookings
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary', 'trainer')
        )
    );

CREATE POLICY "pilates_bookings_insert_policy" ON public.pilates_bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pilates_bookings_update_own_policy" ON public.pilates_bookings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "pilates_bookings_admin_manage_policy" ON public.pilates_bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );


-- Policies για pilates_schedule_slots

DROP POLICY IF EXISTS "Anyone can view active pilates slots" ON public.pilates_schedule_slots;
DROP POLICY IF EXISTS "Admins can manage pilates slots" ON public.pilates_schedule_slots;
DROP POLICY IF EXISTS "pilates_slots_select_policy" ON public.pilates_schedule_slots;
DROP POLICY IF EXISTS "pilates_slots_manage_policy" ON public.pilates_schedule_slots;

CREATE POLICY "pilates_slots_select_policy" ON public.pilates_schedule_slots
    FOR SELECT USING (
        -- Everyone can view active slots
        is_active = true
        OR
        -- Admins/Secretaries/Trainers can view all
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary', 'trainer')
        )
    );

CREATE POLICY "pilates_slots_manage_policy" ON public.pilates_schedule_slots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );


-- Policies για pilates_deposits

DROP POLICY IF EXISTS "pilates_deposits_select_own_or_admin" ON public.pilates_deposits;
DROP POLICY IF EXISTS "pilates_deposits_modify_admin_only" ON public.pilates_deposits;
DROP POLICY IF EXISTS "pilates_deposits_select_policy" ON public.pilates_deposits;
DROP POLICY IF EXISTS "pilates_deposits_modify_policy" ON public.pilates_deposits;

CREATE POLICY "pilates_deposits_select_policy" ON public.pilates_deposits
    FOR SELECT USING (
        -- Users see their own deposits
        auth.uid() = user_id 
        OR
        -- Admins/Secretaries see all
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );

CREATE POLICY "pilates_deposits_modify_policy" ON public.pilates_deposits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'secretary')
        )
    );


-- PART 4: Documentation Comments
-- ═══════════════════════════════════════════════════════════════

COMMENT ON POLICY "pilates_bookings_select_policy" ON public.pilates_bookings IS 
'Allows users to view their own bookings. Trainers, admins, and secretaries can view all bookings.';

COMMENT ON POLICY "pilates_slots_select_policy" ON public.pilates_schedule_slots IS 
'Everyone can view active slots. Staff can view all slots.';

COMMENT ON POLICY "pilates_deposits_select_policy" ON public.pilates_deposits IS 
'Users can view their own deposits. Admins and secretaries can view all.';

-- ═══════════════════════════════════════════════════════════════
-- END OF COMPLETE FIX - IDEMPOTENT VERSION
-- Safe to run multiple times without errors
-- ═══════════════════════════════════════════════════════════════

