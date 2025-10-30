-- Query 1: Βλέπω τα deposits
SELECT user_id, deposit_remaining, is_active 
FROM pilates_deposits 
WHERE is_active = true 
ORDER BY deposit_remaining DESC;

-- Query 2: Βλέπω deposits με ονόματα
SELECT 
    pd.user_id,
    pd.deposit_remaining,
    up.first_name || ' ' || up.last_name AS όνομα
FROM pilates_deposits pd
LEFT JOIN user_profiles up ON pd.user_id = up.user_id
WHERE pd.is_active = true
ORDER BY pd.deposit_remaining DESC;

-- Query 3: Τέλειο query με όλα
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
    END AS "Πήραν Αρχικά",
    m.created_at AS "Εγκρίθηκε"
FROM pilates_deposits pd
LEFT JOIN user_profiles up ON pd.user_id = up.user_id
LEFT JOIN memberships m ON pd.user_id = m.user_id AND m.is_active = true
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE pd.is_active = true
ORDER BY pd.deposit_remaining DESC;

