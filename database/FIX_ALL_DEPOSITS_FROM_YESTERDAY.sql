-- ═══════════════════════════════════════════════════════════════════════════
-- ΕΠΑΝΑΦΟΡΑ ΟΛΩΝ ΤΩΝ DEPOSITS ΣΤΙΣ ΣΩΣΤΕΣ ΤΙΜΕΣ ΑΠΟ ΧΘΕΣ
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Επαναφέρει όλους τους χρήστες με Pilates deposits στις σωστές τιμές
-- που είχαν πριν τα τεστ
--
-- ⚠️ ΑΣΦΑΛΕΣ ΜΕ BACKUP
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- BACKUP
CREATE TEMP TABLE backup_before_fix AS
SELECT id, user_id, deposit_remaining, is_active, updated_at
FROM pilates_deposits
WHERE is_active = true;

SELECT 'Backup created for ' || COUNT(*) || ' deposits' as status 
FROM backup_before_fix;

-- ΕΠΑΝΑΦΟΡΑ ΣΕ ΟΛΟΥΣ ΤΟΥΣ ΧΡΗΣΤΕΣ ΒΑΣΕΙ ΤΟΥ duration_type ΤΟΥΣ

UPDATE pilates_deposits pd
SET deposit_remaining = (
    SELECT CASE 
        WHEN m.duration_type = 'pilates_trial' THEN 1
        WHEN m.duration_type = 'pilates_1month' THEN 4
        WHEN m.duration_type = 'pilates_2months' THEN 8
        WHEN m.duration_type = 'pilates_3months' THEN 16
        WHEN m.duration_type = 'pilates_6months' THEN 25
        WHEN m.duration_type = 'pilates_1year' THEN 50
        WHEN EXISTS (
            SELECT 1 FROM memberships m2 
            JOIN membership_packages mp2 ON m2.package_id = mp2.id 
            WHERE m2.user_id = pd.user_id 
            AND m2.is_active = true 
            AND mp2.name = 'Ultimate'
        ) THEN 3
        WHEN EXISTS (
            SELECT 1 FROM memberships m2 
            JOIN membership_packages mp2 ON m2.package_id = mp2.id 
            WHERE m2.user_id = pd.user_id 
            AND m2.is_active = true 
            AND mp2.name = 'Ultimate Medium'
        ) THEN 1
        ELSE pd.deposit_remaining
    END
    FROM memberships m
    WHERE m.user_id = pd.user_id AND m.is_active = true
    LIMIT 1
),
updated_at = NOW()
WHERE pd.is_active = true
AND EXISTS (
    SELECT 1 FROM memberships m 
    WHERE m.user_id = pd.user_id 
    AND m.is_active = true
);

SELECT 'Updated deposits based on duration_type' as status;

-- ΕΙΔΙΚΕΣ ΠΕΡΙΠΤΩΣΕΙΣ - ΧΡΗΣΤΕΣ ΜΕ ΠΟΛΛΑ ΜΑΘΗΜΑΤΑ

-- κωνσταντινα τζηκα - είχε 25
UPDATE pilates_deposits SET deposit_remaining = 25 
WHERE id = '6ab9d7a3-8ae0-4274-bf0a-d363e5595e82';

-- Νενα Παπαδοπουλου - είχε 19
UPDATE pilates_deposits SET deposit_remaining = 19 
WHERE id = 'b2aece43-17a7-49a8-8021-ecedc8e3e4dc';

-- Δημητρα Γκαγκαλουδη - είχε 13
UPDATE pilates_deposits SET deposit_remaining = 13 
WHERE id = 'c871ec86-4006-4fae-9a1c-c4f0d263b894';

-- Ελευθερία Τσουρεκα - είχε 19
UPDATE pilates_deposits SET deposit_remaining = 19 
WHERE id = 'e48a3efc-6c64-4cb8-a719-43f6b3167d0b';

-- dora dora - είχε 16
UPDATE pilates_deposits SET deposit_remaining = 16 
WHERE id = '60c19379-7ac8-41cc-902f-398d71cb60f9';

SELECT 'Special cases updated' as status;

-- VERIFICATION
SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα",
    mp.name AS "Πακέτο",
    pd.deposit_remaining AS "Τώρα",
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
    END AS "Πήραν",
    CASE 
        WHEN pd.deposit_remaining = CASE 
            WHEN m.duration_type = 'pilates_trial' THEN 1
            WHEN m.duration_type = 'pilates_1month' THEN 4
            WHEN m.duration_type = 'pilates_2months' THEN 8
            WHEN m.duration_type = 'pilates_3months' THEN 16
            WHEN m.duration_type = 'pilates_6months' THEN 25
            WHEN m.duration_type = 'pilates_1year' THEN 50
            WHEN mp.name = 'Ultimate' THEN 3
            WHEN mp.name = 'Ultimate Medium' THEN 1
            ELSE NULL
        END THEN '✅ ΣΩΣΤΟ'
        ELSE '⚠️ ΛΑΘΟΣ'
    END AS "Κατάσταση"
FROM pilates_deposits pd
LEFT JOIN user_profiles up ON pd.user_id = up.user_id
LEFT JOIN memberships m ON pd.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.is_active = true
ORDER BY pd.deposit_remaining DESC;

COMMIT;

SELECT '✅ ΟΛΟΚΛΗΡΩΘΗΚΕ!' as "STATUS";

