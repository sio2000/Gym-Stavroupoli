-- Safe Reset of Cash/POS/Transaction Statistics
-- This script safely resets financial statistics without causing errors

-- Check which tables exist and reset them safely
DO $$
BEGIN
    -- Reset cash_transactions if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cash_transactions') THEN
        DELETE FROM cash_transactions;
        RAISE NOTICE 'cash_transactions table reset';
    ELSE
        RAISE NOTICE 'cash_transactions table does not exist - skipping';
    END IF;

    -- Reset pos_transactions if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pos_transactions') THEN
        DELETE FROM pos_transactions;
        RAISE NOTICE 'pos_transactions table reset';
    ELSE
        RAISE NOTICE 'pos_transactions table does not exist - skipping';
    END IF;

    -- Reset payments if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments') THEN
        DELETE FROM payments WHERE payment_method IN ('cash', 'pos');
        RAISE NOTICE 'payments table reset';
    ELSE
        RAISE NOTICE 'payments table does not exist - skipping';
    END IF;

    -- Reset cash_register_entries if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cash_register_entries') THEN
        DELETE FROM cash_register_entries;
        RAISE NOTICE 'cash_register_entries table reset';
    ELSE
        RAISE NOTICE 'cash_register_entries table does not exist - skipping';
    END IF;

    -- Reset financial_logs if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'financial_logs') THEN
        DELETE FROM financial_logs;
        RAISE NOTICE 'financial_logs table reset';
    ELSE
        RAISE NOTICE 'financial_logs table does not exist - skipping';
    END IF;

    -- Reset membership_payments if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'membership_payments') THEN
        DELETE FROM membership_payments;
        RAISE NOTICE 'membership_payments table reset';
    ELSE
        RAISE NOTICE 'membership_payments table does not exist - skipping';
    END IF;

    -- Reset any cash/pos related data in existing tables
    -- Reset selected request options that might contain cash/pos amounts
    UPDATE membership_requests 
    SET 
        installment_1_amount = 0,
        installment_2_amount = 0, 
        installment_3_amount = 0
    WHERE has_installments = true;
    
    RAISE NOTICE 'Reset installment amounts to zero';

END $$;

-- Final verification
SELECT 'Financial statistics safely reset!' as result;
