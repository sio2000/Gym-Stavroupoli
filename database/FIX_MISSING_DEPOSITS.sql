-- ═══════════════════════════════════════════════════════════════════════════════
-- ΔΙΟΡΘΩΣΗ: Χρήστες χωρίς Pilates Deposit
-- ═══════════════════════════════════════════════════════════════════════════════
-- Δημιουργεί pilates deposits για Ultimate χρήστες που δεν έχουν
-- ═══════════════════════════════════════════════════════════════════════════════

-- ΒΗΜΑ 1: Βρες τους χρήστες χωρίς deposit
SELECT 'ΒΗΜΑ 1: Χρήστες χωρίς Pilates Deposit' as step;

SELECT 
    up.first_name,
    up.last_name,
    m.source_package_name,
    m.user_id,
    'ΧΡΕΙΑΖΕΤΑΙ DEPOSIT' as status
FROM public.memberships m
JOIN public.user_profiles up ON m.user_id = up.user_id
LEFT JOIN public.pilates_deposits pd ON m.user_id = pd.user_id AND pd.is_active = true
WHERE m.source_package_name IN ('Ultimate', 'Ultimate Medium')
AND m.is_active = true
AND m.start_date <= CURRENT_DATE
AND m.end_date >= CURRENT_DATE
AND pd.id IS NULL
ORDER BY up.last_name;

-- ΒΗΜΑ 2: Δημιούργησε deposits για αυτούς
SELECT 'ΒΗΜΑ 2: Δημιουργία deposits για χρήστες χωρίς deposit...' as step;

INSERT INTO public.pilates_deposits (
    user_id,
    package_id,
    deposit_remaining,
    expires_at,
    is_active,
    created_by
)
SELECT 
    m.user_id,
    mp.id as package_id,
    CASE 
        WHEN m.source_package_name = 'Ultimate' THEN 3
        WHEN m.source_package_name = 'Ultimate Medium' THEN 1
        ELSE 0
    END as deposit_remaining,
    m.end_date + INTERVAL '23:59:59' as expires_at,
    true as is_active,
    NULL as created_by
FROM public.memberships m
JOIN public.membership_packages mp ON mp.name = 'Pilates'
LEFT JOIN public.pilates_deposits pd ON m.user_id = pd.user_id AND pd.is_active = true
WHERE m.source_package_name IN ('Ultimate', 'Ultimate Medium')
AND m.is_active = true
AND m.start_date <= CURRENT_DATE
AND m.end_date >= CURRENT_DATE
AND pd.id IS NULL;

-- ΒΗΜΑ 3: Επαλήθευση
SELECT 'ΒΗΜΑ 3: Επαλήθευση - Τώρα όλοι έχουν deposits' as step;

SELECT 
    up.first_name,
    up.last_name,
    m.source_package_name,
    pd.deposit_remaining,
    CASE 
        WHEN m.source_package_name = 'Ultimate' THEN 3
        WHEN m.source_package_name = 'Ultimate Medium' THEN 1
        ELSE 0
    END as expected,
    CASE 
        WHEN pd.deposit_remaining = CASE 
            WHEN m.source_package_name = 'Ultimate' THEN 3
            WHEN m.source_package_name = 'Ultimate Medium' THEN 1
            ELSE 0
        END THEN '✅ ΣΩΣΤΟ'
        ELSE '⚠️ ΧΡΕΙΑΖΕΤΑΙ REFILL'
    END as status
FROM public.memberships m
JOIN public.user_profiles up ON m.user_id = up.user_id
LEFT JOIN public.pilates_deposits pd ON m.user_id = pd.user_id AND pd.is_active = true
WHERE m.source_package_name IN ('Ultimate', 'Ultimate Medium')
AND m.is_active = true
AND m.start_date <= CURRENT_DATE
AND m.end_date >= CURRENT_DATE
ORDER BY up.last_name;

-- ΒΗΜΑ 4: Τρέξε ξανά το refill
SELECT 'ΒΗΜΑ 4: Τρέξε ξανά το refill για να φτιάξει τα deposits...' as step;

SELECT * FROM public.process_weekly_pilates_refills();

-- ΒΗΜΑ 5: Τελικός έλεγχος
SELECT 'ΒΗΜΑ 5: Τελικός έλεγχος' as step;

SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN pd.deposit_remaining = 
        CASE 
            WHEN m.source_package_name = 'Ultimate' THEN 3
            WHEN m.source_package_name = 'Ultimate Medium' THEN 1
            ELSE 0
        END THEN 1 ELSE 0 END) as correct_deposits,
    SUM(CASE WHEN pd.deposit_remaining != 
        CASE 
            WHEN m.source_package_name = 'Ultimate' THEN 3
            WHEN m.source_package_name = 'Ultimate Medium' THEN 1
            ELSE 0
        END THEN 1 ELSE 0 END) as wrong_deposits
FROM public.memberships m
JOIN public.user_profiles up ON m.user_id = up.user_id
LEFT JOIN public.pilates_deposits pd ON m.user_id = pd.user_id AND pd.is_active = true
WHERE m.source_package_name IN ('Ultimate', 'Ultimate Medium')
AND m.is_active = true
AND m.start_date <= CURRENT_DATE
AND m.end_date >= CURRENT_DATE;

SELECT '✅ ΟΛΟΚΛΗΡΩΘΗΚΕ!' as final_message;

