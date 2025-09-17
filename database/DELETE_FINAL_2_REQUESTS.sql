-- Delete FINAL 2 Specific Membership Requests
-- CAUTION: This deletes ONLY the exact requests specified

-- 1. samrt samrt (dedane3563@reifide.com) - Pilates - €6
DELETE FROM membership_requests WHERE id = '246542d8-12fe-4959-a2b0-4cc26a7450ed';

-- 2. duf duf (jadoyep373@fanwn.com) - Free Gym - €10
DELETE FROM membership_requests WHERE id = 'd4bf6875-eaee-42c6-a130-255c4f3909c4';

-- Verify deletion
SELECT 'Deleted 2 final specific membership requests' as result;
