-- FINAL QR SYSTEM ENABLE
-- This script completely fixes the QR system

-- ========================================
-- STEP 1: ENABLE FEATURE FLAG
-- ========================================

-- Ensure the QR system feature flag exists and is enabled
INSERT INTO feature_flags (name, is_enabled, description) VALUES 
('FEATURE_QR_SYSTEM', true, 'QR Code entrance/exit system')
ON CONFLICT (name) DO UPDATE SET 
    is_enabled = true, 
    updated_at = NOW();

-- ========================================
-- STEP 2: FIX RLS POLICIES FOR FEATURE_FLAGS
-- ========================================

-- Drop the restrictive admin-only policy
DROP POLICY IF EXISTS feature_flags_select_admin_only ON feature_flags;

-- Create a policy that allows all authenticated users to read feature flags
CREATE POLICY feature_flags_select_authenticated_users ON feature_flags
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Keep the modify policy as admin-only for security
DROP POLICY IF EXISTS feature_flags_modify_admin_only ON feature_flags;

CREATE POLICY feature_flags_modify_admin_only ON feature_flags
    FOR ALL USING (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    ) WITH CHECK (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

-- ========================================
-- STEP 3: VERIFY THE FIX
-- ========================================

-- Check that the flag is now enabled and accessible
SELECT 
    'QR System Feature Flag:' as info,
    name,
    is_enabled,
    description,
    updated_at
FROM feature_flags 
WHERE name = 'FEATURE_QR_SYSTEM';

-- Check RLS policies
SELECT 
    'RLS Policies for feature_flags:' as info,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'feature_flags'
ORDER BY policyname;

-- ========================================
-- STEP 4: SUCCESS MESSAGE
-- ========================================

SELECT 'QR System is now fully enabled and accessible!' as result;
