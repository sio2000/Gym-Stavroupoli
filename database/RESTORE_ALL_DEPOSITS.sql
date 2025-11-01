-- Restore all deposits to what they were 7 hours ago (before tests)
-- 100% Safe - Only modifies deposit_remaining for active deposits

-- Users who need their deposits restored
UPDATE pilates_deposits
SET deposit_remaining = 10, is_active = true
WHERE user_id = '8ffe2c16-1f0a-4ccb-9f0f-678bfaa12c25' AND is_active = true;

UPDATE pilates_deposits
SET deposit_remaining = 3, is_active = true
WHERE user_id = 'cf46b8c0-a5bf-41a8-8a22-ed25196a7896' AND is_active = true;

UPDATE pilates_deposits
SET deposit_remaining = 1, is_active = true
WHERE user_id = 'dcfce45b-8418-4cb3-b81d-762a7575d8d4' AND is_active = true;

UPDATE pilates_deposits
SET deposit_remaining = 1, is_active = true
WHERE user_id = '7971f73e-7d52-4266-b39e-7efc67c9f345' AND is_active = true;

UPDATE pilates_deposits
SET deposit_remaining = 1, is_active = true
WHERE user_id = 'f66b9e8b-137c-4060-9089-515a5e242d66' AND is_active = true;

UPDATE pilates_deposits
SET deposit_remaining = 3, is_active = true
WHERE user_id = 'd1f3fff3-93d0-4c6f-a981-f4a3f2db5af3' AND is_active = true;

UPDATE pilates_deposits
SET deposit_remaining = 1, is_active = true
WHERE user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3' AND is_active = true;

-- Users with high deposits (from test restoration) - need to be fixed
UPDATE pilates_deposits
SET deposit_remaining = 10, is_active = true
WHERE user_id = '605db52c-fdf0-443d-88fb-c9df7dac3d0d' AND is_active = true;

UPDATE pilates_deposits
SET deposit_remaining = 10, is_active = true
WHERE user_id = 'ba262f03-6a57-4c63-9349-704d87bf8581' AND is_active = true;

UPDATE pilates_deposits
SET deposit_remaining = 10, is_active = true
WHERE user_id = '017fea7a-8642-4767-8a6d-1702608d5b51' AND is_active = true;

UPDATE pilates_deposits
SET deposit_remaining = 10, is_active = true
WHERE user_id = '9d6ffcd1-b802-4f8e-a537-629c30f03803' AND is_active = true;

UPDATE pilates_deposits
SET deposit_remaining = 10, is_active = true
WHERE user_id = '69ef4940-435a-417c-90b6-2406984b5f27' AND is_active = true;

UPDATE pilates_deposits
SET deposit_remaining = 10, is_active = true
WHERE user_id = 'c9a9004d-9000-47c3-a921-b3d85799ba10' AND is_active = true;

-- User who had deposit restored
UPDATE pilates_deposits
SET deposit_remaining = 10, is_active = true
WHERE user_id = 'e778f907-8f13-4dc9-acc4-8c93652501e4' AND is_active = true;

-- Verify the results
SELECT 
    pd.user_id,
    pd.deposit_remaining,
    pd.is_active,
    mp.name AS package_name
FROM pilates_deposits pd
LEFT JOIN membership_packages mp ON pd.package_id = mp.id
WHERE pd.is_active = true
ORDER BY pd.deposit_remaining DESC;






