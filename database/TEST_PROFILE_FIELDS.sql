/* TEST PROFILE FIELDS - ΔΟΚΙΜΗ ΠΕΔΙΩΝ PROFILES
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check if all required columns exist */
SELECT 
    'Profile Columns Check' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name IN (
    'first_name', 'last_name', 'email', 'phone', 
    'date_of_birth', 'address', 'emergency_contact_name', 
    'emergency_contact_phone', 'profile_photo', 'language'
  )
ORDER BY column_name;

/* 2. Test update with all fields (keeping original email) */
UPDATE user_profiles 
SET 
    first_name = 'Test First Name',
    last_name = 'Test Last Name',
    phone = '+306912345678',
    date_of_birth = '1990-01-01',
    address = 'Test Address 123',
    emergency_contact_name = 'Emergency Contact Name',
    emergency_contact_phone = '+306987654321',
    profile_photo = 'https://example.com/photo.jpg',
    language = 'en',
    updated_at = NOW()
WHERE user_id = 'af590b3a-aa03-44f5-bb5c-73c483bffacc';

/* 3. Check if update worked */
SELECT 
    'Update Test Result' as test_name,
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

/* 4. Test with empty values (should set to NULL) */
UPDATE user_profiles 
SET 
    first_name = '',
    last_name = '',
    email = '',
    phone = '',
    date_of_birth = NULL,
    address = '',
    emergency_contact_name = '',
    emergency_contact_phone = '',
    profile_photo = '',
    language = 'el',
    updated_at = NOW()
WHERE user_id = 'af590b3a-aa03-44f5-bb5c-73c483bffacc';

/* 5. Check empty values result */
SELECT 
    'Empty Values Test' as test_name,
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
SELECT 'Profile fields test completed!' as message;
