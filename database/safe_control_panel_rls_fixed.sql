-- 100% SAFE Control Panel RLS Policies - FIXED VERSION
-- This script ONLY ADDS new policies for control_panel user
-- It checks if tables exist before creating policies
-- Execute this in Supabase SQL Editor

-- Step 1: Check what tables exist and add policies only for existing tables
DO $$
BEGIN
    -- Check if cash_transactions table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cash_transactions') THEN
        -- Cash Transactions SELECT policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'cash_transactions' 
            AND policyname = 'control_panel_select_cash_transactions'
        ) THEN
            CREATE POLICY "control_panel_select_cash_transactions" ON cash_transactions
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM user_profiles 
                        WHERE user_profiles.id = auth.uid() 
                        AND user_profiles.role = 'control_panel'
                    )
                );
            RAISE NOTICE 'Added control_panel_select_cash_transactions policy';
        ELSE
            RAISE NOTICE 'control_panel_select_cash_transactions policy already exists';
        END IF;

        -- Cash Transactions INSERT policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'cash_transactions' 
            AND policyname = 'control_panel_insert_cash_transactions'
        ) THEN
            CREATE POLICY "control_panel_insert_cash_transactions" ON cash_transactions
                FOR INSERT WITH CHECK (
                    EXISTS (
                        SELECT 1 FROM user_profiles 
                        WHERE user_profiles.id = auth.uid() 
                        AND user_profiles.role = 'control_panel'
                    )
                );
            RAISE NOTICE 'Added control_panel_insert_cash_transactions policy';
        ELSE
            RAISE NOTICE 'control_panel_insert_cash_transactions policy already exists';
        END IF;

        -- Cash Transactions UPDATE policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'cash_transactions' 
            AND policyname = 'control_panel_update_cash_transactions'
        ) THEN
            CREATE POLICY "control_panel_update_cash_transactions" ON cash_transactions
                FOR UPDATE USING (
                    EXISTS (
                        SELECT 1 FROM user_profiles 
                        WHERE user_profiles.id = auth.uid() 
                        AND user_profiles.role = 'control_panel'
                    )
                );
            RAISE NOTICE 'Added control_panel_update_cash_transactions policy';
        ELSE
            RAISE NOTICE 'control_panel_update_cash_transactions policy already exists';
        END IF;
    ELSE
        RAISE NOTICE 'cash_transactions table does not exist, skipping...';
    END IF;
END $$;

-- Step 2: Add RLS policies for user_profiles (this table should exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        -- User Profiles SELECT policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'user_profiles' 
            AND policyname = 'control_panel_select_user_profiles'
        ) THEN
            CREATE POLICY "control_panel_select_user_profiles" ON user_profiles
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM user_profiles up 
                        WHERE up.id = auth.uid() 
                        AND up.role = 'control_panel'
                    )
                );
            RAISE NOTICE 'Added control_panel_select_user_profiles policy';
        ELSE
            RAISE NOTICE 'control_panel_select_user_profiles policy already exists';
        END IF;

        -- User Profiles UPDATE policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'user_profiles' 
            AND policyname = 'control_panel_update_user_profiles'
        ) THEN
            CREATE POLICY "control_panel_update_user_profiles" ON user_profiles
                FOR UPDATE USING (
                    EXISTS (
                        SELECT 1 FROM user_profiles up 
                        WHERE up.id = auth.uid() 
                        AND up.role = 'control_panel'
                    )
                );
            RAISE NOTICE 'Added control_panel_update_user_profiles policy';
        ELSE
            RAISE NOTICE 'control_panel_update_user_profiles policy already exists';
        END IF;
    ELSE
        RAISE NOTICE 'user_profiles table does not exist, skipping...';
    END IF;
END $$;

-- Step 3: Add RLS policies for membership_packages (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_packages') THEN
        -- Membership Packages SELECT policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'membership_packages' 
            AND policyname = 'control_panel_select_membership_packages'
        ) THEN
            CREATE POLICY "control_panel_select_membership_packages" ON membership_packages
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM user_profiles 
                        WHERE user_profiles.id = auth.uid() 
                        AND user_profiles.role = 'control_panel'
                    )
                );
            RAISE NOTICE 'Added control_panel_select_membership_packages policy';
        ELSE
            RAISE NOTICE 'control_panel_select_membership_packages policy already exists';
        END IF;

        -- Membership Packages UPDATE policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'membership_packages' 
            AND policyname = 'control_panel_update_membership_packages'
        ) THEN
            CREATE POLICY "control_panel_update_membership_packages" ON membership_packages
                FOR UPDATE USING (
                    EXISTS (
                        SELECT 1 FROM user_profiles 
                        WHERE user_profiles.id = auth.uid() 
                        AND user_profiles.role = 'control_panel'
                    )
                );
            RAISE NOTICE 'Added control_panel_update_membership_packages policy';
        ELSE
            RAISE NOTICE 'control_panel_update_membership_packages policy already exists';
        END IF;
    ELSE
        RAISE NOTICE 'membership_packages table does not exist, skipping...';
    END IF;
END $$;

