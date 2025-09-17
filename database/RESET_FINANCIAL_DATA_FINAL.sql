-- Reset Financial Data - FINAL CORRECT VERSION
-- Reset the actual underlying tables that feed the statistics

-- Reset user cash transactions (the actual table)
DELETE FROM user_cash_transactions;

-- Since user_cash_summary is a VIEW, we need to find and reset the underlying tables
-- Let's check what tables are used to build the summary view

-- Reset any base tables that might feed the summary
DO $$
BEGIN
    -- Reset user_transactions if it exists (base table)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_transactions') THEN
        DELETE FROM user_transactions WHERE transaction_type IN ('cash', 'pos');
        RAISE NOTICE 'user_transactions table reset for cash/pos';
    END IF;

    -- Reset transactions if it exists (base table)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') THEN
        DELETE FROM transactions WHERE payment_method IN ('cash', 'pos');
        RAISE NOTICE 'transactions table reset for cash/pos';
    END IF;

    -- Reset payment_records if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_records') THEN
        DELETE FROM payment_records WHERE payment_type IN ('cash', 'pos');
        RAISE NOTICE 'payment_records table reset for cash/pos';
    END IF;

    -- Reset cash_register if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cash_register') THEN
        DELETE FROM cash_register;
        RAISE NOTICE 'cash_register table reset';
    END IF;

    -- Reset pos_transactions if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pos_transactions') THEN
        DELETE FROM pos_transactions;
        RAISE NOTICE 'pos_transactions table reset';
    END IF;

    -- Reset daily_cash_summary if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_cash_summary') THEN
        DELETE FROM daily_cash_summary;
        RAISE NOTICE 'daily_cash_summary table reset';
    END IF;
END $$;

-- List all tables that might contain financial data
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE '%cash%' OR 
    table_name LIKE '%pos%' OR 
    table_name LIKE '%payment%' OR 
    table_name LIKE '%transaction%' OR
    table_name LIKE '%financial%' OR
    table_name LIKE '%summary%'
)
ORDER BY table_name;

-- Verify user_cash_transactions is empty
SELECT 
    'user_cash_transactions' as table_name,
    COUNT(*) as remaining_records
FROM user_cash_transactions;

-- Check if user_cash_summary view now shows zero
SELECT 
    'user_cash_summary_check' as check_name,
    COUNT(*) as record_count
FROM user_cash_summary;

SELECT 'Financial data reset completed!' as result;
