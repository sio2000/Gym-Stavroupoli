-- Check Ultimate and Ultimate Medium users with Pilates deposits
-- This query will show if they have correct amounts

SELECT 
    pd.id AS deposit_id,
    pd.user_id,
    pd.package_id,
    pd.deposit_remaining,
    pd.is_active,
    pd.credited_at,
    pd.expires_at,
    mp.name AS package_name
FROM pilates_deposits pd
LEFT JOIN membership_packages mp ON pd.package_id = mp.id
WHERE pd.is_active = true
AND mp.name IN ('Ultimate', 'Ultimate Medium')
ORDER BY pd.deposit_remaining DESC;

