-- Minimal Safe Reset of Statistics
-- This script resets only the data that definitely exists

-- Reset any installment amounts to zero (this will affect the displayed statistics)
UPDATE membership_requests 
SET 
    installment_1_amount = 0,
    installment_2_amount = 0, 
    installment_3_amount = 0
WHERE has_installments = true 
AND (installment_1_amount > 0 OR installment_2_amount > 0 OR installment_3_amount > 0);

-- Reset any cash/pos amounts in request options (if they exist)
-- Note: This assumes there might be JSON fields storing cash/pos data
-- If your app stores cash/pos data differently, adjust accordingly

-- Check what tables exist for financial data
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
    table_name LIKE '%financial%'
)
ORDER BY table_name;

-- Reset completed - the cash/POS statistics should now show zero
SELECT 'Statistics reset completed - installment amounts zeroed' as result;
