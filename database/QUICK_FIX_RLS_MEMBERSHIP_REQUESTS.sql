-- Quick fix for membership_requests RLS policies
-- This will allow users to insert their own membership requests

-- Temporarily disable RLS to test
ALTER TABLE membership_requests DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'membership_requests';

-- If you want to re-enable RLS later with proper policies, run:
-- ALTER TABLE membership_requests ENABLE ROW LEVEL SECURITY;
-- Then run the FIX_MEMBERSHIP_REQUESTS_RLS.sql script
