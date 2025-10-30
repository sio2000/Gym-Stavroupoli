-- ═══════════════════════════════════════════════════════════════════════════
-- 100% ΑΣΦΑΛΕΣ SQL - Προβολή τρεχουσών Pilates Deposits
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Αυτό το script ΔΕΝ ΚΑΝΕΙ ΚΑΜΙΑ ΑΛΛΑΓΗ στη βάση δεδομένων.
-- Εμφανίζει μόνο την τρέχουσα κατάσταση των deposits.
--
-- ⚠️ READ-ONLY - 100% ΑΣΦΑΛΕΣ
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 1: ΠΡΟΒΟΛΗ ΟΛΩΝ ΤΩΝ ENERGΩΝ DEPOSITS ΜΕ ΟΝΟΜΑΤΑ ΧΡΗΣΤΩΝ
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    ROW_NUMBER() OVER (ORDER BY pd.deposit_remaining DESC, up.first_name) as "Α/Α",
    up.first_name || ' ' || up.last_name AS "Όνομα Χρήστη",
    COALESCE(mp.name, 'N/A') AS "Πακέτο",
    pd.deposit_remaining AS "Υπόλοιπο Μαθημάτων",
    CASE 
        WHEN pd.deposit_remaining > 15 THEN '🔴 Υψηλό'
        WHEN pd.deposit_remaining > 5 THEN '🟢 Κανονικό'
        WHEN pd.deposit_remaining > 0 THEN '🟡 Χαμηλό'
        ELSE '⚫ Εκπνεύσει'
    END AS "Κατάσταση",
    pd.is_active AS "Ενεργό",
    pd.created_at AS "Δημιουργήθηκε",
    pd.updated_at AS "Τελευταία Ενημέρωση",
    pd.id AS "Deposit ID",
    pd.user_id AS "User ID"
FROM pilates_deposits pd
LEFT JOIN user_profiles up ON pd.user_id = up.user_id
LEFT JOIN membership_packages mp ON pd.package_id = mp.id
WHERE pd.is_active = true
ORDER BY pd.deposit_remaining DESC, up.first_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 2: ΣΥΝΟΛΙΚΗ ΣΤΑΤΙΣΤΙΚΗ
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    '═══════════════════════════════════════════════════════════' as "ΣΤΑΤΙΣΤΙΚΗ";
    
SELECT 
    COUNT(*) as "Συνολικοί Ενεργοί Χρήστες",
    SUM(pd.deposit_remaining) as "Συνολικά Μαθήματα",
    AVG(pd.deposit_remaining) as "Μέσος Όρος Μαθημάτων",
    MIN(pd.deposit_remaining) as "Ελάχιστα Μαθήματα",
    MAX(pd.deposit_remaining) as "Μέγιστα Μαθήματα"
FROM pilates_deposits pd
WHERE pd.is_active = true;

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 3: ΚΑΤΑΝΟΜΗ ΜΑΘΗΜΑΤΩΝ ΑΝΑ ΠΑΚΕΤΟ
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    '═══════════════════════════════════════════════════════════' as "ΚΑΤΑΝΟΜΗ ΑΝΑ ΠΑΚΕΤΟ";
    
SELECT 
    COALESCE(mp.name, 'N/A') AS "Πακέτο",
    COUNT(*) as "Αριθμός Χρηστών",
    SUM(pd.deposit_remaining) as "Συνολικά Μαθήματα",
    AVG(pd.deposit_remaining) as "Μέσος Όρος",
    MIN(pd.deposit_remaining) as "Ελάχιστο",
    MAX(pd.deposit_remaining) as "Μέγιστο"
FROM pilates_deposits pd
LEFT JOIN membership_packages mp ON pd.package_id = mp.id
WHERE pd.is_active = true
GROUP BY mp.name
ORDER BY mp.name;

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 4: ΧΡΗΣΤΕΣ ΜΕ ΥΨΗΛΑ DEPOSITS (>15 μαθήματα)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    '═══════════════════════════════════════════════════════════' as "ΧΡΗΣΤΕΣ ΜΕ ΥΨΗΛΑ DEPOSITS";
    
SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα Χρήστη",
    COALESCE(mp.name, 'N/A') AS "Πακέτο",
    pd.deposit_remaining AS "Υπόλοιπο Μαθημάτων",
    pd.created_at AS "Δημιουργήθηκε"
