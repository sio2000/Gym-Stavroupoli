-- ΔΙΟΡΘΩΣΗ PILATES BOOKING RPC
-- Το πρόβλημα: Μερικοί users δεν μπορούν να δουν τις κρατήσεις τους
-- Αιτία: Το RPC επιστρέφει μόνο booking_id, και το frontend κάνει SELECT που μπλοκάρεται από RLS
-- Λύση: Το RPC να επιστρέφει full booking details, ώστε να μη χρειάζεται extra SELECT

-- 1) Διορθώνουμε το book_pilates_class RPC να επιστρέφει όλα τα δεδομένα
CREATE OR REPLACE FUNCTION public.book_pilates_class(p_user_id uuid, p_slot_id uuid)
RETURNS json AS $$
DECLARE
  v_deposit public.pilates_deposits;
  v_capacity integer;
  v_booked integer;
  v_existing uuid;
  v_result json;
BEGIN
  -- check existing booking
  SELECT id INTO v_existing FROM public.pilates_bookings 
  WHERE user_id = p_user_id AND slot_id = p_slot_id AND status = 'confirmed';
  IF v_existing IS NOT NULL THEN
    -- return current deposit state without double-decrement
    SELECT * INTO v_deposit FROM public.get_active_pilates_deposit(p_user_id);
    
    -- Return full booking details with joined data
    SELECT json_build_object(
      'booking_id', b.id,
      'deposit_remaining', COALESCE(v_deposit.deposit_remaining, 0),
      'booking', json_build_object(
        'id', b.id,
        'user_id', b.user_id,
        'slot_id', b.slot_id,
        'booking_date', b.booking_date,
        'status', b.status,
        'notes', b.notes,
        'created_at', b.created_at,
        'updated_at', b.updated_at,
        'slot', json_build_object(
          'id', s.id,
          'date', s.date,
          'start_time', s.start_time,
          'end_time', s.end_time,
          'max_capacity', s.max_capacity,
          'is_active', s.is_active,
          'created_at', s.created_at,
          'updated_at', s.updated_at
        ),
        'user', json_build_object(
          'user_id', up.user_id,
          'first_name', up.first_name,
          'last_name', up.last_name,
          'email', up.email,
          'phone', up.phone,
          'role', up.role
        )
      )
    ) INTO v_result
    FROM public.pilates_bookings b
    LEFT JOIN public.pilates_schedule_slots s ON s.id = b.slot_id
    LEFT JOIN public.user_profiles up ON up.user_id = b.user_id
    WHERE b.id = v_existing;
    
    RETURN v_result;
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
    -- return current state with full details
    SELECT * INTO v_deposit FROM public.get_active_pilates_deposit(p_user_id);
    SELECT id INTO v_existing FROM public.pilates_bookings WHERE user_id=p_user_id AND slot_id=p_slot_id AND status='confirmed' LIMIT 1;
    
    -- Return full details
    SELECT json_build_object(
      'booking_id', b.id,
      'deposit_remaining', COALESCE(v_deposit.deposit_remaining, 0),
      'booking', json_build_object(
        'id', b.id,
        'user_id', b.user_id,
        'slot_id', b.slot_id,
        'booking_date', b.booking_date,
        'status', b.status,
        'notes', b.notes,
        'created_at', b.created_at,
        'updated_at', b.updated_at,
        'slot', json_build_object(
          'id', s.id,
          'date', s.date,
          'start_time', s.start_time,
          'end_time', s.end_time,
          'max_capacity', s.max_capacity,
          'is_active', s.is_active,
          'created_at', s.created_at,
          'updated_at', s.updated_at
        ),
        'user', json_build_object(
          'user_id', up.user_id,
          'first_name', up.first_name,
          'last_name', up.last_name,
          'email', up.email,
          'phone', up.phone,
          'role', up.role
        )
      )
    ) INTO v_result
    FROM public.pilates_bookings b
    LEFT JOIN public.pilates_schedule_slots s ON s.id = b.slot_id
    LEFT JOIN public.user_profiles up ON up.user_id = b.user_id
    WHERE b.id = v_existing;
    
    RETURN v_result;
  END IF;

  -- success: get updated deposit and return full details
  SELECT pd.deposit_remaining INTO v_deposit.deposit_remaining FROM public.pilates_deposits pd WHERE pd.id = v_deposit.id;
  
  -- Return full booking details with joined data
  SELECT json_build_object(
    'booking_id', b.id,
    'deposit_remaining', v_deposit.deposit_remaining,
    'booking', json_build_object(
      'id', b.id,
      'user_id', b.user_id,
      'slot_id', b.slot_id,
      'booking_date', b.booking_date,
      'status', b.status,
      'notes', b.notes,
      'created_at', b.created_at,
      'updated_at', b.updated_at,
      'slot', json_build_object(
        'id', s.id,
        'date', s.date,
        'start_time', s.start_time,
        'end_time', s.end_time,
        'max_capacity', s.max_capacity,
        'is_active', s.is_active,
        'created_at', s.created_at,
        'updated_at', s.updated_at
      ),
      'user', json_build_object(
        'user_id', up.user_id,
        'first_name', up.first_name,
        'last_name', up.last_name,
        'email', up.email,
        'phone', up.phone,
        'role', up.role
      )
    )
  ) INTO v_result
  FROM public.pilates_bookings b
  LEFT JOIN public.pilates_schedule_slots s ON s.id = b.slot_id
  LEFT JOIN public.user_profiles up ON up.user_id = b.user_id
  WHERE b.id = v_existing;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment για documentation
COMMENT ON FUNCTION public.book_pilates_class(uuid, uuid) IS 
'Atomically books a Pilates class: decrements deposit and creates booking.
Returns full booking details including joined slot and user data to avoid RLS issues with subsequent SELECT queries.
SECURITY DEFINER allows bypassing RLS for the booking creation.';

