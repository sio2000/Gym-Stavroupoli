-- Reset Cash/POS/Transactions Statistics to Zero
-- This script resets only the financial statistics without affecting any other data

-- WARNING: This will reset all cash and POS transaction records
-- Make sure this is what you want before running

-- Reset cash transactions
DELETE FROM cash_transactions;

-- Reset POS transactions  
DELETE FROM pos_transactions;

-- Reset any payment records (if they exist)
DELETE FROM payments WHERE payment_method IN ('cash', 'pos');

-- Reset cash register entries (if they exist)
DELETE FROM cash_register_entries;

-- Reset any financial logs (if they exist)
DELETE FROM financial_logs;

-- Reset membership payments (if they exist and you want to reset them)
-- DELETE FROM membership_payments;

-- Verify the reset
SELECT 
    'Cash transactions reset' as action,
    COUNT(*) as remaining_records
FROM cash_transactions
UNION ALL
SELECT 
    'POS transactions reset' as action,
    COUNT(*) as remaining_records  
FROM pos_transactions
UNION ALL
SELECT 
    'Payment records reset' as action,
    COUNT(*) as remaining_records
FROM payments
WHERE payment_method IN ('cash', 'pos');

SELECT 'Financial statistics reset successfully!' as result;
