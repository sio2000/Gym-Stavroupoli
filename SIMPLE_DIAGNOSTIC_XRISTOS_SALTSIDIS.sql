-- ═══════════════════════════════════════════════════════════════════════════════
-- ΑΠΛΗ ΔΙΑΓΝΩΣΗ ΓΙΑ: Χρήστος ΣΑΛΤΣΙΔΗΣ
-- User ID: cde3259d-17c7-4076-9bc7-31f5fa4a44a3
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1️⃣ ΒΑΣΙΚΕΣ ΠΛΗΡΟΦΟΡΙΕΣ
SELECT 
    '1️⃣ ΧΡΗΣΤΗΣ' as section,
    up.user_id,
    up.first_name || ' ' || up.last_name as full_name,
    up.email,
    up.phone
FROM user_profiles up
WHERE up.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3';

-- 2️⃣ ΕΝΕΡΓΕΣ ΣΥΝΔΡΟΜΕΣ
SELECT 
    '2️⃣ MEMBERSHIPS' as section,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    m.is_active,
    (CURRENT_DATE - m.start_date)::integer as days_active,
    ((CURRENT_DATE - m.start_date)::integer / 7) as weeks_active,
    CASE 
        WHEN m.end_date < CURRENT_DATE THEN '❌ ΛΗΞΕ'
        WHEN m.is_active = false THEN '❌ ΑΝΕΝΕΡΓΗ'
        ELSE '✅ ΕΝΕΡΓΗ'
    END as status
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
ORDER BY m.created_at DESC;

-- 3️⃣ PILATES DEPOSITS
SELECT 
    '3️⃣ PILATES DEPOSITS' as section,
    pd.id,
    pd.deposit_remaining as lessons_available,
    pd.is_active,
    pd.credited_at,
    pd.expires_at,
    mp.name as package_name,
    CASE 
        WHEN pd.expires_at < NOW() THEN '❌ ΛΗΞΕ'
        WHEN pd.is_active = false THEN '❌ ΑΝΕΝΕΡΓΟ'
        WHEN pd.deposit_remaining = 0 THEN '⚠️ 0 ΜΑΘΗΜΑΤΑ'
        ELSE '✅ ΕΝΕΡΓΟ (' || pd.deposit_remaining || ' μαθήματα)'
    END as deposit_status
FROM pilates_deposits pd
LEFT JOIN membership_packages mp ON pd.package_id = mp.id
WHERE pd.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
ORDER BY pd.created_at DESC;

-- 4️⃣ WEEKLY REFILLS
SELECT 
    '4️⃣ WEEKLY REFILLS' as section,
    uwr.package_name,
    uwr.activation_date,
    uwr.refill_date,
    uwr.refill_week_number as week_num,
    uwr.previous_deposit_amount as before,
    uwr.new_deposit_amount as after,
    (uwr.new_deposit_amount - uwr.previous_deposit_amount) as added,
    uwr.created_at
FROM ultimate_weekly_refills uwr
WHERE uwr.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
ORDER BY uwr.refill_date DESC
LIMIT 10;

-- 5️⃣ FEATURE FLAGS
SELECT 
    '5️⃣ FEATURE FLAGS' as section,
    ff.name,
    ff.is_enabled,
    CASE 
        WHEN ff.is_enabled = true THEN '✅ ΕΝΕΡΓΟ'
        ELSE '❌ ΑΝΕΝΕΡΓΟ'
    END as status
FROM feature_flags ff
WHERE ff.name IN ('ultimate_weekly_pilates_refill', 'weekly_pilates_refill_enabled');

-- 6️⃣ PILATES BOOKINGS (τελευταία 10)
SELECT 
    '6️⃣ PILATES BOOKINGS' as section,
    pss.date as lesson_date,
    pss.start_time,
    pb.status,
    pb.booking_date
