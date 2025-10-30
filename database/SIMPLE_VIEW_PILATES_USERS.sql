-- ═══════════════════════════════════════════════════════════════════════════
-- ΑΠΛΟ Query - ΟΛΟΙ ΥΠΑΡΧΟΝΤΕΣ ΧΡΗΣΤΕΣ ΜΕ PILATES DEPOSITS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα",
    up.email AS "Email",
    mp.name AS "Πακέτο",
    pd.deposit_remaining AS "Μαθήματα",
    m.start_date AS "Ξεκίνησε",
    m.end_date AS "Λήγει",
    m.created_at AS "Εγκρίθηκε"
FROM user_profiles up
INNER JOIN pilates_deposits pd ON up.user_id = pd.user_id
LEFT JOIN memberships m ON up.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.is_active = true
ORDER BY pd.deposit_remaining DESC, up.first_name;

