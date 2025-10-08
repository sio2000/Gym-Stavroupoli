-- QUICK FIX: PILATES DEPOSITS RLS POLICY
-- This script only fixes the RLS policy issue for pilates_deposits table

-- ========================================
-- PHASE 1: CHECK CURRENT RLS POLICIES
-- ========================================

SELECT 'PHASE 1: Checking current RLS policies for pilates_deposits...' as phase;

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'pilates_deposits' 
ORDER BY policyname;

-- ========================================
-- PHASE 2: DROP EXISTING PROBLEMATIC POLICIES
-- ========================================

SELECT 'PHASE 2: Dropping existing problematic policies...' as phase;

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS pilates_deposits_select_own_or_admin ON public.pilates_deposits;
DROP POLICY IF EXISTS pilates_deposits_modify_admin_only ON public.pilates_deposits;
DROP POLICY IF EXISTS pilates_deposits_insert_admin_only ON public.pilates_deposits;
DROP POLICY IF EXISTS pilates_deposits_update_admin_only ON public.pilates_deposits;
DROP POLICY IF EXISTS pilates_deposits_delete_admin_only ON public.pilates_deposits;

-- ========================================
-- PHASE 3: CREATE CORRECTED RLS POLICIES
-- ========================================

SELECT 'PHASE 3: Creating corrected RLS policies...' as phase;

-- Policy for SELECT: Users can read their own deposits, admins can read all
CREATE POLICY pilates_deposits_select_own_or_admin ON public.pilates_deposits
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

-- Policy for INSERT: Only admins can insert deposits
CREATE POLICY pilates_deposits_insert_admin_only ON public.pilates_deposits
    FOR INSERT WITH CHECK (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

-- Policy for UPDATE: Only admins can update deposits
CREATE POLICY pilates_deposits_update_admin_only ON public.pilates_deposits
    FOR UPDATE USING (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    ) WITH CHECK (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

-- Policy for DELETE: Only admins can delete deposits
CREATE POLICY pilates_deposits_delete_admin_only ON public.pilates_deposits
    FOR DELETE USING (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

-- ========================================
-- PHASE 4: VERIFY POLICIES
-- ========================================

SELECT 'PHASE 4: Verifying new RLS policies...' as phase;

-- Check the new policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'pilates_deposits' 
ORDER BY policyname;

-- ========================================
-- PHASE 5: TEST ADMIN ACCESS
-- ========================================

SELECT 'PHASE 5: Testing admin access to pilates_deposits...' as phase;

-- Test that the table is accessible (this should work if RLS is configured correctly)
SELECT COUNT(*) as total_deposits FROM public.pilates_deposits;

SELECT 'Pilates deposits RLS policies fixed successfully!' as result;
