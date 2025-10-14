-- Fix Missing Control Panel RLS Policies
-- This script adds the missing policies for control_panel user
-- Execute this in Supabase SQL Editor

-- Add RLS policies for user_cash_transactions (ΤΑΜΕΙΟ)
DO $$
BEGIN
    -- user_cash_transactions SELECT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_cash_transactions' 
        AND policyname = 'control_panel_select_user_cash_transactions'
    ) THEN
        CREATE POLICY "control_panel_select_user_cash_transactions" ON user_cash_transactions
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.role = 'control_panel'
                )
            );
        RAISE NOTICE 'Added control_panel_select_user_cash_transactions policy';
    ELSE
        RAISE NOTICE 'control_panel_select_user_cash_transactions policy already exists';
    END IF;

    -- user_cash_transactions INSERT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_cash_transactions' 
        AND policyname = 'control_panel_insert_user_cash_transactions'
    ) THEN
        CREATE POLICY "control_panel_insert_user_cash_transactions" ON user_cash_transactions
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.role = 'control_panel'
                )
            );
        RAISE NOTICE 'Added control_panel_insert_user_cash_transactions policy';
    ELSE
        RAISE NOTICE 'control_panel_insert_user_cash_transactions policy already exists';
    END IF;

    -- user_cash_transactions UPDATE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_cash_transactions' 
        AND policyname = 'control_panel_update_user_cash_transactions'
    ) THEN
        CREATE POLICY "control_panel_update_user_cash_transactions" ON user_cash_transactions
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.role = 'control_panel'
                )
            );
        RAISE NOTICE 'Added control_panel_update_user_cash_transactions policy';
    ELSE
        RAISE NOTICE 'control_panel_update_user_cash_transactions policy already exists';
    END IF;

    -- user_cash_transactions DELETE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_cash_transactions' 
        AND policyname = 'control_panel_delete_user_cash_transactions'
    ) THEN
        CREATE POLICY "control_panel_delete_user_cash_transactions" ON user_cash_transactions
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.role = 'control_panel'
                )
            );
        RAISE NOTICE 'Added control_panel_delete_user_cash_transactions policy';
    ELSE
        RAISE NOTICE 'control_panel_delete_user_cash_transactions policy already exists';
    END IF;
END $$;

-- Add RLS policies for pilates_schedule_slots (PILATES ΠΡΟΓΡΑΜΜΑ)
DO $$
BEGIN
    -- pilates_schedule_slots SELECT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pilates_schedule_slots' 
        AND policyname = 'control_panel_select_pilates_schedule_slots'
    ) THEN
        CREATE POLICY "control_panel_select_pilates_schedule_slots" ON pilates_schedule_slots
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.role = 'control_panel'
                )
            );
        RAISE NOTICE 'Added control_panel_select_pilates_schedule_slots policy';
    ELSE
        RAISE NOTICE 'control_panel_select_pilates_schedule_slots policy already exists';
    END IF;

    -- pilates_schedule_slots INSERT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pilates_schedule_slots' 
        AND policyname = 'control_panel_insert_pilates_schedule_slots'
    ) THEN
        CREATE POLICY "control_panel_insert_pilates_schedule_slots" ON pilates_schedule_slots
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.role = 'control_panel'
                )
            );
        RAISE NOTICE 'Added control_panel_insert_pilates_schedule_slots policy';
    ELSE
        RAISE NOTICE 'control_panel_insert_pilates_schedule_slots policy already exists';
    END IF;

    -- pilates_schedule_slots UPDATE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pilates_schedule_slots' 
        AND policyname = 'control_panel_update_pilates_schedule_slots'
    ) THEN
        CREATE POLICY "control_panel_update_pilates_schedule_slots" ON pilates_schedule_slots
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.role = 'control_panel'
                )
            );
        RAISE NOTICE 'Added control_panel_update_pilates_schedule_slots policy';
    ELSE
        RAISE NOTICE 'control_panel_update_pilates_schedule_slots policy already exists';
    END IF;

    -- pilates_schedule_slots DELETE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pilates_schedule_slots' 
        AND policyname = 'control_panel_delete_pilates_schedule_slots'
    ) THEN
        CREATE POLICY "control_panel_delete_pilates_schedule_slots" ON pilates_schedule_slots
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.id = auth.uid() 
                    AND user_profiles.role = 'control_panel'
                )
            );
        RAISE NOTICE 'Added control_panel_delete_pilates_schedule_slots policy';
    ELSE
        RAISE NOTICE 'control_panel_delete_pilates_schedule_slots policy already exists';
    END IF;
END $$;

-- Verify all control_panel policies exist
SELECT 
    'VERIFICATION: All Control Panel Policies' as status,
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE policyname LIKE '%control_panel%'
ORDER BY tablename, policyname;

-- Success message
SELECT 'SUCCESS: Missing Control Panel RLS policies added!' as result;
