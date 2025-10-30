-- ═══════════════════════════════════════════════════════════════════════════
-- Προβολή ενεργών χρηστών με Pilates συνδρομές και deposits
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Αυτό το script δείχνει:
-- 1. Ποιοι χρήστες έχουν ενεργή Pilates συνδρομή
-- 2. Ποιο πακέτο έχουν
-- 3. Πότε εγκρίθηκε η συνδρομή
-- 4. Πόσα μαθήματα Pilates έχουν στο deposit τους
--
-- ⚠️ READ-ONLY - 100% ΑΣΦΑΛΕΣ
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 1: ΟΛΟΙ ΟΙ ΧΡΗΣΤΕΣ ΜΕ ΕΝΕΡΓΗ PILATES ΣΥΝΔΡΟΜΗ ΚΑΙ DEPOSITS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    ROW_NUMBER() OVER (ORDER BY up.first_name, up.last_name) as "Α/Α",
    up.first_name || ' ' || up.last_name AS "Όνομα Χρήστη",
    up.email AS "Email",
    mp.name AS "Πακέτο Συνδρομής",
    pd.deposit_remaining AS "Υπόλοιπο Μαθημάτων",
    m.start_date AS "Ξεκίνησε",
    m.end_date AS "Λήγει",
    m.created_at AS "Εγκρίθηκε Στις",
    CASE 
        WHEN m.is_active THEN '🟢 Ενεργή'
        ELSE '🔴 Ανενεργή'
    END AS "Κατάσταση Συνδρομής",
    CASE 
        WHEN pd.deposit_remaining > 15 THEN '🔴 Πολλά'
        WHEN pd.deposit_remaining > 5 THEN '🟢 Κανονικά'
        WHEN pd.deposit_remaining > 0 THEN '🟡 Λίγα'
        ELSE '⚫ Καμία'
    END AS "Κατάσταση Deposits"
FROM user_profiles up
INNER JOIN memberships m ON up.user_id = m.user_id
INNER JOIN membership_packages mp ON m.package_id = mp.id
LEFT JOIN pilates_deposits pd ON up.user_id = pd.user_id AND pd.is_active = true
WHERE m.is_active = true
AND mp.name IN ('Pilates', 'Ultimate', 'Ultimate Medium')
ORDER BY up.first_name, up.last_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 2: ΜΟΝΟ ΟΙ ΧΡΗΣΤΕΣ ΜΕ ΕΝΕΡΓΗ PILATES ΣΥΝΔΡΟΜΗ (SIMPLIFIED)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα",
    mp.name AS "Πακέτο",
    pd.deposit_remaining AS "Μαθήματα",
    m.start_date AS "Ξεκίνησε",
    m.end_date AS "Λήγει"
FROM user_profiles up
INNER JOIN memberships m ON up.user_id = m.user_id
INNER JOIN membership_packages mp ON m.package_id = mp.id
LEFT JOIN pilates_deposits pd ON up.user_id = pd.user_id AND pd.is_active = true
WHERE m.is_active = true
AND mp.name IN ('Pilates', 'Ultimate', 'Ultimate Medium')
ORDER BY mp.name, pd.deposit_remaining DESC, up.first_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 3: ΣΤΑΤΙΣΤΙΚΑ
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    mp.name AS "Πακέτο",
    COUNT(DISTINCT m.user_id) AS "Αριθμός Χρηστών",
    SUM(pd.deposit_remaining) AS "Συνολικά Μαθήματα",
    AVG(pd.deposit_remaining) AS "Μέσος Όρος Μαθημάτων",
    MIN(pd.deposit_remaining) AS "Ελάχιστα",
    MAX(pd.deposit_remaining) AS "Μέγιστα"
