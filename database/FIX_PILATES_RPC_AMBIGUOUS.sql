-- CRITICAL FIX: Διόρθωση "deposit_remaining is ambiguous" error
-- Αυτό το bug προκαλούσε αποτυχία στην κράτηση για μερικούς users

CREATE OR REPLACE FUNCTION public.book_pilates_class(p_user_id uuid, p_slot_id uuid)
RETURNS TABLE (booking_id uuid, deposit_remaining integer) AS $$
DECLARE
  v_deposit public.pilates_deposits;
  v_capacity integer;
  v_booked integer;
  v_existing uuid;
  v_updated_deposit integer;  -- NEW: explicit variable to avoid ambiguity
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

  -- re-check deposit after lock (FIX: fully qualify column name)
  SELECT pd.deposit_remaining INTO v_updated_deposit 
  FROM public.pilates_deposits pd 
  WHERE pd.id = v_deposit.id;
  
  IF v_updated_deposit <= 0 THEN
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
    UPDATE public.pilates_deposits AS pd
      SET deposit_remaining = pd.deposit_remaining + 1,
          is_active = true,
          updated_at = now()
      WHERE pd.id = v_deposit.id;
    -- return current state
    SELECT * INTO v_deposit FROM public.get_active_pilates_deposit(p_user_id);
    RETURN QUERY SELECT 
      (SELECT id FROM public.pilates_bookings WHERE user_id=p_user_id AND slot_id=p_slot_id AND status='confirmed' LIMIT 1), 
      COALESCE(v_deposit.deposit_remaining, 0);
    RETURN;
  END IF;

  -- success: return updated remaining (FIX: fully qualify column name)
  SELECT pd.deposit_remaining INTO v_updated_deposit 
  FROM public.pilates_deposits pd 
  WHERE pd.id = v_deposit.id;
  
  RETURN QUERY SELECT v_existing, v_updated_deposit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the fix
COMMENT ON FUNCTION public.book_pilates_class(uuid, uuid) IS 
'Fixed: deposit_remaining ambiguity issue. Now fully qualifies all column references to prevent SQL errors that were causing bookings to fail for some users.';

