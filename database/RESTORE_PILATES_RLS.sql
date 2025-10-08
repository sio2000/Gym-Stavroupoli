-- RESTORE PILATES DEPOSITS RLS WITH CORRECT POLICIES
-- This script re-enables RLS with proper policies after the emergency fix

-- ========================================
-- PHASE 1: ENABLE RLS
-- ========================================

SELECT 'PHASE 1: Re-enabling RLS on pilates_deposits...' as phase;

-- Enable RLS
ALTER TABLE public.pilates_deposits ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PHASE 2: CREATE CORRECT RLS POLICIES
-- ========================================

SELECT 'PHASE 2: Creating correct RLS policies...' as phase;

-- Policy for SELECT: Users can read their own deposits, admins can read all
CREATE POLICY pilates_deposits_select_policy ON public.pilates_deposits
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

-- Policy for INSERT: Only admins can insert deposits
CREATE POLICY pilates_deposits_insert_policy ON public.pilates_deposits
    FOR INSERT WITH CHECK (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

-- Policy for UPDATE: Only admins can update deposits
CREATE POLICY pilates_deposits_update_policy ON public.pilates_deposits
    FOR UPDATE USING (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    ) WITH CHECK (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

-- Policy for DELETE: Only admins can delete deposits
CREATE POLICY pilates_deposits_delete_policy ON public.pilates_deposits
    FOR DELETE USING (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

-- ========================================
-- PHASE 3: VERIFY POLICIES
-- ========================================

SELECT 'PHASE 3: Verifying RLS policies...' as phase;

-- Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'pilates_deposits';

-- Check policies exist
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
-- PHASE 4: TEST ACCESS
-- ========================================

SELECT 'PHASE 4: Testing access...' as phase;

-- Test SELECT (should work for admins)
SELECT COUNT(*) as total_deposits FROM public.pilates_deposits;

SELECT 'RLS restored with correct policies!' as result;
