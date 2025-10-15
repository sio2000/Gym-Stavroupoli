-- Add RLS policies for user_cash_transactions to allow users to view their own transactions
-- This is needed for the installment plan functionality
-- 100% SAFE - Only adds policies, does not modify existing data

-- Check if policy already exists before creating
DO $$
BEGIN
    -- Only create the policy if it doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_cash_transactions' 
        AND policyname = 'Users can view their own cash transactions'
    ) THEN
        -- Add policy for users to view their own cash transactions
        CREATE POLICY "Users can view their own cash transactions" ON user_cash_transactions
            FOR SELECT USING (
                user_id = auth.uid()
            );
        
        RAISE NOTICE 'Policy "Users can view their own cash transactions" created successfully';
    ELSE
        RAISE NOTICE 'Policy "Users can view their own cash transactions" already exists, skipping creation';
    END IF;
END $$;

-- Grant SELECT permission to authenticated users (safe operation)
GRANT SELECT ON user_cash_transactions TO authenticated;

-- Verify the policies exist (read-only operation)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_cash_transactions'
ORDER BY policyname;
