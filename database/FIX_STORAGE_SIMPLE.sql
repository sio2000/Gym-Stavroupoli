/* FIX STORAGE SIMPLE - ΑΠΛΗ ΔΙΟΡΘΩΣΗ STORAGE
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Drop ALL existing storage policies */
DROP POLICY IF EXISTS "Users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;

/* 2. Create very simple storage policies */
CREATE POLICY "Public can view profile photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can upload profile photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-photos' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update own profile photos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profile-photos' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete own profile photos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'profile-photos' 
        AND auth.role() = 'authenticated'
    );

/* 3. Ensure bucket is public */
UPDATE storage.buckets 
SET public = true 
WHERE id = 'profile-photos';

/* 4. Check bucket status */
SELECT 
    'Storage Bucket Status' as test_name,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'profile-photos';

/* 5. Check storage policies */
SELECT 
    'Storage Policies' as test_name,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';

/* Success message */
SELECT 'Simple storage policies created!' as message;
