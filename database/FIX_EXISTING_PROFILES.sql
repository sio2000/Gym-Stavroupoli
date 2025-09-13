/* FIX EXISTING PROFILES - ΔΙΟΡΘΩΣΗ ΥΠΑΡΧΟΝΤΩΝ PROFILES
   Εκτέλεση στο Supabase SQL Editor */

/* Check profiles without phone */
SELECT 
    'Profiles without phone' as test_name,
    up.user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.phone,
    u.raw_user_meta_data
FROM user_profiles up
JOIN auth.users u ON up.user_id = u.id
WHERE up.phone IS NULL OR up.phone = '';

/* Update profiles with phone from auth.users metadata */
UPDATE user_profiles 
SET phone = COALESCE(
    (SELECT raw_user_meta_data->>'phone' 
     FROM auth.users 
     WHERE auth.users.id = user_profiles.user_id), 
    phone
)
WHERE phone IS NULL OR phone = '';

/* Check updated profiles */
SELECT 
    'Updated profiles' as test_name,
    up.user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.phone,
    up.updated_at
FROM user_profiles up
ORDER BY up.updated_at DESC
LIMIT 10;

/* Success message */
SELECT 'Existing profiles updated with phone data!' as message;
