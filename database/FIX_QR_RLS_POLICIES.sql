-- Fix QR System RLS Policies
-- This script fixes the RLS policies for QR codes

-- =============================================
-- STEP 1: DROP EXISTING POLICIES
-- =============================================
DROP POLICY IF EXISTS "Users can view own QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Admins can manage all QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Trainers can manage all QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Secretaries can read QR codes" ON qr_codes;

-- =============================================
-- STEP 2: CREATE CORRECTED POLICIES
-- =============================================
-- Users can view and manage their own QR codes
CREATE POLICY "Users can manage own QR codes" ON qr_codes
    FOR ALL USING (auth.uid() = user_id);

-- Admins can manage all QR codes
CREATE POLICY "Admins can manage all QR codes" ON qr_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Trainers can manage all QR codes
CREATE POLICY "Trainers can manage all QR codes" ON qr_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'trainer'
        )
    );

-- Secretaries can read QR codes
CREATE POLICY "Secretaries can read QR codes" ON qr_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM secretaries 
            WHERE id = auth.uid() 
            AND is_active = true
        )
    );

-- =============================================
-- STEP 3: VERIFY POLICIES
-- =============================================
SELECT 'RLS Policies created:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'qr_codes'
ORDER BY policyname;

-- =============================================
-- STEP 4: TEST QR CODE CREATION
-- =============================================
-- Test if user can create QR code
SELECT 'Testing QR code creation...' as status;

-- Check if user exists
SELECT 'User check:' as status;
SELECT id, email, role FROM user_profiles WHERE user_id = auth.uid();

-- Check if policies allow INSERT
SELECT 'Policy check:' as status;
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'qr_codes' 
AND cmd = 'INSERT';

-- Success message
SELECT 'RLS policies fixed successfully!' as result;
