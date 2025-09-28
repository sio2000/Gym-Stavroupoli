-- VERIFY BACKUP DATA EXISTS AND CONTAINS FINANCIAL DATA
-- This script checks if the backup tables exist and what data they contain

-- =============================================
-- 1. CHECK IF BACKUP TABLES EXIST
-- =============================================

SELECT 
    'Backup Table Check' as check_type,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM (
    SELECT 'user_cash_transactions_backup' as table_name
    UNION ALL
    SELECT 'user_kettlebell_points_backup' as table_name
    UNION ALL
    SELECT 'user_old_members_usage_backup' as table_name
) t
LEFT JOIN information_schema.tables it ON it.table_name = t.table_name
WHERE it.table_schema = 'public';

-- =============================================
-- 2. CHECK BACKUP DATA CONTENT
-- =============================================

-- Check user_cash_transactions_backup
DO $$
DECLARE
    cash_count INTEGER;
    cash_total DECIMAL;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_cash_transactions_backup') THEN
        SELECT COUNT(*), COALESCE(SUM(amount), 0) INTO cash_count, cash_total FROM user_cash_transactions_backup;
        RAISE NOTICE 'user_cash_transactions_backup: % records, Total amount: %', cash_count, cash_total;
    ELSE
        RAISE NOTICE 'user_cash_transactions_backup: TABLE NOT FOUND';
    END IF;
END $$;

-- Check user_kettlebell_points_backup
DO $$
DECLARE
    kettlebell_count INTEGER;
    kettlebell_total DECIMAL;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_kettlebell_points_backup') THEN
        SELECT COUNT(*), COALESCE(SUM(points), 0) INTO kettlebell_count, kettlebell_total FROM user_kettlebell_points_backup;
        RAISE NOTICE 'user_kettlebell_points_backup: % records, Total points: %', kettlebell_count, kettlebell_total;
    ELSE
        RAISE NOTICE 'user_kettlebell_points_backup: TABLE NOT FOUND';
    END IF;
END $$;

-- Check user_old_members_usage_backup
DO $$
DECLARE
    usage_count INTEGER;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_old_members_usage_backup') THEN
        SELECT COUNT(*) INTO usage_count FROM user_old_members_usage_backup;
        RAISE NOTICE 'user_old_members_usage_backup: % records', usage_count;
    ELSE
        RAISE NOTICE 'user_old_members_usage_backup: TABLE NOT FOUND';
    END IF;
END $$;

-- =============================================
-- 3. CHECK CURRENT FINANCIAL TABLES STATE
-- =============================================

-- Check current user_cash_transactions
SELECT 
    'Current user_cash_transactions' as table_name,
    COUNT(*) as record_count,
    COALESCE(SUM(amount), 0) as total_amount
FROM user_cash_transactions;

-- Check if user_cash_summary view exists and works
DO $$
DECLARE
    summary_count INTEGER;
    summary_total DECIMAL;
BEGIN
    IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'user_cash_summary') THEN
        SELECT COUNT(*), COALESCE(SUM(total_amount), 0) INTO summary_count, summary_total FROM user_cash_summary;
        RAISE NOTICE 'user_cash_summary view: % records, Total amount: %', summary_count, summary_total;
    ELSE
        RAISE NOTICE 'user_cash_summary view: NOT FOUND';
    END IF;
END $$;

-- =============================================
-- 4. SAMPLE DATA FROM BACKUP (if exists)
-- =============================================

-- Show sample cash transactions from backup
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_cash_transactions_backup') THEN
        RAISE NOTICE 'Sample cash transactions from backup:';
        FOR rec IN 
            SELECT user_id, amount, transaction_type, created_at 
            FROM user_cash_transactions_backup 
            ORDER BY created_at DESC 
            LIMIT 5
        LOOP
            RAISE NOTICE 'User: %, Amount: %, Type: %, Date: %', 
                rec.user_id, rec.amount, rec.transaction_type, rec.created_at;
        END LOOP;
    END IF;
END $$;

-- =============================================
-- 5. FINAL ASSESSMENT
-- =============================================

SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_cash_transactions_backup') 
             AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_kettlebell_points_backup')
             AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_old_members_usage_backup')
        THEN 'ALL BACKUP TABLES FOUND - RESTORE POSSIBLE'
        ELSE 'SOME BACKUP TABLES MISSING - RESTORE MAY NOT BE COMPLETE'
    END as restore_assessment;
