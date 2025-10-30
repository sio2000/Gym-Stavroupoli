-- Restore ALL deposits to exactly what they were 10 hours ago
-- This restores each user to their exact deposit amount before tests

-- Pilates users (had 10)
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = 'c9a9004d-9000-47c3-a921-b3d85799ba10' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = '69ef4940-435a-417c-90b6-2406984b5f27' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = '605db52c-fdf0-443d-88fb-c9df7dac3d0d' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = 'ba262f03-6a57-4c63-9349-704d87bf8581' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = '9d6ffcd1-b802-4f8e-a537-629c30f03803' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = '017fea7a-8642-4767-8a6d-1702608d5b51' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = '48173b1f-74ce-41a7-9184-388ae84d6629' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = 'c56b9c3c-01a9-4eaf-b5c9-f0092928aa1b' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = '5bf6ed0a-440f-46b6-9131-6d03fe823ed5' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = '67783812-c084-46aa-bdce-a2854f5f836f' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = 'e5563484-3e07-4ffa-91a1-d0404bfe4b3f' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = '6f1588ba-7feb-4966-8ae8-ca4ae5deacdb' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = 'c5c87b3e-6b44-432c-a690-1e045540b8d6' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = '4f51d3ee-389f-40f0-9114-4c0394927bce' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = '2b52db38-31b1-4387-9d7a-f7b88f18564b' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = 'e778f907-8f13-4dc9-acc4-8c93652501e4' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = '9adf938d-6b00-4264-b8f8-11b7d140b6f7' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = 'c219e601-fd60-4468-8ea0-307c7cff35af' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = '632fe923-f28d-4d48-9ec2-877ead295676' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = '905ff8ee-18f5-455e-9ef2-57f10b0d74ca' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = 'bcb09526-5d12-49cb-ad54-cdcb340150d4' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = 'b1bdc879-9b9f-4fed-88e9-15ccee1ea83d' AND is_active = true;

-- Ultimate user (had 10 - this is the one you saw in screenshot!)
UPDATE pilates_deposits SET deposit_remaining = 10, is_active = true WHERE user_id = '8ffe2c16-1f0a-4ccb-9f0f-678bfaa12c25' AND is_active = true;

-- Ultimate users (had 3)
UPDATE pilates_deposits SET deposit_remaining = 3, is_active = true WHERE user_id = 'd1f3fff3-93d0-4c6f-a981-f4a3f2db5af3' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 3, is_active = true WHERE user_id = 'cf46b8c0-a5bf-41a8-8a22-ed25196a7896' AND is_active = true;

-- Ultimate Medium users (had 1)
UPDATE pilates_deposits SET deposit_remaining = 1, is_active = true WHERE user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 1, is_active = true WHERE user_id = 'f66b9e8b-137c-4060-9089-515a5e242d66' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 1, is_active = true WHERE user_id = 'dcfce45b-8418-4cb3-b81d-762a7575d8d4' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 1, is_active = true WHERE user_id = '7971f73e-7d52-4266-b39e-7efc67c9f345' AND is_active = true;

-- Special case (had 8)
UPDATE pilates_deposits SET deposit_remaining = 8, is_active = true WHERE user_id = '946ea106-3e87-48b6-82b2-81e4abbeab6d' AND is_active = true;

-- Users who had 0 (deposits expired)
UPDATE pilates_deposits SET deposit_remaining = 0, is_active = false WHERE user_id = 'c22ebf5e-db77-4f23-84a8-1ac45be2ee44' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 0, is_active = false WHERE user_id = '5654ce0a-ae8b-4425-99a2-b1bf93f7cf54' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 0, is_active = false WHERE user_id = '2d6a44cd-2eeb-430d-9e3b-f82a828288f7' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 0, is_active = false WHERE user_id = '4e234264-bec3-42af-947c-ebfceccd7c0f' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 0, is_active = false WHERE user_id = 'ff96e258-5782-4d7a-890f-e276e2e3b7de' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 0, is_active = false WHERE user_id = '5939b88d-65b1-4951-950f-7591895c1df7' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 0, is_active = false WHERE user_id = '4bc3c7f7-e7d6-4f9c-9ff0-c9f30dca2724' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 0, is_active = false WHERE user_id = 'ba49ecaa-b20e-4880-ad45-2a440a749301' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 0, is_active = false WHERE user_id = '0a4311ab-7aba-4c37-a4e4-d0b27d999d32' AND is_active = true;
UPDATE pilates_deposits SET deposit_remaining = 0, is_active = false WHERE user_id = '96a4eefe-8ecc-4e67-9d75-862d61d3887a' AND is_active = true;

-- Verification query
SELECT 
    pd.user_id,
    pd.deposit_remaining,
    pd.is_active,
    mp.name AS package_name
FROM pilates_deposits pd
LEFT JOIN membership_packages mp ON pd.package_id = mp.id
WHERE pd.is_active = true
ORDER BY mp.name, pd.deposit_remaining DESC;




