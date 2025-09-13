-- TEST: Temporarily disable RLS to test if that's the issue
-- This is a quick test to see if RLS is the problem

-- Disable RLS completely
ALTER TABLE membership_requests DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'membership_requests';

-- If this fixes the issue, you can re-enable RLS later with proper policies
-- To re-enable: ALTER TABLE membership_requests ENABLE ROW LEVEL SECURITY;
