/* VERIFY PROFILE UPDATE - ΕΛΕΓΧΟΣ ΕΝΗΜΕΡΩΣΗΣ PROFILES
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check current profile data for the user */
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
WHERE user_id = '12ca8372-af8e-49b6-b68d-7b87ffb5b09a';

/* 2. Test manual update to verify the fields work */
UPDATE user_profiles 
SET 
    first_name = 'Test Update',
    last_name = 'Test Last',
    address = 'Test Address 123',
    emergency_contact_name = 'Test Emergency',
    emergency_contact_phone = '+306999999999',
    updated_at = NOW()
WHERE user_id = '12ca8372-af8e-49b6-b68d-7b87ffb5b09a';

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
WHERE user_id = '12ca8372-af8e-49b6-b68d-7b87ffb5b09a';

/* 4. Reset to original values */
UPDATE user_profiles 
SET 
    first_name = 'PPPPPP',
    last_name = 'SASA',
    address = 'MPOTSARI 147',
    emergency_contact_name = 'kkkkkkkkkkkkkkk',
    emergency_contact_phone = '',
    updated_at = NOW()
WHERE user_id = '12ca8372-af8e-49b6-b68d-7b87ffb5b09a';

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
WHERE user_id = '12ca8372-af8e-49b6-b68d-7b87ffb5b09a';

/* Success message */
SELECT 'Profile update verification completed!' as message;
