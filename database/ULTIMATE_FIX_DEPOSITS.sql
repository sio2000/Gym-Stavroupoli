-- ═══════════════════════════════════════════════════════════════════════════
-- ΤΕΛΙΚΗ ΕΠΑΝΑΦΟΡΑ DEPOSITS ΣΤΙΣ ΣΩΣΤΕΣ ΤΙΜΕΣ
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Ενημέρωση κάθε χρήστη βάσει του πιο πρόσφατου deposit του
UPDATE pilates_deposits pd
SET deposit_remaining = (
    SELECT CASE 
        WHEN up.first_name || ' ' || up.last_name IN (
            'Φιλιππος Πασχαλουδης', 'κωνσταντινα τζηκα', 'Ντενια Ιγνατιδου',
            'Δημητρα Γκαγκαλουδη', 'Νενα Παπαδοπουλου', 'ΦΩΤΗΣ ΦΩΤΙΑΔΗΣ',
            'Ελευθερία Τσουρεκα', 'Lina Papad', 'asdafs asfasdg',
            'nik nik', 'as as', 'sadf asdfg', 'scs scs', 'Μαρία  Σαββαϊδου '
        ) THEN 25
        WHEN up.first_name || ' ' || up.last_name IN (
            'Ελεονωρα Τιτοπουλου', 'Μαρια Νταβιτιδη'
        ) THEN 50
        WHEN up.first_name || ' ' || up.last_name = 'ladis ladis' THEN 8
        WHEN up.first_name || ' ' || up.last_name = 'dora dora' THEN 16
        WHEN up.first_name || ' ' || up.last_name IN (
            'til til', 'demena demena', 'gkan gkan'
        ) THEN 4
        WHEN up.first_name || ' ' || up.last_name IN (
            'Αριστείδης Αμανατίδης', 'model model', 'apooooo apooooo',
            '4324 5665', 'Χρήστος ΣΑΛΤΣΙΔΗΣ', '111 111', '2222 23323'
        ) THEN 1
        ELSE pd.deposit_remaining
    END
    FROM user_profiles up
    WHERE up.user_id = pd.user_id
),
updated_at = NOW()
WHERE pd.is_active = true
AND pd.id IN (
    SELECT pd2.id
    FROM pilates_deposits pd2
    WHERE pd2.user_id = pd.user_id
    AND pd2.is_active = true
    ORDER BY pd2.created_at DESC
    LIMIT 1
);

SELECT 'Updated all deposits' as status;

-- VERIFICATION
SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα",
    mp.name AS "Πακέτο",
    pd.deposit_remaining AS "Μαθήματα Τώρα",
    pd.created_at AS "Δημιουργήθηκε"
FROM pilates_deposits pd
LEFT JOIN user_profiles up ON pd.user_id = up.user_id
LEFT JOIN memberships m ON pd.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.is_active = true
ORDER BY pd.deposit_remaining DESC, up.first_name;

COMMIT;

SELECT '✅ DONE!' as "STATUS";

