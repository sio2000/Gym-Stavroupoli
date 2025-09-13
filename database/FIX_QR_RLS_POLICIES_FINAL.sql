-- Fix QR System RLS Policies - FINAL VERSION
-- This script fixes the RLS policies for QR codes to allow users to insert their own QR codes
-- Version: 1.0.0
-- Created: 2025-01-07

-- =============================================
-- STEP 1: DROP EXISTING POLICIES
-- =============================================
DROP POLICY IF EXISTS "Users can view own QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Users can manage own QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Admins can manage all QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Trainers can manage all QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Secretaries can read QR codes" ON qr_codes;

-- =============================================
-- STEP 2: CREATE CORRECTED POLICIES
-- =============================================

-- Users can view and manage their own QR codes (SELECT, INSERT, UPDATE, DELETE)
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
SELECT 'RLS Policies created successfully' as status;

SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'qr_codes'
ORDER BY policyname;

-- =============================================
-- STEP 4: TEST QR CODE CREATION
-- =============================================
-- This query should return the current user's auth.uid() for testing
SELECT 'Current auth.uid():' as info, auth.uid() as user_id;

-- =============================================
-- STEP 5: ENABLE FEATURE FLAG
-- =============================================
-- Ensure the QR system feature flag is enabled
INSERT INTO feature_flags (name, is_enabled, description)
VALUES ('FEATURE_QR_SYSTEM', true, 'QR Code system for gym entry/exit')
ON CONFLICT (name) 
DO UPDATE SET 
    is_enabled = true,
    updated_at = NOW();

-- =============================================
-- STEP 6: VERIFY FEATURE FLAG
-- =============================================
SELECT 'Feature flag status:' as info, name, is_enabled 
FROM feature_flags 
WHERE name = 'FEATURE_QR_SYSTEM';

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
SELECT 'QR System RLS Policies fixed successfully!' as completion_status;
