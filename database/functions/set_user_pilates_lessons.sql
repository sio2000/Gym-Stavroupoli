-- Δημιουργία RPC function για ενημέρωση διαθέσιμων Pilates μαθημάτων χρήστη
-- Ορίζει τον ακριβή αριθμό μαθημάτων που θα έχει ο χρήστης

CREATE OR REPLACE FUNCTION set_user_pilates_lessons(
  p_user_email text,
  p_lesson_count integer
)
RETURNS TABLE (
  success boolean,
  message text,
  user_id uuid,
  new_lesson_count integer,
  previous_lesson_count integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_pilates_package_id uuid;
  v_active_deposit_id uuid;
  v_previous_remaining integer;
  v_deposit_exists boolean;
BEGIN
  -- Έλεγχος αρνητικών αριθμών
  IF p_lesson_count < 0 THEN
    RETURN QUERY SELECT 
      false, 
      'Ο αριθμός μαθημάτων δεν μπορεί να είναι αρνητικός'::text,
      NULL::uuid,
      0::integer,
      0::integer;
    RETURN;
  END IF;

  -- Βρίσκουμε το user_id από το email
  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE u.email = p_user_email
    AND u.deleted_at IS NULL;

  -- Αν δεν βρέθηκε χρήστης
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT 
      false, 
      'Ο χρήστης με email ' || p_user_email || ' δεν βρέθηκε'::text,
      NULL::uuid,
      0::integer,
      0::integer;
    RETURN;
  END IF;

  -- Βρίσκουμε το Pilates package
  SELECT mp.id INTO v_pilates_package_id
  FROM membership_packages mp
  WHERE mp.name ILIKE '%pilates%' 
    AND mp.is_active = true
  ORDER BY mp.created_at DESC
  LIMIT 1;

  -- Αν δεν βρέθηκε Pilates package
  IF v_pilates_package_id IS NULL THEN
    RETURN QUERY SELECT 
      false, 
      'Δεν βρέθηκε ενεργό Pilates package'::text,
      v_user_id,
      0::integer,
      0::integer;
    RETURN;
  END IF;

  -- Έλεγχος για ενεργό deposit
  SELECT pd.id, pd.deposit_remaining, true 
  INTO v_active_deposit_id, v_previous_remaining, v_deposit_exists
  FROM pilates_deposits pd
  WHERE pd.user_id = v_user_id 
    AND pd.is_active = true
  ORDER BY pd.credited_at DESC
  LIMIT 1;

  -- Αν υπάρχει ενεργό deposit, το ενημερώνουμε
  IF v_deposit_exists THEN
    UPDATE pilates_deposits 
    SET 
      deposit_remaining = p_lesson_count,
      updated_at = NOW()
    WHERE id = v_active_deposit_id;
    
    RETURN QUERY SELECT 
      true, 
      'Ενημερώθηκαν τα διαθέσιμα Pilates μαθήματα σε ' || p_lesson_count::text,
      v_user_id,
      p_lesson_count,
      COALESCE(v_previous_remaining, 0);
    RETURN;
  ELSE
    -- Δημιουργούμε νέο deposit
    INSERT INTO pilates_deposits (
      user_id,
      package_id,
      deposit_remaining,
      expires_at,
      is_active,
      credited_at,
      created_by
    ) VALUES (
      v_user_id,
      v_pilates_package_id,
      p_lesson_count,
      NOW() + INTERVAL '1 year', -- 1 χρόνος ισχύς
      true,
      NOW(),
      NULL -- System created
    );
    
    RETURN QUERY SELECT 
      true, 
      'Δημιουργήθηκε νέο Pilates deposit με ' || p_lesson_count::text || ' μαθήματα',
      v_user_id,
      p_lesson_count,
      0::integer;
    RETURN;
  END IF;
END;
$$;

-- Δώσε δικαιώματα στους authenticated users
GRANT EXECUTE ON FUNCTION set_user_pilates_lessons(text, integer) TO authenticated;

-- Comment για documentation
COMMENT ON FUNCTION set_user_pilates_lessons(text, integer) IS 'Ορίζει τον ακριβή αριθμό διαθέσιμων Pilates μαθημάτων για συγκεκριμένο χρήστη. ΠΡΟΣΟΧΗ: Χρησιμοποιήστε μόνο σε περίπτωση ανάγκης!';

