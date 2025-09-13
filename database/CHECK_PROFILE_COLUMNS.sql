/* CHECK PROFILE COLUMNS - ΕΛΕΓΧΟΣ ΣΤΗΛΩΝ PROFILES
   Εκτέλεση στο Supabase SQL Editor */

/* Check all columns in user_profiles table */
SELECT 
    'Profile Table Columns' as test_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

/* Check if all required columns exist */
SELECT 
    'Required Columns Check' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'first_name') 
        THEN '✓ first_name exists' 
        ELSE '✗ first_name missing' 
    END as first_name_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'last_name') 
        THEN '✓ last_name exists' 
        ELSE '✗ last_name missing' 
    END as last_name_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'email') 
        THEN '✓ email exists' 
        ELSE '✗ email missing' 
    END as email_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'phone') 
        THEN '✓ phone exists' 
        ELSE '✗ phone missing' 
    END as phone_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'dob') 
        THEN '✓ dob exists' 
        ELSE '✗ dob missing' 
    END as dob_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'address') 
        THEN '✓ address exists' 
        ELSE '✗ address missing' 
    END as address_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'emergency_contact') 
        THEN '✓ emergency_contact exists' 
        ELSE '✗ emergency_contact missing' 
    END as emergency_contact_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'profile_photo') 
        THEN '✓ profile_photo exists' 
        ELSE '✗ profile_photo missing' 
    END as profile_photo_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'language') 
        THEN '✓ language exists' 
        ELSE '✗ language missing' 
    END as language_check;

/* Success message */
SELECT 'Profile columns check completed!' as message;
