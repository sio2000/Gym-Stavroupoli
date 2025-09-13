/* SIMPLE STORAGE POLICY - ΑΠΛΟ STORAGE POLICY
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check current bucket status */
SELECT 
    'Bucket Status' as test_name,
    name,
    public,
    file_size_limit
FROM storage.buckets 
WHERE name = 'profile-photos';

/* 2. Check current policies */
SELECT 
    'Current Policies' as test_name,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';

/* 3. Drop all existing policies */
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

/* 4. Create one simple policy */
CREATE POLICY "Profile photos access" ON storage.objects
    FOR ALL USING (bucket_id = 'profile-photos');

/* 5. Make bucket public */
UPDATE storage.buckets 
SET public = true 
WHERE id = 'profile-photos';

/* 6. Check final status */
SELECT 
    'Final Policy Status' as test_name,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';

/* 7. Check bucket is public */
SELECT 
    'Final Bucket Status' as test_name,
    name,
    public
FROM storage.buckets 
WHERE name = 'profile-photos';

/* Success message */
SELECT 'Simple storage policy created!' as message;
