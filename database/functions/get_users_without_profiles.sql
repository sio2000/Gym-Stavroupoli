-- Δημιουργία RPC function για να βρούμε χρήστες χωρίς user profile
-- Αυτό είναι απαραίτητο γιατί δεν μπορούμε να κάνουμε direct query στο auth.users

CREATE OR REPLACE FUNCTION get_users_without_profiles()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    au.created_at
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.user_id
  WHERE up.user_id IS NULL
    AND au.deleted_at IS NULL
  ORDER BY au.created_at DESC;
END;
$$;

-- Δώσε δικαιώματα στους authenticated users
GRANT EXECUTE ON FUNCTION get_users_without_profiles() TO authenticated;

-- Comment για documentation
COMMENT ON FUNCTION get_users_without_profiles() IS 'Επιστρέφει λίστα με χρήστες που έχουν λογαριασμό στο auth.users αλλά δεν έχουν αντίστοιχο user profile';

