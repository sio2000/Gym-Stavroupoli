-- Clean RLS fix for membership_requests table
-- Remove all existing policies and create clean, simple ones

-- First, disable RLS temporarily
ALTER TABLE membership_requests DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'membership_requests'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON membership_requests';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE membership_requests ENABLE ROW LEVEL SECURITY;

-- Create simple, clean policies
-- Allow authenticated users to insert their own requests
CREATE POLICY "allow_insert_own_requests" ON membership_requests
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to view their own requests
CREATE POLICY "allow_select_own_requests" ON membership_requests
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow admins to do everything
CREATE POLICY "allow_admin_all" ON membership_requests
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Verify the policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'membership_requests'
ORDER BY policyname;
