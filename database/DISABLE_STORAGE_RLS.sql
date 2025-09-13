/* DISABLE STORAGE RLS - ΑΠΕΝΕΡΓΟΠΟΙΗΣΗ STORAGE RLS
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Drop ALL existing storage policies */
DROP POLICY IF EXISTS "Users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile photos" ON storage.objects;

/* 2. Disable RLS on storage.objects temporarily */
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

/* 3. Ensure bucket is public */
UPDATE storage.buckets 
SET public = true 
WHERE id = 'profile-photos';

/* 4. Check RLS status */
SELECT 
    'RLS Status' as test_name,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';

/* 5. Check bucket status */
SELECT 
    'Bucket Status' as test_name,
    name,
    public,
    file_size_limit
FROM storage.buckets 
WHERE name = 'profile-photos';

/* Success message */
SELECT 'Storage RLS disabled - photo uploads should work now!' as message;