FROM pilates_bookings pb
JOIN pilates_schedule_slots pss ON pb.slot_id = pss.id
WHERE pb.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
ORDER BY pss.date DESC, pss.start_time DESC
LIMIT 10;

-- 🎯 ΔΙΑΓΝΩΣΗ - ΕΛΕΓΧΟΣ ΓΙΑ ULTIMATE
SELECT 
    '🎯 ΔΙΑΓΝΩΣΗ' as section,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM memberships m
            JOIN membership_packages mp ON m.package_id = mp.id
            WHERE m.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
              AND m.is_active = true
              AND (mp.name = 'Ultimate' OR mp.name = 'Ultimate Medium')
        ) THEN '✅ Έχει Ultimate membership'
        ELSE '❌ ΔΕΝ έχει Ultimate membership'
    END as has_ultimate,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pilates_deposits pd
            WHERE pd.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
              AND pd.is_active = true
              AND pd.deposit_remaining > 0
        ) THEN '✅ Έχει ενεργά Pilates μαθήματα'
        ELSE '❌ ΔΕΝ έχει ενεργά Pilates μαθήματα'
    END as has_active_deposits,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM ultimate_weekly_refills uwr
            WHERE uwr.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
        ) THEN '✅ Έχει weekly refills στο ιστορικό'
        ELSE '❌ ΔΕΝ έχει κανένα weekly refill'
    END as has_refills,
    
    (SELECT COUNT(*) FROM memberships m 
     WHERE m.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3' 
       AND m.is_active = true) as active_memberships_count,
       
    (SELECT COUNT(*) FROM pilates_deposits pd 
     WHERE pd.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3') as total_deposits_count,
     
    (SELECT COUNT(*) FROM ultimate_weekly_refills uwr 
     WHERE uwr.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3') as total_refills_count;

-- 💡 ΛΥΣΗ
SELECT 
    '💡 ΤΙ ΠΡΕΠΕΙ ΝΑ ΚΑΝΕΙΣ' as action,
    CASE 
        -- Έλεγχος 1: Έχει Ultimate;
        WHEN NOT EXISTS (
            SELECT 1 FROM memberships m
            JOIN membership_packages mp ON m.package_id = mp.id
            WHERE m.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
              AND m.is_active = true
              AND (mp.name = 'Ultimate' OR mp.name = 'Ultimate Medium')
        ) THEN 'ΠΡΟΒΛΗΜΑ #1: Ο χρήστης ΔΕΝ έχει Ultimate ή Ultimate Medium membership. ΛΥΣΗ: Δώστε του Ultimate (500€ - 3 μαθήματα/εβδομάδα) ή Ultimate Medium (400€ - 1 μάθημα/εβδομάδα).'
        
        -- Έλεγχος 2: Έχει deposits;
        WHEN NOT EXISTS (
            SELECT 1 FROM pilates_deposits pd
            WHERE pd.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
              AND pd.is_active = true
        ) THEN 'ΠΡΟΒΛΗΜΑ #2: Ο χρήστης έχει Ultimate αλλά δεν έχει Pilates deposits. ΛΥΣΗ: Admin Panel → Weekly Refill Manager → Τρέξε Manual Refill ή χρησιμοποίησε το Error Fixing tab για να δώσεις μαθήματα.'
        
        -- Έλεγχος 3: Έχει refills;
        WHEN NOT EXISTS (
            SELECT 1 FROM ultimate_weekly_refills uwr
            WHERE uwr.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
        ) THEN 'ΠΡΟΒΛΗΜΑ #3: Το weekly refill σύστημα δεν έχει τρέξει ποτέ για αυτόν τον χρήστη. ΛΥΣΗ: Admin Panel → Weekly Refill Manager → Process Weekly Refills.'
        
        -- Όλα καλά;
        ELSE '✅ Το σύστημα λειτουργεί! Ίσως έχουν εξαντληθεί τα μαθήματα από bookings. Ελέγξτε το ιστορικό κρατήσεων.'
    END as solution;

