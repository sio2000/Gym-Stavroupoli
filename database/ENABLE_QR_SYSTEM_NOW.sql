-- Enable QR System - IMMEDIATE FIX
-- This script immediately enables the QR system by fixing all issues

-- ========================================
-- STEP 1: ENABLE FEATURE FLAG
-- ========================================

-- Insert or update the QR system feature flag to be enabled
INSERT INTO feature_flags (name, is_enabled, description) VALUES 
('FEATURE_QR_SYSTEM', true, 'QR Code entrance/exit system')
ON CONFLICT (name) DO UPDATE SET 
    is_enabled = true, 
    updated_at = NOW();

-- ========================================
-- STEP 2: FIX RLS POLICIES
-- ========================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS feature_flags_select_admin_only ON feature_flags;

-- Create new policy that allows all authenticated users to read feature flags
CREATE POLICY feature_flags_select_authenticated_users ON feature_flags
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- ========================================
-- STEP 3: VERIFY
-- ========================================

-- Check that the flag is now enabled and accessible
SELECT 
    'QR System Status:' as status,
    name,
    is_enabled,
    description
FROM feature_flags 
WHERE name = 'FEATURE_QR_SYSTEM';

-- Success message
SELECT 'QR System enabled successfully!' as result;
