/* FIX STORAGE RLS - ΔΙΟΡΘΩΣΗ STORAGE RLS POLICIES
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check if profile-photos bucket exists */
SELECT 
    'Storage Buckets' as test_name,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'profile-photos';

/* 2. Create profile-photos bucket if it doesn't exist */
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-photos',
    'profile-photos',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

/* 3. Drop existing storage policies */
DROP POLICY IF EXISTS "Users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete profile photos" ON storage.objects;

/* 4. Create storage policies for profile photos */
CREATE POLICY "Users can upload profile photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-photos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view profile photos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'profile-photos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update profile photos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profile-photos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete profile photos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'profile-photos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

/* 5. Make bucket public for easier access */
UPDATE storage.buckets 
SET public = true 
WHERE id = 'profile-photos';

/* 6. Test the setup */
SELECT 
    'Storage Setup Complete' as test_name,
    name,
    public,
    file_size_limit
FROM storage.buckets 
WHERE name = 'profile-photos';

/* Success message */
SELECT 'Storage RLS policies fixed!' as message;
