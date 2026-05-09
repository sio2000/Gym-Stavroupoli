-- Δημιουργία RPC function για ενημέρωση διαθέσιμων Pilates μαθημάτων χρήστη
-- Ορίζει τον ακριβή αριθμό μαθημάτων που θα έχει ο χρήστης
-- Συγχρονίζει και το memberships όταν τα μαθήματα > 0 ώστε να μη μένει
-- συνδρομή σε status expired ενώ το deposit είναι ενεργό.

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
  v_membership_id uuid;
  v_new_membership_id uuid;
  v_end_date date;
  v_msg text;
BEGIN
  IF p_lesson_count < 0 THEN
    RETURN QUERY SELECT
      false,
      'Ο αριθμός μαθημάτων δεν μπορεί να είναι αρνητικός'::text,
      NULL::uuid,
      0::integer,
      0::integer;
    RETURN;
  END IF;

  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE u.email = p_user_email
    AND u.deleted_at IS NULL;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT
      false,
      ('Ο χρήστης με email ' || p_user_email || ' δεν βρέθηκε')::text,
      NULL::uuid,
      0::integer,
      0::integer;
    RETURN;
  END IF;

  SELECT mp.id INTO v_pilates_package_id
  FROM membership_packages mp
  WHERE mp.name ILIKE '%pilates%'
    AND mp.is_active = true
  ORDER BY mp.created_at DESC
  LIMIT 1;

  IF v_pilates_package_id IS NULL THEN
    RETURN QUERY SELECT
      false,
      'Δεν βρέθηκε ενεργό Pilates package'::text,
      v_user_id,
      0::integer,
      0::integer;
    RETURN;
  END IF;

  SELECT pd.id, pd.deposit_remaining, true
  INTO v_active_deposit_id, v_previous_remaining, v_deposit_exists
  FROM pilates_deposits pd
  WHERE pd.user_id = v_user_id
    AND pd.is_active = true
  ORDER BY pd.credited_at DESC
  LIMIT 1;

  IF v_deposit_exists THEN
    UPDATE pilates_deposits
    SET
      deposit_remaining = p_lesson_count,
      updated_at = NOW()
    WHERE id = v_active_deposit_id;
    v_msg := 'Ενημερώθηκαν τα διαθέσιμα Pilates μαθήματα σε ' || p_lesson_count::text;
  ELSE
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
      NOW() + INTERVAL '1 year',
      true,
      NOW(),
      NULL
    );
    v_msg := 'Δημιουργήθηκε νέο Pilates deposit με ' || p_lesson_count::text || ' μαθήματα';
    v_previous_remaining := 0;
  END IF;

  IF p_lesson_count > 0 THEN
    SELECT m.id INTO v_membership_id
    FROM memberships m
    JOIN membership_packages mp ON mp.id = m.package_id
    WHERE m.user_id = v_user_id
      AND m.deleted_at IS NULL
      AND m.end_date >= CURRENT_DATE
      AND (
        lower(mp.package_type::text) = 'pilates'
        OR mp.name ILIKE '%pilates%'
        OR mp.name ILIKE '%ultimate%'
      )
    ORDER BY m.end_date DESC NULLS LAST
    LIMIT 1;

    IF v_membership_id IS NOT NULL THEN
      UPDATE memberships
      SET
        is_active = true,
        status = 'active',
        updated_at = NOW()
      WHERE id = v_membership_id;

      INSERT INTO public.membership_logs (membership_id, action, details)
      VALUES (
        v_membership_id,
        'admin_set_pilates_lessons_sync',
        jsonb_build_object(
          'source', 'set_user_pilates_lessons',
          'lesson_count', p_lesson_count,
          'synced_at', NOW()
        )
      );
    ELSE
      v_end_date := (CURRENT_DATE + INTERVAL '1 year')::date;

      INSERT INTO memberships (
        user_id,
        package_id,
        start_date,
        end_date,
        is_active,
        status,
        duration_type
      )
      VALUES (
        v_user_id,
        v_pilates_package_id,
        CURRENT_DATE,
        v_end_date,
        true,
        'active',
        'pilates_1year'
      )
      RETURNING id INTO v_new_membership_id;

      INSERT INTO public.membership_logs (membership_id, action, details)
      VALUES (
        v_new_membership_id,
        'admin_set_pilates_lessons_sync',
        jsonb_build_object(
          'source', 'set_user_pilates_lessons',
          'lesson_count', p_lesson_count,
          'created_membership', true,
          'synced_at', NOW()
        )
      );
    END IF;
  END IF;

  RETURN QUERY SELECT
    true,
    v_msg,
    v_user_id,
    p_lesson_count,
    COALESCE(v_previous_remaining, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION set_user_pilates_lessons(text, integer) TO authenticated;

COMMENT ON FUNCTION set_user_pilates_lessons(text, integer) IS 'Ορίζει τον ακριβή αριθμό διαθέσιμων Pilates μαθημάτων και συγχρονίζει την εγγραφή memberships. ΠΡΟΣΟΧΗ: Χρησιμοποιήστε μόνο σε περίπτωση ανάγκης!';
