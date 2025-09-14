/* TEST STORAGE UPLOAD - ΔΟΚΙΜΗ STORAGE UPLOAD
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check if profile-photos bucket exists and is public */
SELECT 
    'Bucket Check' as test_name,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'profile-photos';

/* 2. Check RLS status on storage.objects */
SELECT 
    'RLS Status' as test_name,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';

/* 3. Check existing objects in profile-photos bucket */
SELECT 
    'Existing Objects' as test_name,
    name,
    bucket_id,
    owner,
    created_at
FROM storage.objects 
WHERE bucket_id = 'profile-photos'
ORDER BY created_at DESC
LIMIT 5;

/* 4. Check storage policies */
SELECT 
    'Storage Policies' as test_name,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';

/* 5. Test if we can insert a test object (this will fail if RLS is blocking) */
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
VALUES (
    'profile-photos',
    'test-file.txt',
    auth.uid(),
    '{"contentType": "text/plain"}'::jsonb
);

/* 6. Check if test object was created */
SELECT 
    'Test Object Created' as test_name,
    name,
    bucket_id,
    owner,
    created_at
FROM storage.objects 
WHERE bucket_id = 'profile-photos' 
  AND name = 'test-file.txt';

/* 7. Clean up test object */
DELETE FROM storage.objects 
WHERE bucket_id = 'profile-photos' 
  AND name = 'test-file.txt';

/* Success message */
SELECT 'Storage upload test completed!' as message;
