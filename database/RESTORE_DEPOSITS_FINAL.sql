-- Final restore of deposits for users who had deposits but reached 0
-- Run this to give them back the classes lost from tests

UPDATE pilates_deposits
SET 
    deposit_remaining = 25,
    is_active = true
WHERE id = '6ab9d7a3-8ae0-4274-bf0a-d363e5595e82'; -- κωνσταντινα τζηκα

UPDATE pilates_deposits
SET 
    deposit_remaining = 19,
    is_active = true
WHERE id = 'b2aece43-17a7-49a8-8021-ecedc8e3e4dc'; -- Νενα Παπαδοπουλου

UPDATE pilates_deposits
SET 
    deposit_remaining = 13,
    is_active = true
WHERE id = 'c871ec86-4006-4fae-9a1c-c4f0d263b894'; -- Δημητρα Γκαγκαλουδη

UPDATE pilates_deposits
SET 
    deposit_remaining = 19,
    is_active = true
WHERE id = 'e48a3efc-6c64-4cb8-a719-43f6b3167d0b'; -- Ελευθερία Τσουρεκα

UPDATE pilates_deposits
SET 
    deposit_remaining = 16,
    is_active = true
WHERE id = '60c19379-7ac8-41cc-902f-398d71cb60f9'; -- dora dora

-- Optional: View results
SELECT 
    up.first_name || ' ' || up.last_name AS user_name,
    pd.deposit_remaining,
    pd.is_active
FROM pilates_deposits pd
INNER JOIN user_profiles up ON pd.user_id = up.id
WHERE pd.id IN (
    '6ab9d7a3-8ae0-4274-bf0a-d363e5595e82',
    'b2aece43-17a7-49a8-8021-ecedc8e3e4dc',
    'c871ec86-4006-4fae-9a1c-c4f0d263b894',
    'e48a3efc-6c64-4cb8-a719-43f6b3167d0b',
    '60c19379-7ac8-41cc-902f-398d71cb60f9'
);

