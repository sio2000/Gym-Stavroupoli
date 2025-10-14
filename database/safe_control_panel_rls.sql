-- 100% SAFE Control Panel RLS Policies
-- This script ONLY ADDS new policies for control_panel user
-- It does NOT modify, delete, or change any existing data or policies
-- Execute this in Supabase SQL Editor

-- Step 1: Add RLS policies for cash_transactions (only if they don't exist)
DO $$
BEGIN
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
END $$;

-- Step 2: Add RLS policies for user_profiles (only if they don't exist)
DO $$
BEGIN
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
END $$;

-- Step 3: Add RLS policies for membership_packages (only if they don't exist)
DO $$
BEGIN
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
END $$;

-- Step 4: Add RLS policies for membership_package_durations (only if they don't exist)
DO $$
BEGIN
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
END $$;

-- Step 5: Add RLS policies for membership_requests (only if they don't exist)
DO $$
BEGIN
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
END $$;

-- Step 6: Add RLS policies for pilates_schedules (only if they don't exist)
DO $$
BEGIN
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

-- Success message
SELECT 'SUCCESS: Control Panel RLS policies added safely!' as result;
