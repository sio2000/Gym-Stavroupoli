-- Reset Cash/POS/Transactions Statistics - CORRECT VERSION
-- Reset the actual tables that store the financial data

-- Reset user cash transactions
DELETE FROM user_cash_transactions;

-- Reset user cash summary
DELETE FROM user_cash_summary;

-- Also check for any POS-related tables and reset them
DO $$
BEGIN
    -- Reset user_pos_transactions if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_pos_transactions') THEN
        DELETE FROM user_pos_transactions;
        RAISE NOTICE 'user_pos_transactions table reset';
    ELSE
        RAISE NOTICE 'user_pos_transactions table does not exist - skipping';
    END IF;

    -- Reset user_pos_summary if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_pos_summary') THEN
        DELETE FROM user_pos_summary;
        RAISE NOTICE 'user_pos_summary table reset';
    ELSE
        RAISE NOTICE 'user_pos_summary table does not exist - skipping';
    END IF;

    -- Reset any transaction_logs if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transaction_logs') THEN
        DELETE FROM transaction_logs;
        RAISE NOTICE 'transaction_logs table reset';
    ELSE
        RAISE NOTICE 'transaction_logs table does not exist - skipping';
    END IF;

    -- Reset financial_summary if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'financial_summary') THEN
        DELETE FROM financial_summary;
        RAISE NOTICE 'financial_summary table reset';
    ELSE
        RAISE NOTICE 'financial_summary table does not exist - skipping';
    END IF;
END $$;

-- Verify the reset
SELECT 
    'user_cash_transactions reset' as table_name,
    COUNT(*) as remaining_records
FROM user_cash_transactions
UNION ALL
SELECT 
    'user_cash_summary reset' as table_name,
    COUNT(*) as remaining_records  
FROM user_cash_summary;

-- Final result
SELECT 'Cash/POS/Transactions statistics successfully reset to zero!' as result;
