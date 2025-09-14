/* CREATE BUCKET AND POLICY - ΔΗΜΙΟΥΡΓΙΑ BUCKET ΚΑΙ POLICY
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check if bucket exists */
SELECT 
    'Bucket Check' as test_name,
    name,
    public,
    file_size_limit
FROM storage.buckets 
WHERE name = 'profile-photos';

/* 2. Create bucket if it doesn't exist */
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-photos',
    'profile-photos',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/* 3. Check bucket after creation */
SELECT 
    'Bucket After Creation' as test_name,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'profile-photos';

/* 4. Drop all existing policies */
DROP POLICY IF EXISTS "Profile photos access" ON storage.objects;
DROP POLICY IF EXISTS "Allow profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Simple profile photos policy" ON storage.objects;
DROP POLICY IF EXISTS "Allow all for profile photos" ON storage.objects;

/* 5. Create simple policy */
CREATE POLICY "Profile photos policy" ON storage.objects
    FOR ALL USING (bucket_id = 'profile-photos');

/* 6. Check final status */
SELECT 
    'Final Status' as test_name,
    'Bucket created/updated' as bucket_status,
    'Policy created' as policy_status;

/* 7. Verify bucket is public */
SELECT 
    'Bucket Verification' as test_name,
    name,
    public,
    file_size_limit
FROM storage.buckets 
WHERE name = 'profile-photos';

/* 8. Verify policy exists */
SELECT 
    'Policy Verification' as test_name,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname = 'Profile photos policy';

/* Success message */
SELECT 'Bucket and policy created successfully!' as message;
