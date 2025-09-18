-- Fix RLS policies for user_cash_transactions to allow secretary access
-- This fixes the issue where secretaries cannot save cash/pos transactions

-- Add secretary permissions for viewing cash transactions
DROP POLICY IF EXISTS "Secretaries can view all cash transactions" ON user_cash_transactions;
CREATE POLICY "Secretaries can view all cash transactions" ON user_cash_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('admin', 'secretary')
        )
    );

-- Add secretary permissions for inserting cash transactions
DROP POLICY IF EXISTS "Secretaries can insert cash transactions" ON user_cash_transactions;
CREATE POLICY "Secretaries can insert cash transactions" ON user_cash_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('admin', 'secretary')
        )
    );

-- Add secretary permissions for updating cash transactions
DROP POLICY IF EXISTS "Secretaries can update cash transactions" ON user_cash_transactions;
CREATE POLICY "Secretaries can update cash transactions" ON user_cash_transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('admin', 'secretary')
        )
    );

-- Add secretary permissions for deleting cash transactions
DROP POLICY IF EXISTS "Secretaries can delete cash transactions" ON user_cash_transactions;
CREATE POLICY "Secretaries can delete cash transactions" ON user_cash_transactions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('admin', 'secretary')
        )
    );

-- Update existing admin policies to use the combined check
DROP POLICY IF EXISTS "Admins can view all cash transactions" ON user_cash_transactions;
CREATE POLICY "Admins and Secretaries can view all cash transactions" ON user_cash_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('admin', 'secretary')
        )
    );

DROP POLICY IF EXISTS "Admins can insert cash transactions" ON user_cash_transactions;
CREATE POLICY "Admins and Secretaries can insert cash transactions" ON user_cash_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('admin', 'secretary')
        )
    );

DROP POLICY IF EXISTS "Admins can update cash transactions" ON user_cash_transactions;
CREATE POLICY "Admins and Secretaries can update cash transactions" ON user_cash_transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('admin', 'secretary')
        )
    );

DROP POLICY IF EXISTS "Admins can delete cash transactions" ON user_cash_transactions;
CREATE POLICY "Admins and Secretaries can delete cash transactions" ON user_cash_transactions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('admin', 'secretary')
        )
    );

-- Also need to fix the same issue for user_kettlebell_points table
-- Check if the table exists first
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_kettlebell_points') THEN
        -- Add secretary permissions for viewing kettlebell points
        DROP POLICY IF EXISTS "Secretaries can view all kettlebell points" ON user_kettlebell_points;
        CREATE POLICY "Secretaries can view all kettlebell points" ON user_kettlebell_points
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.role IN ('admin', 'secretary')
                )
            );

        -- Add secretary permissions for inserting kettlebell points
        DROP POLICY IF EXISTS "Secretaries can insert kettlebell points" ON user_kettlebell_points;
        CREATE POLICY "Secretaries can insert kettlebell points" ON user_kettlebell_points
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.role IN ('admin', 'secretary')
                )
            );

        -- Add secretary permissions for updating kettlebell points
        DROP POLICY IF EXISTS "Secretaries can update kettlebell points" ON user_kettlebell_points;
        CREATE POLICY "Secretaries can update kettlebell points" ON user_kettlebell_points
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.role IN ('admin', 'secretary')
                )
            );

        -- Update existing admin policies for kettlebell points
        DROP POLICY IF EXISTS "Admins can view all kettlebell points" ON user_kettlebell_points;
        CREATE POLICY "Admins and Secretaries can view all kettlebell points" ON user_kettlebell_points
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.role IN ('admin', 'secretary')
                )
            );

        DROP POLICY IF EXISTS "Admins can insert kettlebell points" ON user_kettlebell_points;
        CREATE POLICY "Admins and Secretaries can insert kettlebell points" ON user_kettlebell_points
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.role IN ('admin', 'secretary')
                )
            );

        DROP POLICY IF EXISTS "Admins can update kettlebell points" ON user_kettlebell_points;
        CREATE POLICY "Admins and Secretaries can update kettlebell points" ON user_kettlebell_points
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.role IN ('admin', 'secretary')
                )
            );
    END IF;
END $$;

-- Also need to fix the same issue for old_members_usage table
-- Check if the table exists first
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'old_members_usage') THEN
        -- Add secretary permissions for viewing old members usage
        DROP POLICY IF EXISTS "Secretaries can view all old members usage" ON old_members_usage;
        CREATE POLICY "Secretaries can view all old members usage" ON old_members_usage
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.role IN ('admin', 'secretary')
                )
            );

        -- Add secretary permissions for inserting old members usage
        DROP POLICY IF EXISTS "Secretaries can insert old members usage" ON old_members_usage;
        CREATE POLICY "Secretaries can insert old members usage" ON old_members_usage
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.role IN ('admin', 'secretary')
                )
            );

        -- Update existing admin policies for old members usage
        DROP POLICY IF EXISTS "Admins can view all old members usage" ON old_members_usage;
        CREATE POLICY "Admins and Secretaries can view all old members usage" ON old_members_usage
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.role IN ('admin', 'secretary')
                )
            );

        DROP POLICY IF EXISTS "Admins can insert old members usage" ON old_members_usage;
        CREATE POLICY "Admins and Secretaries can insert old members usage" ON old_members_usage
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.role IN ('admin', 'secretary')
                )
            );
    END IF;
END $$;

-- Verify the policies were created successfully
SELECT 'Cash transactions policies updated for secretaries' as status;
