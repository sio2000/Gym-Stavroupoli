-- ═══════════════════════════════════════════════════════════════════════════
-- ΑΠΛΑ Queries για έλεγχο δεδομένων
-- ═══════════════════════════════════════════════════════════════════════════

-- Query 1: Βλέπω τα deposits χωρίς JOIN
SELECT 
    user_id,
    deposit_remaining AS "Μαθήματα",
    is_active AS "Ενεργό",
    created_at AS "Δημιουργήθηκε"
FROM pilates_deposits
WHERE is_active = true
ORDER BY deposit_remaining DESC;

-- Query 2: Βλέπω τους χρήστες με deposits
SELECT 
    pd.user_id,
    pd.deposit_remaining AS "Μαθήματα",
    up.first_name || ' ' || up.last_name AS "Όνομα"
FROM pilates_deposits pd
LEFT JOIN user_profiles up ON pd.user_id = up.user_id
WHERE pd.is_active = true
ORDER BY pd.deposit_remaining DESC;

-- Query 3: Βλέπω τις ενεργές συνδρομές Pilates
SELECT 
    m.user_id,
    mp.name AS "Πακέτο",
    m.start_date AS "Ξεκίνησε",
    m.end_date AS "Λήγει",
    m.is_active AS "Ενεργό"
FROM memberships m
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.is_active = true
AND mp.name IN ('Pilates', 'Ultimate', 'Ultimate Medium')
ORDER BY m.created_at DESC;

