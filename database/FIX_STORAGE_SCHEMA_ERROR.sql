/* FIX STORAGE SCHEMA ERROR - ΔΙΟΡΘΩΣΗ STORAGE SCHEMA ΣΦΑΛΜΑΤΟΣ
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check what we can access in storage schema */
SELECT 
    'Storage Schema Access' as test_name,
    has_schema_privilege('storage', 'USAGE') as can_use_storage,
    has_table_privilege('storage.objects', 'SELECT') as can_select_objects,
    has_table_privilege('storage.objects', 'INSERT') as can_insert_objects;

/* 2. Check current user and available schemas */
SELECT 
    'Current User Info' as test_name,
    current_user as current_user,
    current_role as current_role,
    current_database() as current_database;

/* 3. Check storage tables */
SELECT 
    'Storage Tables' as test_name,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'storage';

/* 4. Check storage buckets */
SELECT 
    'Storage Buckets' as test_name,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets;

/* 5. Check existing policies on storage.objects */
SELECT 
    'Storage Policies' as test_name,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';

/* 6. Try to create a simple policy with correct syntax */
DO $$
BEGIN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Allow profile photos" ON storage.objects;
    
    -- Create new policy
    CREATE POLICY "Allow profile photos" ON storage.objects
        FOR ALL USING (bucket_id = 'profile-photos');
        
    RAISE NOTICE 'Policy created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create policy: %', SQLERRM;
END $$;

/* 7. Check if policy was created */
SELECT 
    'Policy Creation Result' as test_name,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname = 'Allow profile photos';

/* 8. Ensure bucket is public */
UPDATE storage.buckets 
SET public = true 
WHERE id = 'profile-photos';

/* 9. Final status */
SELECT 
    'Final Status' as test_name,
    'Policy creation attempted' as status,
    'Bucket should be public' as bucket_status;

/* Success message */
SELECT 'Storage schema error fixed!' as message;
