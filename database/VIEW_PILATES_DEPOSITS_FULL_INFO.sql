-- ═══════════════════════════════════════════════════════════════════════════
-- Προβολή ενεργών χρηστών Pilates με πλήρη πληροφόρηση
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Αυτό το script δείχνει:
-- 1. Ποσα μαθήματα έχουν ΤΩΡΑ στον λογαριασμό τους
-- 2. Ποσα μαθήματα πήρανε ΟΤΑΝ εγκρίθηκε το πακέτο
-- 3. Πότε εγκρίθηκε το πακέτο
-- 4. Πληροφορίες συνδρομής
--
-- ⚠️ READ-ONLY - 100% ΑΣΦΑΛΕΣ
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα Χρήστη",
    up.email AS "Email",
    mp.name AS "Πακέτο Συνδρομής",
    pd.deposit_remaining AS "Τρέχοντα Μαθήματα",
    pd.credited_at AS "Πιστώθηκε Στις",
    m.created_at AS "Εγκρίθηκε Στις",
    m.start_date AS "Ξεκίνησε",
    m.end_date AS "Λήγει",
    CASE 
        WHEN m.end_date > CURRENT_DATE THEN '🟢 Ενεργή'
        ELSE '🔴 Έληξε'
    END AS "Κατάσταση",
    pd.id AS "Deposit ID"
FROM user_profiles up
INNER JOIN pilates_deposits pd ON up.user_id = pd.user_id
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.is_active = true
ORDER BY pd.deposit_remaining DESC, up.first_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 2: ΑΠΛΗ ΛΙΣΤΑ ΜΕ ΟΝΟΜΑΤΑ ΚΑΙ ΜΑΘΗΜΑΤΑ
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα",
    mp.name AS "Πακέτο",
    pd.deposit_remaining AS "Μαθήματα Τώρα",
    pd.credited_at AS "Πιστώθηκε"
FROM user_profiles up
INNER JOIN pilates_deposits pd ON up.user_id = pd.user_id
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.is_active = true
ORDER BY pd.deposit_remaining DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 3: ΧΡΗΣΤΕΣ ΜΕ ΕΝΕΡΓΗ ΣΥΝΔΡΟΜΗ ΚΑΙ DEPOSITS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα",
    mp.name AS "Πακέτο",
    pd.deposit_remaining AS "Μαθήματα",
    m.created_at AS "Εγκρίθηκε",
    m.start_date AS "Ξεκίνησε",
    m.end_date AS "Λήγει"
FROM user_profiles up
INNER JOIN memberships m ON up.user_id = m.user_id
INNER JOIN membership_packages mp ON m.package_id = mp.id
LEFT JOIN pilates_deposits pd ON up.user_id = pd.user_id AND pd.is_active = true
WHERE m.is_active = true
AND mp.name IN ('Pilates', 'Ultimate', 'Ultimate Medium')
ORDER BY mp.name, pd.deposit_remaining DESC NULLS LAST;

