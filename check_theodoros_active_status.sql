-- CHECK THEODOROS ACTIVE STATUS
-- Simple check if THEODOROS MICHALAKIS has active subscriptions

-- Basic user info
SELECT 'THEODOROS MICHALAKIS - BASIC INFO:' as info;
SELECT 
    user_id,
    first_name,
    last_name,
    email,
    phone,
    role,
    created_at
FROM user_profiles 
WHERE user_id = '43fa81be-1846-4b64-b136-adca986576ba';

-- Check active memberships
SELECT 'ACTIVE MEMBERSHIPS:' as info;
SELECT 
    m.id as membership_id,
    mp.name as package_name,
    m.status,
    m.start_date,
    m.end_date,
    (m.end_date - CURRENT_DATE) as days_remaining,
    CASE 
        WHEN m.status = 'active' AND m.end_date >= CURRENT_DATE THEN '✅ ΕΝΕΡΓΟΣ'
        WHEN m.status = 'active' AND m.end_date < CURRENT_DATE THEN '⚠️ ΛΗΓΜΕΝΟΣ (αλλά status=active)'
        WHEN m.status != 'active' THEN '❌ ΜΗ ΕΝΕΡΓΟΣ'
        ELSE '📝 ΑΛΛΟ'
    END as active_status
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
ORDER BY m.created_at DESC;

-- Check pending requests
SELECT 'PENDING REQUESTS:' as info;
SELECT 
    mr.id as request_id,
    mp.name as package_name,
    mr.duration_type,
    mr.requested_price,
    mr.status,
    mr.created_at
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mr.user_id = '43fa81be-1846-4b64-b136-adca986576ba'
ORDER BY mr.created_at DESC;

-- Summary
SELECT 'SUMMARY:' as summary;
SELECT 
    CASE 
        WHEN COUNT(CASE WHEN m.status = 'active' AND m.end_date >= CURRENT_DATE THEN 1 END) > 0 THEN
            '✅ ΕΝΕΡΓΟΣ: Έχει ' || COUNT(CASE WHEN m.status = 'active' AND m.end_date >= CURRENT_DATE THEN 1 END) || ' ενεργή(ές) συνδρομή(ές)'
        WHEN COUNT(CASE WHEN mr.status = 'pending' THEN 1 END) > 0 THEN
            '🔄 ΕΚΚΡΕΜΕΙ: Έχει ' || COUNT(CASE WHEN mr.status = 'pending' THEN 1 END) || ' εκκρεμή(ές) αίτημα(τα)'
        ELSE
            '❌ ΜΗ ΕΝΕΡΓΟΣ: Δεν έχει ενεργές συνδρομές ή εκκρεμή αιτήματα'
    END as status
FROM user_profiles up
LEFT JOIN memberships m ON up.user_id = m.user_id
LEFT JOIN membership_requests mr ON up.user_id = mr.user_id
WHERE up.user_id = '43fa81be-1846-4b64-b136-adca986576ba';
