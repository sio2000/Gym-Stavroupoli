-- ═══════════════════════════════════════════════════════════════════════════
-- Προβολή Pilates deposits με τρέχοντα και αρχικά μαθήματα
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Αυτό το script δείχνει:
-- 1. Ποσα μαθήματα έχουν ΤΩΡΑ
-- 2. Ποσα μαθήματα πήρανε ΟΤΑΝ εγκρίθηκε το πακέτο
-- 3. Πότε εγκρίθηκε
--
-- ⚠️ READ-ONLY - 100% ΑΣΦΑΛΕΣ
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα Χρήστη",
    up.email AS "Email",
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
        ELSE pd.deposit_remaining
    END AS "Αρχικά Μαθήματα",
    m.created_at AS "Εγκρίθηκε Στις",
    m.start_date AS "Ξεκίνησε",
    m.end_date AS "Λήγει",
    CASE 
        WHEN pd.deposit_remaining < CASE 
            WHEN m.duration_type = 'pilates_trial' THEN 1
            WHEN m.duration_type = 'pilates_1month' THEN 4
            WHEN m.duration_type = 'pilates_2months' THEN 8
            WHEN m.duration_type = 'pilates_3months' THEN 16
            WHEN m.duration_type = 'pilates_6months' THEN 25
            WHEN m.duration_type = 'pilates_1year' THEN 50
            WHEN mp.name = 'Ultimate' THEN 3
            WHEN mp.name = 'Ultimate Medium' THEN 1
            ELSE pd.deposit_remaining
        END THEN '📉 Μειώθηκαν'
        WHEN pd.deposit_remaining = CASE 
            WHEN m.duration_type = 'pilates_trial' THEN 1
            WHEN m.duration_type = 'pilates_1month' THEN 4
            WHEN m.duration_type = 'pilates_2months' THEN 8
            WHEN m.duration_type = 'pilates_3months' THEN 16
            WHEN m.duration_type = 'pilates_6months' THEN 25
            WHEN m.duration_type = 'pilates_1year' THEN 50
            WHEN mp.name = 'Ultimate' THEN 3
            WHEN mp.name = 'Ultimate Medium' THEN 1
            ELSE pd.deposit_remaining
        END THEN '✅ Ίδια'
        ELSE '📈 Αυξήθηκαν'
    END AS "Σύγκριση"
FROM user_profiles up
INNER JOIN pilates_deposits pd ON up.user_id = pd.user_id
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.is_active = true
ORDER BY pd.deposit_remaining DESC, up.first_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 2: ΑΠΛΗ ΛΙΣΤΑ ΜΕ ΜΟΝΟ ΤΑ ΣΗΜΑΝΤΙΚΑ
-- ═══════════════════════════════════════════════════════════════════════════

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
    m.created_at AS "Εγκρίθηκε"
FROM user_profiles up
INNER JOIN pilates_deposits pd ON up.user_id = pd.user_id
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.is_active = true
ORDER BY pd.deposit_remaining DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 3: ΧΡΗΣΤΕΣ ΜΕ ΜΕΙΩΜΕΝΑ ΜΑΘΗΜΑΤΑ
-- ═══════════════════════════════════════════════════════════════════════════

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
    (CASE 
        WHEN m.duration_type = 'pilates_trial' THEN 1
        WHEN m.duration_type = 'pilates_1month' THEN 4
        WHEN m.duration_type = 'pilates_2months' THEN 8
        WHEN m.duration_type = 'pilates_3months' THEN 16
        WHEN m.duration_type = 'pilates_6months' THEN 25
        WHEN m.duration_type = 'pilates_1year' THEN 50
        WHEN mp.name = 'Ultimate' THEN 3
        WHEN mp.name = 'Ultimate Medium' THEN 1
        ELSE NULL
    END - pd.deposit_remaining) AS "Διαφορά"
FROM user_profiles up
INNER JOIN pilates_deposits pd ON up.user_id = pd.user_id
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.is_active = true
AND pd.deposit_remaining < CASE 
    WHEN m.duration_type = 'pilates_trial' THEN 1
    WHEN m.duration_type = 'pilates_1month' THEN 4
    WHEN m.duration_type = 'pilates_2months' THEN 8
    WHEN m.duration_type = 'pilates_3months' THEN 16
    WHEN m.duration_type = 'pilates_6months' THEN 25
    WHEN m.duration_type = 'pilates_1year' THEN 50
    WHEN mp.name = 'Ultimate' THEN 3
    WHEN mp.name = 'Ultimate Medium' THEN 1
    ELSE pd.deposit_remaining
END
ORDER BY (CASE 
    WHEN m.duration_type = 'pilates_trial' THEN 1
    WHEN m.duration_type = 'pilates_1month' THEN 4
    WHEN m.duration_type = 'pilates_2months' THEN 8
    WHEN m.duration_type = 'pilates_3months' THEN 16
    WHEN m.duration_type = 'pilates_6months' THEN 25
    WHEN m.duration_type = 'pilates_1year' THEN 50
    WHEN mp.name = 'Ultimate' THEN 3
    WHEN mp.name = 'Ultimate Medium' THEN 1
    ELSE NULL
END - pd.deposit_remaining) DESC;

SELECT '✅ REPORT ΟΛΟΚΛΗΡΩΘΗΚΕ' as "STATUS";

