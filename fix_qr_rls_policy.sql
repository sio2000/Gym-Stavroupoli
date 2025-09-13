-- Fix QR Codes RLS Policy - COMPLETE SOLUTION
-- Διορθώνω όλα τα RLS policies για να λειτουργεί 100%

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can insert own QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Users can update own QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Users can manage own QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Admins can manage all QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Secretaries can read QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Trainers can manage all QR codes" ON qr_codes;

-- Create comprehensive policies for all roles

-- 1. Users can insert their own QR codes
CREATE POLICY "Users can insert own QR codes" ON qr_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Users can read their own QR codes
CREATE POLICY "Users can read own QR codes" ON qr_codes
    FOR SELECT USING (auth.uid() = user_id);

-- 3. Users can update their own QR codes
CREATE POLICY "Users can update own QR codes" ON qr_codes
    FOR UPDATE USING (auth.uid() = user_id);

-- 4. Secretaries can read ALL QR codes (for scanning)
CREATE POLICY "Secretaries can read all QR codes" ON qr_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'secretary'
        )
    );

-- 5. Admins can do everything
CREATE POLICY "Admins can manage all QR codes" ON qr_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- 6. Trainers can read all QR codes
CREATE POLICY "Trainers can read all QR codes" ON qr_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'trainer'
        )
    );

-- Verify the policies exist
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'qr_codes' 
ORDER BY policyname;
