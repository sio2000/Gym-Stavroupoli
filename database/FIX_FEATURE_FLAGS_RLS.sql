-- Fix RLS Policies for feature_flags table
-- Allow all authenticated users to read feature flags (needed for QR system)

-- ========================================
-- PHASE 1: DROP EXISTING RESTRICTIVE POLICIES
-- ========================================

SELECT 'PHASE 1: Dropping existing restrictive policies...' as phase;

-- Drop the existing admin-only policy
DROP POLICY IF EXISTS feature_flags_select_admin_only ON public.feature_flags;

-- ========================================
-- PHASE 2: CREATE NEW PERMISSIVE POLICY
-- ========================================

SELECT 'PHASE 2: Creating new permissive policy...' as phase;

-- Create a new policy that allows all authenticated users to read feature flags
CREATE POLICY feature_flags_select_authenticated_users ON public.feature_flags
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

-- Keep the modify policy as admin-only for security
DROP POLICY IF EXISTS feature_flags_modify_admin_only ON public.feature_flags;

CREATE POLICY feature_flags_modify_admin_only ON public.feature_flags
    FOR ALL USING (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    ) WITH CHECK (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

-- ========================================
-- PHASE 3: VERIFY POLICIES
-- ========================================

SELECT 'PHASE 3: Verifying policies...' as phase;

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'feature_flags'
ORDER BY policyname;

-- ========================================
-- PHASE 4: TEST FEATURE FLAG ACCESS
-- ========================================

SELECT 'PHASE 4: Testing feature flag access...' as phase;

-- Test if the FEATURE_QR_SYSTEM flag is accessible
SELECT 
    name,
    is_enabled,
    description
FROM public.feature_flags 
WHERE name = 'FEATURE_QR_SYSTEM';

-- ========================================
-- PHASE 5: SUCCESS MESSAGE
-- ========================================

SELECT 'PHASE 5: Feature flags RLS policies fixed successfully!' as result;
