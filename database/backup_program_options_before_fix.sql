-- Backup script for Program Options data before fixing empty field bug
-- This script creates a backup of all relevant data before applying the fix

-- Create backup tables
CREATE TABLE IF NOT EXISTS user_kettlebell_points_backup AS 
SELECT * FROM user_kettlebell_points;

CREATE TABLE IF NOT EXISTS user_cash_transactions_backup AS 
SELECT * FROM user_cash_transactions;

CREATE TABLE IF NOT EXISTS user_old_members_usage_backup AS 
SELECT * FROM user_old_members_usage;

-- Add backup timestamp
ALTER TABLE user_kettlebell_points_backup ADD COLUMN backup_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE user_cash_transactions_backup ADD COLUMN backup_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE user_old_members_usage_backup ADD COLUMN backup_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Verify backup
SELECT 
    'user_kettlebell_points' as table_name,
    COUNT(*) as record_count,
    COALESCE(SUM(points), 0) as total_points
FROM user_kettlebell_points_backup
UNION ALL
SELECT 
    'user_cash_transactions' as table_name,
    COUNT(*) as record_count,
    COALESCE(SUM(amount), 0) as total_amount
FROM user_cash_transactions_backup
UNION ALL
SELECT 
    'user_old_members_usage' as table_name,
    COUNT(*) as record_count,
    0 as total_amount
FROM user_old_members_usage_backup;
