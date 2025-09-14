-- ULTIMATE RLS FIX for membership_requests table
-- This will completely fix the RLS policy issue

-- Step 1: Disable RLS completely
ALTER TABLE membership_requests DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (force drop)
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Get all policies for membership_requests
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'membership_requests'
    LOOP
        -- Drop each policy
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON membership_requests';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Step 3: Verify all policies are dropped
SELECT 'Remaining policies:' as status, policyname 
FROM pg_policies 
WHERE tablename = 'membership_requests';

-- Step 4: Re-enable RLS
ALTER TABLE membership_requests ENABLE ROW LEVEL SECURITY;

-- Step 5: Create ONLY the essential policies
-- Policy 1: Allow authenticated users to insert their own requests
CREATE POLICY "users_insert_own_requests" ON membership_requests
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy 2: Allow authenticated users to view their own requests  
CREATE POLICY "users_view_own_requests" ON membership_requests
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy 3: Allow authenticated users to update their own requests
CREATE POLICY "users_update_own_requests" ON membership_requests
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Step 6: Verify the new policies
SELECT 
    'New policies created:' as status,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'membership_requests'
ORDER BY policyname;

-- Step 7: Test the policies work
-- This should return the current user's ID (for testing)
SELECT 'Current auth.uid():' as test, auth.uid() as user_id;
