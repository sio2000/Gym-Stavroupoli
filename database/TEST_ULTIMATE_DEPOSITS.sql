-- TEST: Επαλήθευση διόρθωσης Ultimate Pilates Deposits
-- Αυτό το script ελέγχει ότι η διόρθωση εφαρμόστηκε σωστά

SELECT '=== ΕΛΕΓΧΟΣ ULTIMATE DEPOSITS ===' as title;

-- Test 1: Έλεγχος get_user_weekly_refill_status function
SELECT '
TEST 1: Έλεγχος get_user_weekly_refill_status function' as test;

SELECT 
    up.first_name || ' ' || up.last_name as user_name,
    m.source_package_name as package,
    status.current_deposit_amount as current_deposit,
    status.target_deposit_amount as target_deposit,
    CASE 
        WHEN m.source_package_name = 'Ultimate' AND status.target_deposit_amount = 3 THEN '✅ ΣΩΣΤΟ'
        WHEN m.source_package_name = 'Ultimate Medium' AND status.target_deposit_amount = 1 THEN '✅ ΣΩΣΤΟ'
        ELSE '❌ ΛΑΘΟΣ'
    END as validation
FROM public.user_profiles up
JOIN public.memberships m ON up.user_id = m.user_id
CROSS JOIN LATERAL public.get_user_weekly_refill_status(up.user_id) status
WHERE m.source_package_name IN ('Ultimate', 'Ultimate Medium')
AND m.is_active = true
ORDER BY m.source_package_name, up.last_name
LIMIT 20;

-- Test 2: Έλεγχος create_ultimate_dual_memberships function
SELECT '
TEST 2: Επαλήθευση λογικής create_ultimate_dual_memberships' as test;

SELECT 
    'Ultimate Package' as package_type,
    '3 μαθήματα/εβδομάδα' as expected_deposits,
    'Ελέγξτε ότι νέες εγκρίσεις Ultimate δίνουν 3 μαθήματα' as note
UNION ALL
SELECT 
    'Ultimate Medium Package' as package_type,
    '1 μάθημα/εβδομάδα' as expected_deposits,
    'Ελέγξτε ότι νέες εγκρίσεις Ultimate Medium δίνουν 1 μάθημα' as note;

-- Test 3: Έλεγχος τρεχόντων deposits
SELECT '
TEST 3: Έλεγχος τρεχόντων Pilates deposits' as test;

SELECT 
    up.first_name || ' ' || up.last_name as user_name,
    m.source_package_name as package,
    pd.deposit_remaining as current_deposit,
    pd.created_at as deposit_created,
    pd.updated_at as deposit_updated,
    CASE 
        WHEN m.source_package_name = 'Ultimate' AND pd.deposit_remaining <= 3 THEN '✅'
        WHEN m.source_package_name = 'Ultimate Medium' AND pd.deposit_remaining <= 1 THEN '✅'
        ELSE '⚠️'
    END as check_status
FROM public.user_profiles up
JOIN public.memberships m ON up.user_id = m.user_id
JOIN public.pilates_deposits pd ON up.user_id = pd.user_id
WHERE m.source_package_name IN ('Ultimate', 'Ultimate Medium')
AND m.is_active = true
AND pd.is_active = true
ORDER BY m.source_package_name, up.last_name
LIMIT 20;

-- Σύνοψη
SELECT '
=== ΣΥΝΟΨΗ ===' as summary;

SELECT 
    m.source_package_name as package,
    COUNT(DISTINCT m.user_id) as total_users,
    AVG(COALESCE(pd.deposit_remaining, 0))::numeric(10,2) as avg_deposit,
    MIN(COALESCE(pd.deposit_remaining, 0)) as min_deposit,
    MAX(COALESCE(pd.deposit_remaining, 0)) as max_deposit
FROM public.memberships m
LEFT JOIN public.pilates_deposits pd ON m.user_id = pd.user_id AND pd.is_active = true
WHERE m.source_package_name IN ('Ultimate', 'Ultimate Medium')
AND m.is_active = true
GROUP BY m.source_package_name
ORDER BY m.source_package_name;

SELECT '✅ Επαλήθευση ολοκληρώθηκε!' as result;
SELECT 'Αν βλέπεις "✅ ΣΩΣΤΟ" ή "✅" στα αποτελέσματα, η διόρθωση είναι επιτυχής!' as note;

