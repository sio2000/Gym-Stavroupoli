-- =============================================
-- SAFE RLS POLICIES FOR SECRETARY ROLE
-- =============================================
-- This script safely adds RLS policies for the 'secretary' role
-- without modifying or deleting existing policies.

-- =============================================
-- STEP 1: CHECK EXISTING POLICIES
-- =============================================
SELECT 'Checking existing policies...' as step;

-- List current policies for all target tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN (
    'personal_training_schedules', 
    'personal_training_codes', 
    'group_sessions',
    'user_profiles',
    'memberships',
    'membership_packages',
    'membership_requests'
)
ORDER BY tablename, policyname;

-- =============================================
-- STEP 2: ADD SECRETARY POLICIES (IF NOT EXISTS)
-- =============================================
SELECT 'Adding secretary policies...' as step;

-- Policy for personal_training_schedules - Secretary access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'personal_training_schedules' 
        AND policyname = 'Secretary access to personal training schedules'
    ) THEN
        CREATE POLICY "Secretary access to personal training schedules" ON personal_training_schedules
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_id = auth.uid() 
                    AND role = 'secretary'
                )
            );
        RAISE NOTICE 'Created policy: Secretary access to personal training schedules';
    ELSE
        RAISE NOTICE 'Policy already exists: Secretary access to personal training schedules';
    END IF;
END $$;

-- Policy for personal_training_codes - Secretary access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'personal_training_codes' 
        AND policyname = 'Secretary access to personal training codes'
    ) THEN
        CREATE POLICY "Secretary access to personal training codes" ON personal_training_codes
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_id = auth.uid() 
                    AND role = 'secretary'
                )
            );
        RAISE NOTICE 'Created policy: Secretary access to personal training codes';
    ELSE
        RAISE NOTICE 'Policy already exists: Secretary access to personal training codes';
    END IF;
END $$;

-- Policy for group_sessions - Secretary access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'group_sessions' 
        AND policyname = 'Secretary access to group sessions'
    ) THEN
        CREATE POLICY "Secretary access to group sessions" ON group_sessions
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_id = auth.uid() 
                    AND role = 'secretary'
                )
            );
        RAISE NOTICE 'Created policy: Secretary access to group sessions';
    ELSE
        RAISE NOTICE 'Policy already exists: Secretary access to group sessions';
    END IF;
END $$;

-- Policy for user_profiles - Secretary can view all profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Secretary can view all profiles'
    ) THEN
        CREATE POLICY "Secretary can view all profiles" ON user_profiles
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_id = auth.uid() 
                    AND role = 'secretary'
                )
            );
        RAISE NOTICE 'Created policy: Secretary can view all profiles';
    ELSE
        RAISE NOTICE 'Policy already exists: Secretary can view all profiles';
    END IF;
END $$;

-- Policy for memberships - Secretary can view all memberships
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'memberships' 
        AND policyname = 'Secretary can view all memberships'
    ) THEN
        CREATE POLICY "Secretary can view all memberships" ON memberships
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_id = auth.uid() 
                    AND role = 'secretary'
                )
            );
        RAISE NOTICE 'Created policy: Secretary can view all memberships';
    ELSE
        RAISE NOTICE 'Policy already exists: Secretary can view all memberships';
    END IF;
END $$;

-- Policy for membership_packages - Secretary can view all packages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'membership_packages' 
        AND policyname = 'Secretary can view all packages'
    ) THEN
        CREATE POLICY "Secretary can view all packages" ON membership_packages
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_id = auth.uid() 
                    AND role = 'secretary'
                )
            );
        RAISE NOTICE 'Created policy: Secretary can view all packages';
    ELSE
        RAISE NOTICE 'Policy already exists: Secretary can view all packages';
    END IF;
END $$;

-- Policy for membership_requests - Secretary can manage all requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'membership_requests' 
        AND policyname = 'Secretary can manage membership requests'
    ) THEN
        CREATE POLICY "Secretary can manage membership requests" ON membership_requests
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_id = auth.uid() 
                    AND role = 'secretary'
                )
            );
        RAISE NOTICE 'Created policy: Secretary can manage membership requests';
    ELSE
        RAISE NOTICE 'Policy already exists: Secretary can manage membership requests';
    END IF;
END $$;

-- =============================================
-- STEP 3: VERIFY NEW POLICIES
-- =============================================
SELECT 'Verifying new policies...' as step;

-- List all secretary policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN (
    'personal_training_schedules', 
    'personal_training_codes', 
    'group_sessions',
    'user_profiles',
    'memberships',
    'membership_packages',
    'membership_requests'
)
AND policyname LIKE '%Secretary%'
ORDER BY tablename, policyname;

-- =============================================
-- STEP 4: COUNT POLICIES PER TABLE
-- =============================================
SELECT 'Counting policies per table...' as step;

SELECT 
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN policyname LIKE '%Secretary%' THEN 1 END) as secretary_policies
FROM pg_policies 
WHERE tablename IN (
    'personal_training_schedules', 
    'personal_training_codes', 
    'group_sessions',
    'user_profiles',
    'memberships',
    'membership_packages',
    'membership_requests'
)
GROUP BY tablename
ORDER BY tablename;

-- =============================================
-- STEP 5: SUCCESS MESSAGE
-- =============================================
SELECT 'Secretary RLS policies added successfully!' as message;
