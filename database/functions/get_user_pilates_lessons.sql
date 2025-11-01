-- Δημιουργία RPC function για έλεγχος διαθέσιμων Pilates μαθημάτων χρήστη
-- Επιστρέφει όλες τις πληροφορίες για τα Pilates deposits του χρήστη

CREATE OR REPLACE FUNCTION get_user_pilates_lessons(p_user_email text)
RETURNS TABLE (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  total_active_lessons integer,
  total_all_lessons integer,
  total_deposits integer,
  deposits jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Βρίσκουμε το user_id από το email
  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE u.email = p_user_email
    AND u.deleted_at IS NULL;

  -- Αν δεν βρέθηκε χρήστης, επιστρέφουμε κενό
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Επιστρέφουμε τα δεδομένα του χρήστη και τα Pilates deposits
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email::text,
    up.first_name::text,
    up.last_name::text,
    up.phone::text,
    COALESCE(
      (SELECT SUM(pd.deposit_remaining)::integer 
       FROM pilates_deposits pd 
       WHERE pd.user_id = u.id AND pd.is_active = true),
      0
    ) as total_active_lessons,
    COALESCE(
      (SELECT SUM(pd.deposit_remaining)::integer 
       FROM pilates_deposits pd 
       WHERE pd.user_id = u.id),
      0
    ) as total_all_lessons,
    COALESCE(
      (SELECT COUNT(*)::integer 
       FROM pilates_deposits pd 
       WHERE pd.user_id = u.id),
      0
    ) as total_deposits,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', pd.id,
          'deposit_remaining', pd.deposit_remaining,
          'is_active', pd.is_active,
          'credited_at', pd.credited_at,
          'expires_at', pd.expires_at,
          'status', 
            CASE 
              WHEN pd.expires_at IS NOT NULL AND pd.expires_at < NOW() THEN 'EXPIRED'
              WHEN pd.deposit_remaining <= 0 THEN 'EMPTY'
              WHEN pd.is_active = false THEN 'INACTIVE'
              ELSE 'ACTIVE'
            END
        ) ORDER BY pd.credited_at DESC
      )
      FROM pilates_deposits pd 
      WHERE pd.user_id = u.id),
      '[]'::jsonb
    ) as deposits
  FROM auth.users u
  LEFT JOIN user_profiles up ON u.id = up.user_id
  WHERE u.id = v_user_id;
END;
$$;

-- Δώσε δικαιώματα στους authenticated users
GRANT EXECUTE ON FUNCTION get_user_pilates_lessons(text) TO authenticated;

-- Comment για documentation
COMMENT ON FUNCTION get_user_pilates_lessons(text) IS 'Επιστρέφει τα διαθέσιμα Pilates μαθήματα και deposits για συγκεκριμένο χρήστη';

