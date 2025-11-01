-- Δημιουργία RPC function για να διορθώσουμε χρήστες χωρίς user profile
-- Αυτό δημιουργεί user profiles για όλους τους χρήστες που δεν έχουν

CREATE OR REPLACE FUNCTION fix_users_without_profiles()
RETURNS TABLE (
  created_count integer,
  user_ids uuid[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_created_count integer;
  v_user_ids uuid[];
BEGIN
  -- Παίρνουμε τα IDs των χρηστών που θα διορθωθούν
  SELECT array_agg(au.id)
  INTO v_user_ids
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.user_id
  WHERE up.user_id IS NULL
    AND au.deleted_at IS NULL;

  -- Αν δεν υπάρχουν χρήστες προς διόρθωση, επιστρέφουμε 0
  IF v_user_ids IS NULL THEN
    RETURN QUERY SELECT 0::integer, ARRAY[]::uuid[];
    RETURN;
  END IF;

  -- Ασφαλές INSERT για προσθήκη όλων των χρηστών χωρίς προφίλ
  INSERT INTO user_profiles (
    user_id,
    email,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
  )
  SELECT 
    au.id,
    au.email,
    COALESCE(
      au.raw_user_meta_data->>'first_name',
      au.raw_user_meta_data->>'display_name',
      SPLIT_PART(au.email, '@', 1)
    ) as first_name,
    COALESCE(
      au.raw_user_meta_data->>'last_name',
      ''
    ) as last_name,
    'user' as role,
    au.created_at,
    NOW()
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.user_id
  WHERE up.user_id IS NULL
    AND au.deleted_at IS NULL;

  -- Παίρνουμε τον αριθμό των εγγραφών που δημιουργήθηκαν
  GET DIAGNOSTICS v_created_count = ROW_COUNT;

  -- Επιστρέφουμε τα αποτελέσματα
  RETURN QUERY SELECT v_created_count, v_user_ids;
END;
$$;

-- Δώσε δικαιώματα στους authenticated users
GRANT EXECUTE ON FUNCTION fix_users_without_profiles() TO authenticated;

-- Comment για documentation
COMMENT ON FUNCTION fix_users_without_profiles() IS 'Δημιουργεί user profiles για όλους τους χρήστες που έχουν λογαριασμό αλλά δεν έχουν αντίστοιχο user profile';

