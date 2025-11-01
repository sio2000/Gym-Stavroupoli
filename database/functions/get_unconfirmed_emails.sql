-- Δημιουργία RPC function για να βρούμε χρήστες με μη επιβεβαιωμένο email
-- Αυτό είναι απαραίτητο γιατί δεν μπορούμε να κάνουμε direct query στο auth.users

CREATE OR REPLACE FUNCTION get_unconfirmed_emails()
RETURNS TABLE (
  user_id uuid,
  email text,
  email_confirmed_at timestamptz,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  display_name text,
  full_name text,
  confirmation_status text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email::text,
    au.email_confirmed_at,
    au.created_at,
    au.last_sign_in_at,
    (au.raw_user_meta_data->>'display_name')::text as display_name,
    (au.raw_user_meta_data->>'full_name')::text as full_name,
    CASE 
      WHEN au.email_confirmed_at IS NULL THEN 'Μη επιβεβαιωμένο'
      ELSE 'Επιβεβαιωμένο'
    END::text as confirmation_status
  FROM auth.users au
  WHERE au.email_confirmed_at IS NULL
    AND au.deleted_at IS NULL  -- Εξαιρούμε διαγραμμένους χρήστες
  ORDER BY au.created_at DESC;
END;
$$;

-- Δώσε δικαιώματα στους authenticated users
GRANT EXECUTE ON FUNCTION get_unconfirmed_emails() TO authenticated;

-- Comment για documentation
COMMENT ON FUNCTION get_unconfirmed_emails() IS 'Επιστρέφει λίστα με χρήστες που δεν έχουν επιβεβαιώσει το email τους';

