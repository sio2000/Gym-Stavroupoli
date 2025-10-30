-- ═══════════════════════════════════════════════════════════════════════════
-- ΕΠΑΝΑΦΟΡΑ DEPOSITS ΣΤΙΣ ΣΩΣΤΕΣ ΤΙΜΕΣ ΑΠΟ ΤΑ ΣΩΣΤΑ ΔΕΔΟΜΕΝΑ
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Αυτό το script επαναφέρει τα deposits στις σωστές τιμές που είχαν πριν
--
-- ⚠️ ΑΣΦΑΛΕΣ ΜΕ BACKUP - ΜΟΝΟ UPDATE deposits
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- PHASE 1: BACKUP
CREATE TEMP TABLE backup_deposits AS
SELECT id, user_id, deposit_remaining, is_active
FROM pilates_deposits
WHERE is_active = true;

SELECT 'BACKUP CREATED' as status;

-- PHASE 2: ΕΠΑΝΑΦΟΡΑ DEPOSITS

-- dora dora - είχε 16, έχει 25 τώρα (λάθος!)
UPDATE pilates_deposits pd
SET deposit_remaining = 16, updated_at = NOW()
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.user_id = up.user_id 
AND up.first_name = 'dora' AND up.last_name = 'dora'
AND mp.name = 'Pilates'
AND pd.is_active = true;

-- Φιλιππος Πασχαλουδης - είχε 25, έχει 10 τώρα
UPDATE pilates_deposits pd
SET deposit_remaining = 25, updated_at = NOW()
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.user_id = up.user_id 
AND up.first_name = 'Φιλιππος' AND up.last_name = 'Πασχαλουδης'
AND mp.name = 'Pilates'
AND pd.is_active = true;

-- κωνσταντινα τζηκα - είχε 25, έχει 10 τώρα
UPDATE pilates_deposits pd
SET deposit_remaining = 25, updated_at = NOW()
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.user_id = up.user_id 
AND up.first_name = 'κωνσταντινα' AND up.last_name = 'τζηκα'
AND mp.name = 'Pilates'
AND pd.is_active = true;

-- Ντενια Ιγνατιδου - είχε 25, έχει 10 τώρα
UPDATE pilates_deposits pd
SET deposit_remaining = 25, updated_at = NOW()
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.user_id = up.user_id 
AND up.first_name = 'Ντενια' AND up.last_name = 'Ιγνατιδου'
AND mp.name = 'Pilates'
AND pd.is_active = true;

-- Δημητρα Γκαγκαλουδη - είχε 25, έχει 10 τώρα
UPDATE pilates_deposits pd
SET deposit_remaining = 25, updated_at = NOW()
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.user_id = up.user_id 
AND up.first_name = 'Δημητρα' AND up.last_name = 'Γκαγκαλουδη'
AND mp.name = 'Pilates'
AND pd.is_active = true;

-- Νενα Παπαδοπουλου - είχε 25, έχει 10 τώρα
UPDATE pilates_deposits pd
SET deposit_remaining = 25, updated_at = NOW()
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.user_id = up.user_id 
AND up.first_name = 'Νενα' AND up.last_name = 'Παπαδοπουλου'
AND mp.name = 'Pilates'
AND pd.is_active = true;

-- ΦΩΤΗΣ ΦΩΤΙΑΔΗΣ - είχε 25, έχει 10 τώρα
UPDATE pilates_deposits pd
SET deposit_remaining = 25, updated_at = NOW()
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.user_id = up.user_id 
AND up.first_name = 'ΦΩΤΗΣ' AND up.last_name = 'ΦΩΤΙΑΔΗΣ'
AND mp.name = 'Pilates'
AND pd.is_active = true;

-- Ελεονωρα Τιτοπουλου - είχε 50, έχει 10 τώρα
UPDATE pilates_deposits pd
SET deposit_remaining = 50, updated_at = NOW()
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.user_id = up.user_id 
AND up.first_name = 'Ελεονωρα' AND up.last_name = 'Τιτοπουλου'
AND mp.name = 'Pilates'
AND pd.is_active = true;

-- Μαρια Νταβιτιδη - είχε 50, έχει 10 τώρα
UPDATE pilates_deposits pd
SET deposit_remaining = 50, updated_at = NOW()
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.user_id = up.user_id 
AND up.first_name = 'Μαρια' AND up.last_name = 'Νταβιτιδη'
AND mp.name = 'Pilates'
AND pd.is_active = true;

-- ladis ladis - είχε 8, έχει 10 τώρα
UPDATE pilates_deposits pd
SET deposit_remaining = 8, updated_at = NOW()
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.user_id = up.user_id 
AND up.first_name = 'ladis' AND up.last_name = 'ladis'
AND mp.name = 'Pilates'
AND pd.is_active = true;

-- Ελευθερία Τσουρεκα - είχε 25, έχει 10 τώρα
UPDATE pilates_deposits pd
SET deposit_remaining = 25, updated_at = NOW()
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.user_id = up.user_id 
AND up.first_name = 'Ελευθερία' AND up.last_name = 'Τσουρεκα'
AND mp.name = 'Pilates'
AND pd.is_active = true;

-- Lina Papad - είχε 25, έχει 10 τώρα
UPDATE pilates_deposits pd
SET deposit_remaining = 25, updated_at = NOW()
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.user_id = up.user_id 
AND up.first_name = 'Lina' AND up.last_name = 'Papad'
AND mp.name = 'Pilates'
AND pd.is_active = true;

SELECT 'UPDATES COMPLETED' as status;

-- PHASE 3: VERIFICATION
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
    END AS "Πήραν"
FROM pilates_deposits pd
LEFT JOIN user_profiles up ON pd.user_id = up.user_id
LEFT JOIN memberships m ON pd.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.is_active = true
ORDER BY pd.deposit_remaining DESC
LIMIT 50;

COMMIT;

SELECT '✅ DONE!' as "STATUS";

