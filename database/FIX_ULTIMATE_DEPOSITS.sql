-- Fix Ultimate and Ultimate Medium Pilates deposits
-- Sets correct amounts: Ultimate = 3, Ultimate Medium = 1
-- 100% Safe - Only modifies the deposit_remaining field

-- Step 1: Update Ultimate users to max 3 lessons
UPDATE pilates_deposits pd
SET deposit_remaining = 3
FROM membership_packages mp
WHERE pd.package_id = mp.id
AND mp.name = 'Ultimate'
AND pd.is_active = true
AND pd.deposit_remaining > 3;

-- Step 2: Update Ultimate Medium users to max 1 lesson
UPDATE pilates_deposits pd
SET deposit_remaining = 1
FROM membership_packages mp
WHERE pd.package_id = mp.id
AND mp.name = 'Ultimate Medium'
AND pd.is_active = true
AND pd.deposit_remaining > 1;

-- Step 3: Verify the changes
SELECT 
    pd.id AS deposit_id,
    pd.user_id,
    pd.deposit_remaining,
    pd.is_active,
    mp.name AS package_name,
    CASE 
        WHEN mp.name = 'Ultimate' AND pd.deposit_remaining > 3 THEN '⚠️ STILL TOO MANY'
        WHEN mp.name = 'Ultimate Medium' AND pd.deposit_remaining > 1 THEN '⚠️ STILL TOO MANY'
        ELSE '✅ CORRECT'
    END AS status_check
FROM pilates_deposits pd
LEFT JOIN membership_packages mp ON pd.package_id = mp.id
WHERE pd.is_active = true
AND mp.name IN ('Ultimate', 'Ultimate Medium')
ORDER BY mp.name, pd.deposit_remaining DESC;

