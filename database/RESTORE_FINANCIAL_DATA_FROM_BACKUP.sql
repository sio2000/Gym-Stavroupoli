-- RESTORE FINANCIAL DATA FROM BACKUP
-- This script restores the financial data that was accidentally deleted by the reset script
-- It uses the backup tables created before the reset to restore all financial data

-- =============================================
-- 1. VERIFY BACKUP TABLES EXIST
-- =============================================

DO $$
BEGIN
    -- Check if backup tables exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_cash_transactions_backup') THEN
        RAISE EXCEPTION 'Backup table user_cash_transactions_backup does not exist. Cannot restore financial data.';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_kettlebell_points_backup') THEN
        RAISE EXCEPTION 'Backup table user_kettlebell_points_backup does not exist. Cannot restore financial data.';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_old_members_usage_backup') THEN
        RAISE EXCEPTION 'Backup table user_old_members_usage_backup does not exist. Cannot restore financial data.';
    END IF;
    
    RAISE NOTICE 'All backup tables found. Proceeding with restore...';
END $$;

-- =============================================
-- 2. ENSURE FINANCIAL TABLES EXIST WITH CORRECT SCHEMA
-- =============================================

-- Create user_cash_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_cash_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('cash', 'pos')),
    program_id UUID, -- Reference to the program that created this transaction
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(user_id),
    notes TEXT -- Optional notes for the transaction
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_cash_transactions_user_id ON user_cash_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cash_transactions_type ON user_cash_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_user_cash_transactions_created_at ON user_cash_transactions(created_at);

-- Enable RLS
ALTER TABLE user_cash_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_cash_transactions
DROP POLICY IF EXISTS "Admins can view all cash transactions" ON user_cash_transactions;
CREATE POLICY "Admins can view all cash transactions" ON user_cash_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can insert cash transactions" ON user_cash_transactions;
CREATE POLICY "Admins can insert cash transactions" ON user_cash_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update cash transactions" ON user_cash_transactions;
CREATE POLICY "Admins can update cash transactions" ON user_cash_transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can delete cash transactions" ON user_cash_transactions;
CREATE POLICY "Admins can delete cash transactions" ON user_cash_transactions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON user_cash_transactions TO authenticated;

-- =============================================
-- 3. RESTORE DATA FROM BACKUP TABLES
-- =============================================

-- Restore user_cash_transactions from backup
INSERT INTO user_cash_transactions (id, user_id, amount, transaction_type, program_id, created_at, created_by, notes)
SELECT id, user_id, amount, transaction_type, program_id, created_at, created_by, notes
FROM user_cash_transactions_backup
WHERE NOT EXISTS (
    SELECT 1 FROM user_cash_transactions 
    WHERE user_cash_transactions.id = user_cash_transactions_backup.id
);

-- Restore user_kettlebell_points from backup (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_kettlebell_points') THEN
        INSERT INTO user_kettlebell_points (id, user_id, points, created_at, created_by, notes)
        SELECT id, user_id, points, created_at, created_by, notes
        FROM user_kettlebell_points_backup
        WHERE NOT EXISTS (
            SELECT 1 FROM user_kettlebell_points 
            WHERE user_kettlebell_points.id = user_kettlebell_points_backup.id
        );
        RAISE NOTICE 'user_kettlebell_points data restored from backup';
    ELSE
        RAISE NOTICE 'user_kettlebell_points table does not exist - skipping restore';
    END IF;
END $$;

-- Restore user_old_members_usage from backup (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_old_members_usage') THEN
        INSERT INTO user_old_members_usage (id, user_id, usage_count, created_at, created_by, notes)
        SELECT id, user_id, usage_count, created_at, created_by, notes
        FROM user_old_members_usage_backup
        WHERE NOT EXISTS (
            SELECT 1 FROM user_old_members_usage 
            WHERE user_old_members_usage.id = user_old_members_usage_backup.id
        );
        RAISE NOTICE 'user_old_members_usage data restored from backup';
    ELSE
        RAISE NOTICE 'user_old_members_usage table does not exist - skipping restore';
    END IF;
END $$;

-- =============================================
-- 4. RECREATE USER_CASH_SUMMARY VIEW
-- =============================================

-- Create a view for cash summary per user
CREATE OR REPLACE VIEW user_cash_summary AS
SELECT 
    user_id,
    transaction_type,
    SUM(amount) as total_amount,
    COUNT(*) as transaction_count,
    MAX(created_at) as last_transaction_date
FROM user_cash_transactions
GROUP BY user_id, transaction_type;

-- Grant permissions on the view
GRANT SELECT ON user_cash_summary TO authenticated;

-- =============================================
-- 5. VERIFICATION
-- =============================================

-- Verify the restore
SELECT 
    'user_cash_transactions' as table_name,
    COUNT(*) as record_count,
    COALESCE(SUM(amount), 0) as total_amount
FROM user_cash_transactions
UNION ALL
SELECT 
    'user_cash_summary' as table_name,
    COUNT(*) as record_count,
    COALESCE(SUM(total_amount), 0) as total_amount
FROM user_cash_summary;

-- Check if kettlebell points were restored
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_kettlebell_points') THEN
        RAISE NOTICE 'user_kettlebell_points restore verification:';
        PERFORM COUNT(*) FROM user_kettlebell_points;
    END IF;
END $$;

-- Check if old members usage was restored
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_old_members_usage') THEN
        RAISE NOTICE 'user_old_members_usage restore verification:';
        PERFORM COUNT(*) FROM user_old_members_usage;
    END IF;
END $$;

-- =============================================
-- 6. SUCCESS MESSAGE
-- =============================================

SELECT 'Financial data successfully restored from backup!' as result;