-- Step 4: Add RLS policies for membership_package_durations (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_package_durations') THEN
        -- Membership Package Durations SELECT policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'membership_package_durations' 
            AND policyname = 'control_panel_select_membership_package_durations'
        ) THEN
            CREATE POLICY "control_panel_select_membership_package_durations" ON membership_package_durations
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM user_profiles 
                        WHERE user_profiles.id = auth.uid() 
                        AND user_profiles.role = 'control_panel'
                    )
                );
            RAISE NOTICE 'Added control_panel_select_membership_package_durations policy';
        ELSE
            RAISE NOTICE 'control_panel_select_membership_package_durations policy already exists';
        END IF;

        -- Membership Package Durations UPDATE policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'membership_package_durations' 
            AND policyname = 'control_panel_update_membership_package_durations'
        ) THEN
            CREATE POLICY "control_panel_update_membership_package_durations" ON membership_package_durations
                FOR UPDATE USING (
                    EXISTS (
                        SELECT 1 FROM user_profiles 
                        WHERE user_profiles.id = auth.uid() 
                        AND user_profiles.role = 'control_panel'
                    )
                );
            RAISE NOTICE 'Added control_panel_update_membership_package_durations policy';
        ELSE
            RAISE NOTICE 'control_panel_update_membership_package_durations policy already exists';
        END IF;
    ELSE
        RAISE NOTICE 'membership_package_durations table does not exist, skipping...';
    END IF;
END $$;

-- Step 5: Add RLS policies for membership_requests (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_requests') THEN
        -- Membership Requests SELECT policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'membership_requests' 
            AND policyname = 'control_panel_select_membership_requests'
        ) THEN
            CREATE POLICY "control_panel_select_membership_requests" ON membership_requests
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM user_profiles 
                        WHERE user_profiles.id = auth.uid() 
                        AND user_profiles.role = 'control_panel'
                    )
                );
            RAISE NOTICE 'Added control_panel_select_membership_requests policy';
        ELSE
            RAISE NOTICE 'control_panel_select_membership_requests policy already exists';
        END IF;

        -- Membership Requests UPDATE policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'membership_requests' 
            AND policyname = 'control_panel_update_membership_requests'
        ) THEN
            CREATE POLICY "control_panel_update_membership_requests" ON membership_requests
                FOR UPDATE USING (
                    EXISTS (
                        SELECT 1 FROM user_profiles 
                        WHERE user_profiles.id = auth.uid() 
                        AND user_profiles.role = 'control_panel'
                    )
                );
            RAISE NOTICE 'Added control_panel_update_membership_requests policy';
        ELSE
            RAISE NOTICE 'control_panel_update_membership_requests policy already exists';
        END IF;
    ELSE
        RAISE NOTICE 'membership_requests table does not exist, skipping...';
    END IF;
END $$;

-- Step 6: Add RLS policies for pilates_schedules (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pilates_schedules') THEN
        -- Pilates Schedules SELECT policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'pilates_schedules' 
            AND policyname = 'control_panel_select_pilates_schedules'
        ) THEN
            CREATE POLICY "control_panel_select_pilates_schedules" ON pilates_schedules
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM user_profiles 
                        WHERE user_profiles.id = auth.uid() 
                        AND user_profiles.role = 'control_panel'
                    )
                );
            RAISE NOTICE 'Added control_panel_select_pilates_schedules policy';
        ELSE
            RAISE NOTICE 'control_panel_select_pilates_schedules policy already exists';
        END IF;

        -- Pilates Schedules INSERT policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'pilates_schedules' 
            AND policyname = 'control_panel_insert_pilates_schedules'
        ) THEN
            CREATE POLICY "control_panel_insert_pilates_schedules" ON pilates_schedules
                FOR INSERT WITH CHECK (
                    EXISTS (
                        SELECT 1 FROM user_profiles 
                        WHERE user_profiles.id = auth.uid() 
                        AND user_profiles.role = 'control_panel'
                    )
                );
            RAISE NOTICE 'Added control_panel_insert_pilates_schedules policy';
        ELSE
            RAISE NOTICE 'control_panel_insert_pilates_schedules policy already exists';
        END IF;

        -- Pilates Schedules UPDATE policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'pilates_schedules' 
            AND policyname = 'control_panel_update_pilates_schedules'
        ) THEN
            CREATE POLICY "control_panel_update_pilates_schedules" ON pilates_schedules
                FOR UPDATE USING (
                    EXISTS (
                        SELECT 1 FROM user_profiles 
                        WHERE user_profiles.id = auth.uid() 
                        AND user_profiles.role = 'control_panel'
                    )
                );
            RAISE NOTICE 'Added control_panel_update_pilates_schedules policy';
        ELSE
            RAISE NOTICE 'control_panel_update_pilates_schedules policy already exists';
        END IF;

        -- Pilates Schedules DELETE policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'pilates_schedules' 
            AND policyname = 'control_panel_delete_pilates_schedules'
        ) THEN
            CREATE POLICY "control_panel_delete_pilates_schedules" ON pilates_schedules
                FOR DELETE USING (
                    EXISTS (
                        SELECT 1 FROM user_profiles 
                        WHERE user_profiles.id = auth.uid() 
                        AND user_profiles.role = 'control_panel'
                    )
                );
            RAISE NOTICE 'Added control_panel_delete_pilates_schedules policy';
        ELSE
            RAISE NOTICE 'control_panel_delete_pilates_schedules policy already exists';
        END IF;
    ELSE
        RAISE NOTICE 'pilates_schedules table does not exist, skipping...';
    END IF;
END $$;

-- Final verification - show all control_panel policies
SELECT 
    'VERIFICATION: Control Panel Policies Created' as status,
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE policyname LIKE '%control_panel%'
ORDER BY tablename, policyname;

-- Show which tables exist
SELECT 
    'EXISTING TABLES:' as info,
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cash_transactions', 'user_profiles', 'membership_packages', 'membership_package_durations', 'membership_requests', 'pilates_schedules')
ORDER BY table_name;

-- Success message
SELECT 'SUCCESS: Control Panel RLS policies added safely for existing tables only!' as result;
