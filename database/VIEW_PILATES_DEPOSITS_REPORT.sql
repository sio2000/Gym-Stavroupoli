-- ═══════════════════════════════════════════════════════════════
-- SAFE SQL QUERY: Προβολή χρηστών με Pilates Deposits > 0
-- 100% ΑΣΦΑΛΕΣ QUERY - Μόνο SELECT (ΔΕΝ κάνει αλλαγές)
-- ═══════════════════════════════════════════════════════════════

-- Query που δείχνει ποιοι χρήστες έχουν deposit pilates μαθημάτων > 0 και πόσα έχουν
SELECT 
    -- Στοιχεία χρήστη
    up.user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.phone,
    
    -- Deposit πληροφορίες
    pd.id AS deposit_id,
    pd.deposit_remaining AS deposit_remaining,
    pd.is_active AS deposit_is_active,
    pd.credited_at AS deposit_credited_at,
    pd.expires_at AS deposit_expires_at,
    pd.created_at AS deposit_created_at,
    
    -- Πακέτο (αν υπάρχει)
    mp.name AS package_name,
    
    -- Ταξινόμηση ανά deposit_remaining (μεγαλύτερα πρώτα)
    CASE 
        WHEN pd.deposit_remaining > 0 THEN 'ΕΝΕΡΓΟ'
        ELSE 'ΑΝΕΝΕΡΓΟ'
    END AS status

FROM 
    public.pilates_deposits pd
    
    -- JOIN με user_profiles για τα στοιχεία του χρήστη
    INNER JOIN public.user_profiles up ON pd.user_id = up.user_id
    
    -- LEFT JOIN με membership_packages για το όνομα του πακέτου (αν υπάρχει)
    LEFT JOIN public.membership_packages mp ON pd.package_id = mp.id

WHERE 
    -- Φιλτράρισμα: μόνο deposits με υπόλοιπο > 0
    pd.deposit_remaining > 0
    
    -- Προαιρετικό: Ενεργά deposits μόνο (ξε-σχολιάστε αν θέλετε)
    -- AND pd.is_active = true

ORDER BY 
    -- Ταξινόμηση: μεγαλύτερα deposits πρώτα
    pd.deposit_remaining DESC,
    
    -- Δευτερεύουσα ταξινόμηση: κατά επώνυμο
    up.last_name ASC,
    up.first_name ASC;

-- ═══════════════════════════════════════════════════════════════
-- ΕΝΑΛΛΑΚΤΙΚΟ QUERY: Σύνοψη ανά χρήστη (SUM)
-- Αν ένας χρήστης έχει πολλά deposits, δείχνει το TOTAL
-- ═══════════════════════════════════════════════════════════════

/*
SELECT 
    up.user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.phone,
    
    -- Σύνολο deposits (αν έχει πολλά)
    COUNT(pd.id) AS total_deposits,
    SUM(pd.deposit_remaining) AS total_deposit_remaining,
    
    -- Πιο πρόσφατο deposit
    MAX(pd.credited_at) AS latest_deposit_date,
    
    -- Κατάσταση
    CASE 
        WHEN SUM(pd.deposit_remaining) > 0 THEN 'ΕΝΕΡΓΟ'
        ELSE 'ΑΝΕΝΕΡΓΟ'
    END AS status

FROM 
    public.pilates_deposits pd
    INNER JOIN public.user_profiles up ON pd.user_id = up.user_id

WHERE 
    pd.deposit_remaining > 0
    -- AND pd.is_active = true

GROUP BY 
    up.user_id, up.first_name, up.last_name, up.email, up.phone

ORDER BY 
    total_deposit_remaining DESC,
    up.last_name ASC,
    up.first_name ASC;
*/

-- ═══════════════════════════════════════════════════════════════
-- ΠΡΟΣΘΕΤΟ QUERY: Στατιστικά ανά πακέτο
-- ═══════════════════════════════════════════════════════════════

/*
SELECT 
    mp.name AS package_name,
    COUNT(DISTINCT pd.user_id) AS total_users_with_deposit,
    COUNT(pd.id) AS total_deposits,
    SUM(pd.deposit_remaining) AS total_deposit_remaining,
    AVG(pd.deposit_remaining) AS avg_deposit_remaining,
    MIN(pd.deposit_remaining) AS min_deposit_remaining,
    MAX(pd.deposit_remaining) AS max_deposit_remaining

FROM 
    public.pilates_deposits pd
    LEFT JOIN public.membership_packages mp ON pd.package_id = mp.id

WHERE 
    pd.deposit_remaining > 0

GROUP BY 
    mp.name

ORDER BY 
    total_deposit_remaining DESC;
*/

-- ═══════════════════════════════════════════════════════════════
-- END OF REPORT
-- ═══════════════════════════════════════════════════════════════

