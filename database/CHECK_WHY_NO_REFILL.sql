-- ═══════════════════════════════════════════════════════════════════════════════
-- ΕΛΕΓΧΟΣ: Γιατί δεν βρίσκει χρήστες για refill;
-- ═══════════════════════════════════════════════════════════════════════════════

-- ΒΗΜΑ 1: Έλεγχος feature flag
SELECT 'ΒΗΜΑ 1: Feature flag status' as step;

SELECT 
    name,
    is_enabled,
    description
FROM public.feature_flags
WHERE name = 'weekly_pilates_refill_enabled';

-- ΒΗΜΑ 2: Έλεγχος ενεργών Ultimate χρηστών
SELECT 'ΒΗΜΑ 2: Ενεργοί Ultimate/Ultimate Medium χρήστες' as step;

SELECT 
    up.first_name,
    up.last_name,
    m.source_package_name,
    mp.name as package_name,
    m.is_active,
    m.start_date,
    m.end_date,
    pd.deposit_remaining,
    CASE 
        WHEN m.start_date <= CURRENT_DATE AND m.end_date >= CURRENT_DATE THEN '✅ Ενεργό'
        ELSE '❌ Ανενεργό'
    END as membership_status
FROM public.memberships m
JOIN public.user_profiles up ON m.user_id = up.user_id
JOIN public.membership_packages mp ON m.package_id = mp.id
LEFT JOIN public.pilates_deposits pd ON m.user_id = pd.user_id AND pd.is_active = true
WHERE (
    m.source_package_name IN ('Ultimate', 'Ultimate Medium')
    OR mp.name IN ('Ultimate', 'Ultimate Medium')
)
AND m.is_active = true
ORDER BY up.last_name;

-- ΒΗΜΑ 3: Έλεγχος refills που έχουν γίνει σήμερα
SELECT 'ΒΗΜΑ 3: Refills σήμερα (' || CURRENT_DATE || ')' as step;

SELECT 
    uwr.user_id,
    up.first_name,
    up.last_name,
    uwr.package_name,
    uwr.refill_date,
    uwr.previous_deposit_amount,
    uwr.new_deposit_amount
FROM public.ultimate_weekly_refills uwr
JOIN public.user_profiles up ON uwr.user_id = up.user_id
WHERE uwr.refill_date = CURRENT_DATE
ORDER BY up.last_name;

-- ΒΗΜΑ 4: Δοκιμή manual refill (για debugging)
SELECT 'ΒΗΜΑ 4: Manual test - process_weekly_pilates_refills()' as step;

SELECT * FROM public.process_weekly_pilates_refills();

-- ΒΗΜΑ 5: Χρήστες που ΠΡΕΠΕΙ να λάβουν refill (χωρίς refill σήμερα)
SELECT 'ΒΗΜΑ 5: Χρήστες που πρέπει να λάβουν refill' as step;

SELECT 
    up.first_name,
    up.last_name,
    COALESCE(m.source_package_name, mp.name) as package_name,
    m.start_date,
    m.end_date,
    pd.deposit_remaining as current_deposit,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.ultimate_weekly_refills uwr
            WHERE uwr.user_id = m.user_id 
            AND uwr.refill_date = CURRENT_DATE
        ) THEN '✅ Έχει refill σήμερα'
        ELSE '❌ ΧΩΡΙΣ refill σήμερα'
    END as refill_status
FROM public.memberships m
JOIN public.user_profiles up ON m.user_id = up.user_id
JOIN public.membership_packages mp ON m.package_id = mp.id
LEFT JOIN public.pilates_deposits pd ON m.user_id = pd.user_id AND pd.is_active = true
WHERE (
    m.source_package_name IN ('Ultimate', 'Ultimate Medium')
    OR mp.name IN ('Ultimate', 'Ultimate Medium')
)
AND m.is_active = true
AND m.start_date <= CURRENT_DATE
AND m.end_date >= CURRENT_DATE
ORDER BY up.last_name;

