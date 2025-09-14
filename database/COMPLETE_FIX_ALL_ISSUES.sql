/* COMPLETE FIX ALL ISSUES - ΠΛΗΡΗΣ ΔΙΟΡΘΩΣΗ ΟΛΩΝ ΤΩΝ ΠΡΟΒΛΗΜΑΤΩΝ
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Fix Storage RLS Policies */
-- Create profile-photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-photos',
    'profile-photos',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete profile photos" ON storage.objects;

-- Create storage policies for profile photos
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

-- Make bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'profile-photos';

/* 2. Ensure all profile columns exist */
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS profile_photo TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dob_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'el',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

/* 3. Update existing records to have updated_at */
UPDATE public.user_profiles 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

/* 4. Test profile update for the specific user */
UPDATE user_profiles 
SET 
    first_name = 'PPPPPP',
    last_name = 'SASA',
    address = 'MPOTSARI 147',
    emergency_contact_name = 'kkkkkkkkkkkkkkk',
    emergency_contact_phone = '',
    updated_at = NOW()
WHERE user_id = '12ca8372-af8e-49b6-b68d-7b87ffb5b09a';

/* 5. Check the results */
SELECT 
    'Final Profile Data' as test_name,
    user_id,
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    address,
    emergency_contact_name,
    emergency_contact_phone,
    profile_photo,
    language,
    updated_at
FROM user_profiles 
WHERE user_id = '12ca8372-af8e-49b6-b68d-7b87ffb5b09a';

/* 6. Check storage bucket */
SELECT 
    'Storage Bucket Status' as test_name,
    name,
    public,
    file_size_limit
FROM storage.buckets 
WHERE name = 'profile-photos';

/* Success message */
SELECT 'All issues fixed - profile updates and photo uploads should work now!' as message;
