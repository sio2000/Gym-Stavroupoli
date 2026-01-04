-- ═══════════════════════════════════════════════════════════════════════════════
-- TEST: Weekly Pilates Refill - Κάθε Κυριακή
-- ═══════════════════════════════════════════════════════════════════════════════
-- Τρέξε αυτό το script στο Supabase SQL Editor για να τεστάρεις το refill
-- ═══════════════════════════════════════════════════════════════════════════════

-- ========================================
-- TEST 1: Έλεγχος Feature Flag
-- ========================================

SELECT 'TEST 1: Έλεγχος Feature Flag' as test_name;

SELECT 
    name,
    is_enabled,
    CASE WHEN is_enabled THEN '✅ ΕΝΕΡΓΟ' ELSE '❌ ΑΠΕΝΕΡΓΟΠΟΙΗΜΕΝΟ' END as status
FROM public.feature_flags 
WHERE name = 'weekly_pilates_refill_enabled';

-- ========================================
-- TEST 2: Έλεγχος Ultimate χρηστών ΠΡΙΝ το refill
-- ========================================

SELECT 'TEST 2: Ultimate χρήστες ΠΡΙΝ το refill' as test_name;

SELECT 
    up.first_name,
    up.last_name,
    m.source_package_name as package,
    m.is_active,
    m.start_date,
    m.end_date,
    COALESCE(pd.deposit_remaining, 0) as current_deposit,
    CASE 
        WHEN m.source_package_name = 'Ultimate' THEN 3
        WHEN m.source_package_name = 'Ultimate Medium' THEN 1
        ELSE 0
    END as target_deposit,
    CASE 
        WHEN COALESCE(pd.deposit_remaining, 0) < 
            CASE 
                WHEN m.source_package_name = 'Ultimate' THEN 3
                WHEN m.source_package_name = 'Ultimate Medium' THEN 1
                ELSE 0
            END 
        THEN '⚠️ ΧΡΕΙΑΖΕΤΑΙ REFILL'
        ELSE '✅ OK'
    END as status
FROM public.memberships m
JOIN public.user_profiles up ON m.user_id = up.user_id
LEFT JOIN public.pilates_deposits pd ON m.user_id = pd.user_id AND pd.is_active = true
WHERE m.source_package_name IN ('Ultimate', 'Ultimate Medium')
AND m.is_active = true
AND m.start_date <= CURRENT_DATE
AND m.end_date >= CURRENT_DATE
ORDER BY m.source_package_name, up.last_name;

-- ========================================
-- TEST 3: Εκτέλεση refill
-- ========================================

SELECT 'TEST 3: Εκτέλεση process_weekly_pilates_refills()' as test_name;

SELECT * FROM public.process_weekly_pilates_refills();

-- ========================================
-- TEST 4: Έλεγχος Ultimate χρηστών ΜΕΤΑ το refill
-- ========================================

SELECT 'TEST 4: Ultimate χρήστες ΜΕΤΑ το refill' as test_name;

SELECT 
    up.first_name,
    up.last_name,
    m.source_package_name as package,
    COALESCE(pd.deposit_remaining, 0) as new_deposit,
    CASE 
        WHEN m.source_package_name = 'Ultimate' THEN 3
        WHEN m.source_package_name = 'Ultimate Medium' THEN 1
        ELSE 0
    END as expected_deposit,
    CASE 
        WHEN COALESCE(pd.deposit_remaining, 0) = 
            CASE 
                WHEN m.source_package_name = 'Ultimate' THEN 3
                WHEN m.source_package_name = 'Ultimate Medium' THEN 1
                ELSE 0
            END 
        THEN '✅ ΣΩΣΤΟ'
        ELSE '❌ ΛΑΘΟΣ'
    END as result
FROM public.memberships m
JOIN public.user_profiles up ON m.user_id = up.user_id
LEFT JOIN public.pilates_deposits pd ON m.user_id = pd.user_id AND pd.is_active = true
WHERE m.source_package_name IN ('Ultimate', 'Ultimate Medium')
AND m.is_active = true
AND m.start_date <= CURRENT_DATE
AND m.end_date >= CURRENT_DATE
ORDER BY m.source_package_name, up.last_name;

-- ========================================
-- TEST 5: Έλεγχος Refill History
-- ========================================

SELECT 'TEST 5: Refill History για σήμερα' as test_name;

SELECT 
    up.first_name,
    up.last_name,
    uwr.package_name,
    uwr.previous_deposit_amount as previous,
    uwr.new_deposit_amount as new,
    uwr.refill_date,
    uwr.refill_week_number as week,
    '✅ ΚΑΤΑΓΡΑΦΗΚΕ' as status
FROM public.ultimate_weekly_refills uwr
JOIN public.user_profiles up ON uwr.user_id = up.user_id
WHERE uwr.refill_date = CURRENT_DATE
ORDER BY uwr.created_at DESC;

-- ========================================
-- TEST 6: Σύνοψη
-- ========================================

SELECT 'TEST 6: ΣΥΝΟΨΗ' as test_name;

WITH stats AS (
    SELECT 
        COUNT(*) as total_ultimate_users,
        SUM(CASE WHEN m.source_package_name = 'Ultimate' THEN 1 ELSE 0 END) as ultimate_count,
        SUM(CASE WHEN m.source_package_name = 'Ultimate Medium' THEN 1 ELSE 0 END) as ultimate_medium_count
    FROM public.memberships m
    WHERE m.source_package_name IN ('Ultimate', 'Ultimate Medium')
    AND m.is_active = true
    AND m.start_date <= CURRENT_DATE
    AND m.end_date >= CURRENT_DATE
),
refills_today AS (
    SELECT COUNT(*) as count
    FROM public.ultimate_weekly_refills
    WHERE refill_date = CURRENT_DATE
),
correct_deposits AS (
    SELECT 
        COUNT(*) as count
    FROM public.memberships m
    LEFT JOIN public.pilates_deposits pd ON m.user_id = pd.user_id AND pd.is_active = true
    WHERE m.source_package_name IN ('Ultimate', 'Ultimate Medium')
    AND m.is_active = true
    AND m.start_date <= CURRENT_DATE
    AND m.end_date >= CURRENT_DATE
    AND COALESCE(pd.deposit_remaining, 0) = 
        CASE 
            WHEN m.source_package_name = 'Ultimate' THEN 3
            WHEN m.source_package_name = 'Ultimate Medium' THEN 1
            ELSE 0
        END
)
SELECT 
    s.total_ultimate_users as "Συνολικοί Ultimate χρήστες",
    s.ultimate_count as "Ultimate (3 μαθήματα)",
    s.ultimate_medium_count as "Ultimate Medium (1 μάθημα)",
    r.count as "Refills σήμερα",
    c.count as "Σωστά deposits",
    CASE 
        WHEN c.count = s.total_ultimate_users THEN '✅ 100% ΕΠΙΤΥΧΙΑ!'
        ELSE '⚠️ ' || (s.total_ultimate_users - c.count)::text || ' χρήστες χρειάζονται έλεγχο'
    END as "Αποτέλεσμα"
FROM stats s, refills_today r, correct_deposits c;

-- ========================================
-- ΤΕΛΙΚΟ ΜΗΝΥΜΑ
-- ========================================

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT '🎉 TESTS ΟΛΟΚΛΗΡΩΘΗΚΑΝ!' as message;
SELECT 'Αν όλα τα deposits είναι σωστά, το Sunday refill λειτουργεί!' as info;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

