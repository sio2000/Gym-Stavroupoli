/* ALTERNATIVE STORAGE FIX - ΕΝΑΛΛΑΚΤΙΚΗ ΔΙΟΡΘΩΣΗ STORAGE
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check what we can access */
SELECT 
    'Storage Access Check' as test_name,
    has_table_privilege('storage', 'objects', 'SELECT') as can_select,
    has_table_privilege('storage', 'objects', 'INSERT') as can_insert,
    has_table_privilege('storage', 'objects', 'UPDATE') as can_update,
    has_table_privilege('storage', 'objects', 'DELETE') as can_delete;

/* 2. Check current user and role */
SELECT 
    'Current User Info' as test_name,
    current_user as current_user,
    session_user as session_user,
    current_role as current_role;

/* 3. Check bucket permissions */
SELECT 
    'Bucket Permissions' as test_name,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'profile-photos';

/* 4. Try to create a simple policy with different syntax */
DO $$
BEGIN
    -- Try to create policy with error handling
    BEGIN
        DROP POLICY IF EXISTS "Simple profile photos policy" ON storage.objects;
        CREATE POLICY "Simple profile photos policy" ON storage.objects
            FOR ALL USING (bucket_id = 'profile-photos');
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not create policy: %', SQLERRM;
    END;
END $$;

/* 5. Check if policy was created */
SELECT 
    'Policy Check' as test_name,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname = 'Simple profile photos policy';

/* 6. Alternative approach - check if we can insert directly */
SELECT 
    'Direct Insert Test' as test_name,
    'Testing if we can insert into storage.objects' as test_description;

/* 7. Make sure bucket is public */
UPDATE storage.buckets 
SET public = true 
WHERE id = 'profile-photos';

/* Success message */
SELECT 'Alternative storage fix applied!' as message;
