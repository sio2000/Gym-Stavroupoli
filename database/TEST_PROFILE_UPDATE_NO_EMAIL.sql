/* TEST PROFILE UPDATE NO EMAIL - ΔΟΚΙΜΗ ΕΝΗΜΕΡΩΣΗΣ ΧΩΡΙΣ EMAIL
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check current profile data */
SELECT 
    'Current Profile Data' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    address,
    emergency_contact_name,
    emergency_contact_phone,
    profile_photo,
    language,
    updated_at
FROM user_profiles 
WHERE user_id = 'af590b3a-aa03-44f5-bb5c-73c483bffacc';

/* 2. Test update without email (like the app does) */
UPDATE user_profiles 
SET 
    first_name = 'Nikitas Updated',
    last_name = 'Faren Updated',
    phone = '+306911111111',
    date_of_birth = '1995-05-15',
    address = 'Updated Address 456',
    emergency_contact_name = 'John Doe',
    emergency_contact_phone = '+306999999999',
    profile_photo = 'https://nolqodpfaqdnprixaqlo.supabase.co/storage/v1/object/public/profile-photos/test.jpg',
    language = 'en',
    updated_at = NOW()
WHERE user_id = 'af590b3a-aa03-44f5-bb5c-73c483bffacc';

/* 3. Check if update worked */
SELECT 
    'Updated Profile Data' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    address,
    emergency_contact_name,
    emergency_contact_phone,
    profile_photo,
    language,
    updated_at
FROM user_profiles 
WHERE user_id = 'af590b3a-aa03-44f5-bb5c-73c483bffacc';

/* 4. Reset to original values */
UPDATE user_profiles 
SET 
    first_name = 'Nikitas',
    last_name = 'Faren',
    phone = '+6911111111',
    date_of_birth = NULL,
    address = NULL,
    emergency_contact_name = NULL,
    emergency_contact_phone = NULL,
    profile_photo = NULL,
    language = 'el',
    updated_at = NOW()
WHERE user_id = 'af590b3a-aa03-44f5-bb5c-73c483bffacc';

/* 5. Check reset result */
SELECT 
    'Reset Profile Data' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    address,
    emergency_contact_name,
    emergency_contact_phone,
    profile_photo,
    language,
    updated_at
FROM user_profiles 
WHERE user_id = 'af590b3a-aa03-44f5-bb5c-73c483bffacc';

/* Success message */
SELECT 'Profile update test without email completed!' as message;
