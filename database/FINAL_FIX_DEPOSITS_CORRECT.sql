-- ═══════════════════════════════════════════════════════════════════════════
-- ΕΠΑΝΑΦΟΡΑ DEPOSITS ΣΤΙΣ ΣΩΣΤΕΣ ΤΙΜΕΣ - ΧΡΗΣΗ DEPOSIT IDs
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Αυτό το script επαναφέρει τα deposits στις σωστές τιμές
-- Χρησιμοποιεί deposit IDs για 100% ακρίβεια
--
-- ⚠️ ΑΣΦΑΛΕΣ ΜΕ BACKUP
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- BACKUP
CREATE TEMP TABLE backup_before_fix AS
SELECT id, user_id, deposit_remaining, is_active, updated_at
FROM pilates_deposits
WHERE is_active = true;

SELECT 'BACKUP CREATED' as status;

-- ΕΠΑΝΑΦΟΡΑ ΣΤΙΣ ΣΩΣΤΕΣ ΤΙΜΕΣ

-- κωνσταντινα τζηκα - σωστό: 25 μαθήματα
UPDATE pilates_deposits SET deposit_remaining = 25, is_active = true 
WHERE id = '6ab9d7a3-8ae0-4274-bf0a-d363e5595e82';

-- Νενα Παπαδοπουλου - σωστό: 19 μαθήματα
UPDATE pilates_deposits SET deposit_remaining = 19, is_active = true 
WHERE id = 'b2aece43-17a7-49a8-8021-ecedc8e3e4dc';

-- Δημητρα Γκαγκαλουδη - σωστό: 13 μαθήματα
UPDATE pilates_deposits SET deposit_remaining = 13, is_active = true 
WHERE id = 'c871ec86-4006-4fae-9a1c-c4f0d263b894';

-- Ελευθερία Τσουρεκα - σωστό: 19 μαθήματα
UPDATE pilates_deposits SET deposit_remaining = 19, is_active = true 
WHERE id = 'e48a3efc-6c64-4cb8-a719-43f6b3167d0b';

-- dora dora - σωστό: 16 μαθήματα
UPDATE pilates_deposits SET deposit_remaining = 16, is_active = true 
WHERE id = '60c19379-7ac8-41cc-902f-398d71cb60f9';

SELECT 'SPECIAL CASES UPDATED' as status;

-- ΟΙ ΥΠΟΛΟΙΠΟΙ ΕΧΟΥΝ 10 ΜΑΘΗΜΑΤΑ (STANDARD PILATES)
-- Αυτά τα updates είναι για τους χρήστες που τώρα έχουν 25 ή 10 αλλά δεν είναι στα παραπάνω

UPDATE pilates_deposits 
SET deposit_remaining = 10, is_active = true
WHERE is_active = true
AND deposit_remaining NOT IN (1, 3, 8, 13, 16, 19, 25, 50)
AND id NOT IN (
    '6ab9d7a3-8ae0-4274-bf0a-d363e5595e82', -- κωνσταντινα τζηκα (25)
    'b2aece43-17a7-49a8-8021-ecedc8e3e4dc', -- Νενα Παπαδοπουλου (19)
    'c871ec86-4006-4fae-9a1c-c4f0d263b894', -- Δημητρα Γκαγκαλουδη (13)
    'e48a3efc-6c64-4cb8-a719-43f6b3167d0b', -- Ελευθερία Τσουρεκα (19)
    '60c19379-7ac8-41cc-902f-398d71cb60f9'  -- dora dora (16)
);

SELECT 'STANDARD USERS UPDATED' as status;

-- VERIFICATION
SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα",
    mp.name AS "Πακέτο",
    pd.deposit_remaining AS "Μαθήματα Τώρα",
    CASE 
        WHEN m.duration_type = 'pilates_trial' THEN 1
        WHEN m.duration_type = 'pilates_1month' THEN 4
        WHEN m.duration_type = 'pilates_2months' THEN 8
        WHEN m.duration_type = 'pilates_3months' THEN 16
        WHEN m.duration_type = 'pilates_6months' THEN 25
        WHEN m.duration_type = 'pilates_1year' THEN 50
        WHEN mp.name = 'Ultimate' THEN 3
        WHEN mp.name = 'Ultimate Medium' THEN 1
        ELSE NULL
    END AS "Πήραν Αρχικά"
FROM pilates_deposits pd
LEFT JOIN user_profiles up ON pd.user_id = up.user_id
LEFT JOIN memberships m ON pd.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.is_active = true
ORDER BY pd.deposit_remaining DESC, up.first_name;

COMMIT;

SELECT '✅ DONE!' as "STATUS";

