-- Delete ONLY the Specific Membership Requests Listed Below
-- CAUTION: This deletes ONLY the exact requests specified

-- 1. 34234234234 asas (xiceb32244@kwifa.com) - Ultimate - €500
DELETE FROM membership_requests WHERE id = '2cfa7348-1e29-46eb-806a-553dbf49e82f';

-- 2. caca caca (pehege4818@fanwn.com) - Free Gym - €10
DELETE FROM membership_requests WHERE id = 'c277cb33-e2fa-494a-8a31-5bc64bc37445';

-- 3. samrt samrt (dedane3563@reifide.com) - Free Gym - €10
DELETE FROM membership_requests WHERE id = '0e645f54-8e30-44fa-865f-c40c8aa433a3';

-- Verify deletion
SELECT 'Deleted 3 specific membership requests' as result;
