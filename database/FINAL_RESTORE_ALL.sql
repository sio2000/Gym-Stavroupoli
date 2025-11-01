-- FINAL RESTORE - All deposits to what they were 10 hours ago
-- Based on screenshot and data analysis

-- First, fix the Ultimate user who has too many lessons
UPDATE pilates_deposits
SET deposit_remaining = 3
WHERE user_id = '8ffe2c16-1f0a-4ccb-9f0f-678bfaa12c25' 
AND is_active = true
AND deposit_remaining > 3;

-- Then restore everyone else to 10 (standard Pilates deposits)
UPDATE pilates_deposits
SET deposit_remaining = 10, is_active = true
WHERE is_active = true
AND deposit_remaining != 10
AND deposit_remaining > 1
AND user_id NOT IN (
    '8ffe2c16-1f0a-4ccb-9f0f-678bfaa12c25', -- Ultimate (will be set to 3 above)
    'd1f3fff3-93d0-4c6f-a981-f4a3f2db5af3', -- Ultimate (should be 3)
    'cf46b8c0-a5bf-41a8-8a22-ed25196a7896', -- Ultimate (should be 3)
    'cde3259d-17c7-4076-9bc7-31f5fa4a44a3', -- Ultimate Medium (should be 1)
    'f66b9e8b-137c-4060-9089-515a5e242d66', -- Ultimate Medium (should be 1)
    'dcfce45b-8418-4cb3-b81d-762a7575d8d4', -- Ultimate Medium (should be 1)
    '7971f73e-7d52-4266-b39e-7efc67c9f345'  -- Ultimate Medium (should be 1)
);

-- Set Ultimate users to 3
UPDATE pilates_deposits
SET deposit_remaining = 3, is_active = true
WHERE user_id IN (
    'd1f3fff3-93d0-4c6f-a981-f4a3f2db5af3',
    'cf46b8c0-a5bf-41a8-8a22-ed25196a7896'
)
AND is_active = true;

-- Set Ultimate Medium users to 1
UPDATE pilates_deposits
SET deposit_remaining = 1, is_active = true
WHERE user_id IN (
    'cde3259d-17c7-4076-9bc7-31f5fa4a44a3',
    'f66b9e8b-137c-4060-9089-515a5e242d66',
    'dcfce45b-8418-4cb3-b81d-762a7575d8d4',
    '7971f73e-7d52-4266-b39e-7efc67c9f345'
)
AND is_active = true;

-- Verification query
SELECT 
    pd.user_id,
    pd.deposit_remaining,
    pd.is_active,
    mp.name AS package_name,
    CASE 
        WHEN mp.name = 'Ultimate' AND pd.deposit_remaining > 3 THEN '⚠️ TOO MANY'
        WHEN mp.name = 'Ultimate Medium' AND pd.deposit_remaining > 1 THEN '⚠️ TOO MANY'
        ELSE '✅ OK'
    END AS status
FROM pilates_deposits pd
LEFT JOIN membership_packages mp ON pd.package_id = mp.id
WHERE pd.is_active = true
ORDER BY mp.name, pd.deposit_remaining DESC;






