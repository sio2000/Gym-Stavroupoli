-- Δημιουργία RPC function για να επιβεβαιώσουμε όλα τα μη επιβεβαιωμένα emails
-- Αυτό είναι 100% ασφαλές και ενημερώνει μόνο τους χρήστες με NULL email_confirmed_at

CREATE OR REPLACE FUNCTION confirm_all_emails()
RETURNS TABLE (
  confirmed_count integer,
  user_ids uuid[],
  user_emails text[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_confirmed_count integer;
  v_user_ids uuid[];
  v_user_emails text[];
BEGIN
  -- Παίρνουμε τα IDs και emails των χρηστών που θα επιβεβαιωθούν
  SELECT 
    array_agg(au.id),
    array_agg(au.email)
  INTO v_user_ids, v_user_emails
  FROM auth.users au
  WHERE au.email_confirmed_at IS NULL
    AND au.deleted_at IS NULL;

  -- Αν δεν υπάρχουν χρήστες προς επιβεβαίωση, επιστρέφουμε 0
  IF v_user_ids IS NULL THEN
    RETURN QUERY SELECT 0::integer, ARRAY[]::uuid[], ARRAY[]::text[];
    RETURN;
  END IF;

  -- Ασφαλές UPDATE για επιβεβαίωση όλων των μη επιβεβαιωμένων emails
  -- Χρησιμοποιούμε NOW() για να θέσουμε την τρέχουσα ημερομηνία/ώρα
  UPDATE auth.users
  SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE email_confirmed_at IS NULL
    AND deleted_at IS NULL;

  -- Παίρνουμε τον αριθμό των εγγραφών που ενημερώθηκαν
  GET DIAGNOSTICS v_confirmed_count = ROW_COUNT;

  -- Επιστρέφουμε τα αποτελέσματα
  RETURN QUERY SELECT v_confirmed_count, v_user_ids, v_user_emails;
END;
$$;

-- Δώσε δικαιώματα στους authenticated users
GRANT EXECUTE ON FUNCTION confirm_all_emails() TO authenticated;

-- Comment για documentation
COMMENT ON FUNCTION confirm_all_emails() IS 'Επιβεβαιώνει αυτόματα όλα τα μη επιβεβαιωμένα emails των χρηστών. ΠΡΟΣΟΧΗ: Χρησιμοποιήστε μόνο σε περίπτωση ανάγκης!';

