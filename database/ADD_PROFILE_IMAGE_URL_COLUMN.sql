/* ADD_PROFILE_IMAGE_URL_COLUMN - Προσθήκη profile_image_url column στον user_profiles
   Εκτέλεση στο Supabase SQL Editor */

-- 1. Check current structure of user_profiles table
SELECT 
    'Current user_profiles structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add profile_image_url column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- 3. Add comment to the column
COMMENT ON COLUMN user_profiles.profile_image_url IS 'URL of the user profile image';

-- 4. Create index for better performance (optional)
CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_image_url ON user_profiles(profile_image_url);

-- 5. Update RLS policies to include profile_image_url
-- First, let's see current policies
SELECT 
    'Current RLS policies' as test_name,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 6. Test the updated structure
SELECT 
    'Updated user_profiles structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Test insert with profile_image_url
INSERT INTO user_profiles (
    user_id,
    email,
    first_name,
    last_name,
    role,
    phone,
    profile_image_url
) VALUES (
    gen_random_uuid(),
    'test-profile-image@freegym.gr',
    'Test',
    'ProfileImage',
    'user',
    '+300000000000',
    'https://example.com/profile-image.jpg'
) ON CONFLICT (email) DO NOTHING;

-- 8. Verify the insert worked
SELECT 
    'Test insert verification' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    profile_image_url
FROM user_profiles 
WHERE email = 'test-profile-image@freegym.gr';

-- Success message
SELECT 'profile_image_url column added successfully!' as message;
