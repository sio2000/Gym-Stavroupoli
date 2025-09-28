-- Rollback script for Program Options fix
-- This script restores the original data if the fix needs to be reverted

-- Restore from backup tables (only if they exist)
DO $$
BEGIN
    -- Check if backup tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_kettlebell_points_backup') THEN
        -- Clear current data
        DELETE FROM user_kettlebell_points;
        
        -- Restore from backup
        INSERT INTO user_kettlebell_points (id, user_id, points, program_id, created_at, created_by)
        SELECT id, user_id, points, program_id, created_at, created_by 
        FROM user_kettlebell_points_backup;
        
        RAISE NOTICE 'Restored % records from user_kettlebell_points_backup', 
            (SELECT COUNT(*) FROM user_kettlebell_points);
    ELSE
        RAISE NOTICE 'Backup table user_kettlebell_points_backup not found';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_cash_transactions_backup') THEN
        -- Clear current data
        DELETE FROM user_cash_transactions;
        
        -- Restore from backup
        INSERT INTO user_cash_transactions (id, user_id, amount, transaction_type, program_id, created_at, created_by, notes)
        SELECT id, user_id, amount, transaction_type, program_id, created_at, created_by, notes 
        FROM user_cash_transactions_backup;
        
        RAISE NOTICE 'Restored % records from user_cash_transactions_backup', 
            (SELECT COUNT(*) FROM user_cash_transactions);
    ELSE
        RAISE NOTICE 'Backup table user_cash_transactions_backup not found';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_old_members_usage_backup') THEN
        -- Clear current data
        DELETE FROM user_old_members_usage;
        
        -- Restore from backup
        INSERT INTO user_old_members_usage (id, user_id, used_at, created_by)
        SELECT id, user_id, used_at, created_by 
        FROM user_old_members_usage_backup;
        
        RAISE NOTICE 'Restored % records from user_old_members_usage_backup', 
            (SELECT COUNT(*) FROM user_old_members_usage);
    ELSE
        RAISE NOTICE 'Backup table user_old_members_usage_backup not found';
    END IF;
END $$;

-- Verify restoration
SELECT 
    'user_kettlebell_points' as table_name,
    COUNT(*) as record_count,
    COALESCE(SUM(points), 0) as total_points
FROM user_kettlebell_points
UNION ALL
SELECT 
    'user_cash_transactions' as table_name,
    COUNT(*) as record_count,
    COALESCE(SUM(amount), 0) as total_amount
FROM user_cash_transactions
UNION ALL
SELECT 
    'user_old_members_usage' as table_name,
    COUNT(*) as record_count,
    0 as total_amount
FROM user_old_members_usage;