FROM memberships m
INNER JOIN membership_packages mp ON m.package_id = mp.id
LEFT JOIN pilates_deposits pd ON m.user_id = pd.user_id AND pd.is_active = true
WHERE m.is_active = true
AND mp.name IN ('Pilates', 'Ultimate', 'Ultimate Medium')
GROUP BY mp.name
ORDER BY mp.name;

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 4: ΧΡΗΣΤΕΣ ΜΕ PILATES DEPOSITS ΑΛΛΑ ΧΩΡΙΣ ΕΝΕΡΓΗ ΣΥΝΔΡΟΜΗ
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα",
    pd.deposit_remaining AS "Μαθήματα",
    pd.created_at AS "Δημιουργήθηκε"
FROM user_profiles up
INNER JOIN pilates_deposits pd ON up.user_id = pd.user_id
WHERE pd.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM memberships m 
    WHERE m.user_id = up.user_id 
    AND m.is_active = true
    AND m.package_id IN (
        SELECT id FROM membership_packages 
        WHERE name IN ('Pilates', 'Ultimate', 'Ultimate Medium')
    )
)
ORDER BY pd.deposit_remaining DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 5: ΧΡΗΣΤΕΣ ΜΕ ΕΝΕΡΓΗ ΣΥΝΔΡΟΜΗ ΑΛΛΑ ΧΩΡΙΣ DEPOSITS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα",
    mp.name AS "Πακέτο",
    m.start_date AS "Ξεκίνησε",
    m.end_date AS "Λήγει"
FROM user_profiles up
INNER JOIN memberships m ON up.user_id = m.user_id
INNER JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.is_active = true
AND mp.name IN ('Pilates', 'Ultimate', 'Ultimate Medium')
AND NOT EXISTS (
    SELECT 1 FROM pilates_deposits pd 
    WHERE pd.user_id = up.user_id 
    AND pd.is_active = true
)
ORDER BY up.first_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 6: ΧΡΗΣΤΕΣ ΜΕ ΧΑΜΗΛΑ DEPOSITS (< 3 μαθήματα)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα",
    mp.name AS "Πακέτο",
    pd.deposit_remaining AS "Μαθήματα",
    m.end_date AS "Λήγει Στις"
FROM user_profiles up
INNER JOIN memberships m ON up.user_id = m.user_id
INNER JOIN membership_packages mp ON m.package_id = mp.id
INNER JOIN pilates_deposits pd ON up.user_id = pd.user_id
WHERE m.is_active = true
AND pd.is_active = true
AND mp.name IN ('Pilates', 'Ultimate', 'Ultimate Medium')
AND pd.deposit_remaining < 3
ORDER BY pd.deposit_remaining ASC;

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 7: ΧΡΗΣΤΕΣ ΜΕ ΥΨΗΛΑ DEPOSITS (> 15 μαθήματα)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα",
    mp.name AS "Πακέτο",
    pd.deposit_remaining AS "Μαθήματα",
    pd.created_at AS "Δημιουργήθηκε",
    pd.updated_at AS "Τελευταία Ενημέρωση"
FROM user_profiles up
INNER JOIN memberships m ON up.user_id = m.user_id
INNER JOIN membership_packages mp ON m.package_id = mp.id
INNER JOIN pilates_deposits pd ON up.user_id = pd.user_id
WHERE m.is_active = true
AND pd.is_active = true
AND mp.name IN ('Pilates', 'Ultimate', 'Ultimate Medium')
AND pd.deposit_remaining > 15
ORDER BY pd.deposit_remaining DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 8: ΧΡΟΝΟΛΟΓΙΑ ΕΠΙΒΕΒΑΙΩΣΕΩΝ
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    DATE(m.created_at) AS "Ημέρα",
    COUNT(*) AS "Αριθμός Επικυρώσεων",
    STRING_AGG(up.first_name || ' ' || up.last_name, ', ') AS "Χρήστες"
FROM memberships m
INNER JOIN user_profiles up ON m.user_id = up.user_id
INNER JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.is_active = true
AND mp.name IN ('Pilates', 'Ultimate', 'Ultimate Medium')
GROUP BY DATE(m.created_at)
ORDER BY DATE(m.created_at) DESC
LIMIT 30;

SELECT '✅ REPORT ΟΛΟΚΛΗΡΩΘΗΚΕ' as "STATUS";

