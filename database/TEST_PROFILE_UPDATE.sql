/* TEST PROFILE UPDATE - ΔΟΚΙΜΗ ΕΝΗΜΕΡΩΣΗΣ PROFILES
   Εκτέλεση στο Supabase SQL Editor */

/* Check current profile structure */
SELECT 
    'Current Profile Structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

/* Check sample profile data */
SELECT 
    'Sample Profile Data' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    phone,
    dob,
    address,
    emergency_contact,
    profile_photo,
    profile_photo_locked,
    dob_locked,
    language,
    created_at,
    updated_at
FROM user_profiles 
ORDER BY updated_at DESC 
LIMIT 5;

/* Test update a profile */
UPDATE user_profiles 
SET 
    first_name = 'Updated First Name',
    last_name = 'Updated Last Name',
    email = 'updated@freegym.gr',
    phone = '+306912345678',
    address = 'Updated Address 123',
    emergency_contact = 'Updated Emergency Contact',
    language = 'en',
    updated_at = NOW()
WHERE user_id = (
    SELECT user_id FROM user_profiles 
    WHERE first_name IS NOT NULL 
    LIMIT 1
);

/* Check if update worked */
SELECT 
    'Updated Profile' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    phone,
    dob,
    address,
    emergency_contact,
    profile_photo,
    profile_photo_locked,
    dob_locked,
    language,
    created_at,
    updated_at
FROM user_profiles 
WHERE first_name = 'Updated First Name';

/* Success message */
SELECT 'Profile update test completed!' as message;