FROM pilates_deposits pd
LEFT JOIN user_profiles up ON pd.user_id = up.user_id
LEFT JOIN membership_packages mp ON pd.package_id = mp.id
WHERE pd.is_active = true
AND pd.deposit_remaining > 15
ORDER BY pd.deposit_remaining DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 5: ΧΡΗΣΤΕΣ ΜΕ ΧΑΜΗΛΑ DEPOSITS (1-5 μαθήματα)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    '═══════════════════════════════════════════════════════════' as "ΧΡΗΣΤΕΣ ΜΕ ΧΑΜΗΛΑ DEPOSITS";
    
SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα Χρήστη",
    COALESCE(mp.name, 'N/A') AS "Πακέτο",
    pd.deposit_remaining AS "Υπόλοιπο Μαθημάτων",
    pd.created_at AS "Δημιουργήθηκε"
FROM pilates_deposits pd
LEFT JOIN user_profiles up ON pd.user_id = up.user_id
LEFT JOIN membership_packages mp ON pd.package_id = mp.id
WHERE pd.is_active = true
AND pd.deposit_remaining BETWEEN 1 AND 5
ORDER BY pd.deposit_remaining ASC;

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 6: ΧΡΗΣΤΕΣ ΜΕ STANDARD DEPOSITS (6-15 μαθήματα)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    '═══════════════════════════════════════════════════════════' as "ΧΡΗΣΤΕΣ ΜΕ STANDARD DEPOSITS";
    
SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα Χρήστη",
    COALESCE(mp.name, 'N/A') AS "Πακέτο",
    pd.deposit_remaining AS "Υπόλοιπο Μαθημάτων",
    pd.created_at AS "Δημιουργήθηκε"
FROM pilates_deposits pd
LEFT JOIN user_profiles up ON pd.user_id = up.user_id
LEFT JOIN membership_packages mp ON pd.package_id = mp.id
WHERE pd.is_active = true
AND pd.deposit_remaining BETWEEN 6 AND 15
ORDER BY pd.deposit_remaining DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 7: INACTIVE DEPOSITS (εκπνεύσαν)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    '═══════════════════════════════════════════════════════════' as "INACTIVE DEPOSITS";
    
SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα Χρήστη",
    COALESCE(mp.name, 'N/A') AS "Πακέτο",
    pd.deposit_remaining AS "Υπόλοιπο Μαθημάτων",
    pd.created_at AS "Δημιουργήθηκε",
    pd.expires_at AS "Εξέπνευσε"
FROM pilates_deposits pd
LEFT JOIN user_profiles up ON pd.user_id = up.user_id
LEFT JOIN membership_packages mp ON pd.package_id = mp.id
WHERE pd.is_active = false
ORDER BY pd.expires_at DESC
LIMIT 20;

-- ═══════════════════════════════════════════════════════════════════════════
-- Query 8: ΟΛΟΚΛΗΡΩΤΙΚΗ ΛΙΣΤΑ (ΚΑΤΑ ΤΑΞΗ ΑΛΦΑΒΗΤΟΥ)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    '═══════════════════════════════════════════════════════════' as "ΟΛΟΚΛΗΡΩΤΙΚΗ ΛΙΣΤΑ (ΑΛΦΑΒΗΤΙΚΑ)";
    
SELECT 
    up.first_name || ' ' || up.last_name AS "Όνομα Χρήστη",
    up.email AS "Email",
    up.phone AS "Τηλέφωνο",
    COALESCE(mp.name, 'N/A') AS "Πακέτο",
    pd.deposit_remaining AS "Υπόλοιπο",
    pd.created_at AS "Δημιουργήθηκε",
    pd.updated_at AS "Ενημερώθηκε"
FROM pilates_deposits pd
LEFT JOIN user_profiles up ON pd.user_id = up.user_id
LEFT JOIN membership_packages mp ON pd.package_id = mp.id
WHERE pd.is_active = true
ORDER BY up.first_name, up.last_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- ΤΕΛΟΣ REPORT
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '✅ READ-ONLY REPORT ΟΛΟΚΛΗΡΩΘΗΚΕ' as "STATUS";

