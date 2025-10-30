-- Final check for Ultimate users with Pilates deposits
-- Shows who has too many Pilates lessons

SELECT 
    pd.id AS deposit_id,
    pd.user_id,
    pd.deposit_remaining,
    pd.is_active,
    mp.name AS package_name,
    CASE 
        WHEN mp.name = 'Ultimate' AND pd.deposit_remaining > 3 THEN '⚠️ TOO MANY (should be max 3)'
        WHEN mp.name = 'Ultimate Medium' AND pd.deposit_remaining > 1 THEN '⚠️ TOO MANY (should be max 1)'
        ELSE '✅ OK'
    END AS status_check
FROM pilates_deposits pd
LEFT JOIN membership_packages mp ON pd.package_id = mp.id
WHERE pd.is_active = true
AND mp.name IN ('Ultimate', 'Ultimate Medium')
ORDER BY pd.deposit_remaining DESC;

