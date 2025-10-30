-- Restore deposits to what they were 7 hours ago (before tests)
-- This is a SAFE query that shows what needs to be restored

-- First, let's see what deposits existed 7 hours ago
SELECT 
    pd.id AS deposit_id,
    pd.user_id,
    pd.deposit_remaining AS current_amount,
    pd.is_active,
    pd.created_at,
    pd.credited_at,
    mp.name AS package_name
FROM pilates_deposits pd
LEFT JOIN membership_packages mp ON pd.package_id = mp.id
WHERE pd.created_at < NOW() - INTERVAL '7 hours'
AND pd.is_active = true
ORDER BY pd.deposit_remaining DESC;

-- This query will show all active deposits that existed before the tests
-- You can use this to manually restore the correct amounts




