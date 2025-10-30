-- ═══════════════════════════════════════════════════════════════════════════
-- ΑΠΛΗ ΕΠΑΝΑΦΟΡΑ DEPOSITS ΣΤΙΣ ΣΩΣΤΕΣ ΤΙΜΕΣ
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ΕΠΑΝΑΦΟΡΑ ΒΑΣΕΙ DEPOSIT IDs

-- Χρήστες με πολλά μαθήματα που τώρα έχουν λάθος τιμή
UPDATE pilates_deposits SET deposit_remaining = 25 WHERE id = '6ab9d7a3-8ae0-4274-bf0a-d363e5595e82'; -- κωνσταντινα τζηκα
UPDATE pilates_deposits SET deposit_remaining = 19 WHERE id = 'b2aece43-17a7-49a8-8021-ecedc8e3e4dc'; -- Νενα Παπαδοπουλου
UPDATE pilates_deposits SET deposit_remaining = 13 WHERE id = 'c871ec86-4006-4fae-9a1c-c4f0d263b894'; -- Δημητρα Γκαγκαλουδη
UPDATE pilates_deposits SET deposit_remaining = 19 WHERE id = 'e48a3efc-6c64-4cb8-a719-43f6b3167d0b'; -- Ελευθερία Τσουρεκα
UPDATE pilates_deposits SET deposit_remaining = 16 WHERE id = '60c19379-7ac8-41cc-902f-398d71cb60f9'; -- dora dora

SELECT 'Special cases fixed' as status;

-- Οι υπόλοιποι που έχουν 10 και δεν είναι στις ειδικές περιπτώσεις παραμένουν στο 10
-- Αν κάποιος θέλει να αλλάξει κάτι, γίνεται στο verification query

-- VERIFICATION
SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα",
    mp.name AS "Πακέτο",
    pd.deposit_remaining AS "Μαθήματα Τώρα",
    pd.id AS "Deposit ID"
FROM pilates_deposits pd
LEFT JOIN user_profiles up ON pd.user_id = up.user_id
LEFT JOIN memberships m ON pd.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.is_active = true
ORDER BY pd.deposit_remaining DESC;

COMMIT;

SELECT '✅ DONE!' as "STATUS";

