-- Fix Control Panel RLS Policies
-- Execute this in Supabase SQL Editor to give control_panel user access to all data

-- Enable RLS on tables if not already enabled
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_package_durations ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilates_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for control_panel user to access all data

-- Cash Transactions Policies
DROP POLICY IF EXISTS "control_panel_select_cash_transactions" ON cash_transactions;
CREATE POLICY "control_panel_select_cash_transactions" ON cash_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'control_panel'
        )
    );

DROP POLICY IF EXISTS "control_panel_insert_cash_transactions" ON cash_transactions;
CREATE POLICY "control_panel_insert_cash_transactions" ON cash_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'control_panel'
        )
    );

DROP POLICY IF EXISTS "control_panel_update_cash_transactions" ON cash_transactions;
CREATE POLICY "control_panel_update_cash_transactions" ON cash_transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'control_panel'
        )
    );

-- User Profiles Policies
DROP POLICY IF EXISTS "control_panel_select_user_profiles" ON user_profiles;
CREATE POLICY "control_panel_select_user_profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role = 'control_panel'
        )
    );

DROP POLICY IF EXISTS "control_panel_update_user_profiles" ON user_profiles;
CREATE POLICY "control_panel_update_user_profiles" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role = 'control_panel'
        )
    );

-- Membership Packages Policies
DROP POLICY IF EXISTS "control_panel_select_membership_packages" ON membership_packages;
CREATE POLICY "control_panel_select_membership_packages" ON membership_packages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'control_panel'
        )
    );

DROP POLICY IF EXISTS "control_panel_update_membership_packages" ON membership_packages;
CREATE POLICY "control_panel_update_membership_packages" ON membership_packages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'control_panel'
        )
    );

-- Membership Package Durations Policies
DROP POLICY IF EXISTS "control_panel_select_membership_package_durations" ON membership_package_durations;
CREATE POLICY "control_panel_select_membership_package_durations" ON membership_package_durations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'control_panel'
        )
    );

DROP POLICY IF EXISTS "control_panel_update_membership_package_durations" ON membership_package_durations;
CREATE POLICY "control_panel_update_membership_package_durations" ON membership_package_durations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'control_panel'
        )
    );

-- Membership Requests Policies
DROP POLICY IF EXISTS "control_panel_select_membership_requests" ON membership_requests;
CREATE POLICY "control_panel_select_membership_requests" ON membership_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'control_panel'
        )
    );

DROP POLICY IF EXISTS "control_panel_update_membership_requests" ON membership_requests;
CREATE POLICY "control_panel_update_membership_requests" ON membership_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'control_panel'
        )
    );

-- Pilates Schedules Policies
DROP POLICY IF EXISTS "control_panel_select_pilates_schedules" ON pilates_schedules;
CREATE POLICY "control_panel_select_pilates_schedules" ON pilates_schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'control_panel'
        )
    );

DROP POLICY IF EXISTS "control_panel_insert_pilates_schedules" ON pilates_schedules;
CREATE POLICY "control_panel_insert_pilates_schedules" ON pilates_schedules
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'control_panel'
        )
    );

DROP POLICY IF EXISTS "control_panel_update_pilates_schedules" ON pilates_schedules;
CREATE POLICY "control_panel_update_pilates_schedules" ON pilates_schedules
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'control_panel'
        )
    );

DROP POLICY IF EXISTS "control_panel_delete_pilates_schedules" ON pilates_schedules;
CREATE POLICY "control_panel_delete_pilates_schedules" ON pilates_schedules
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'control_panel'
        )
    );

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE policyname LIKE '%control_panel%'
ORDER BY tablename, policyname;
