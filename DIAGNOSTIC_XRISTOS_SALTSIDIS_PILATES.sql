-- ═══════════════════════════════════════════════════════════════════════════════
-- ΔΙΑΓΝΩΣΤΙΚΟ ΕΛΕΓΧΟ ΓΙΑ ΧΡΗΣΤΟ: Χρήστος ΣΑΛΤΣΙΔΗΣ
-- Email: xrhstossaltsidhs@gmail.com
-- User ID: cde3259d-17c7-4076-9bc7-31f5fa4a44a3
-- 
-- ΣΚΟΠΟΣ: Να βρούμε γιατί δεν έχει Pilates μαθήματα ενώ πρέπει να παίρνει
--         +1 μάθημα κάθε 7 ημέρες
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- ΜΕΡΟΣ 1: ΒΑΣΙΚΕΣ ΠΛΗΡΟΦΟΡΙΕΣ ΧΡΗΣΤΗ
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT '📋 ΜΕΡΟΣ 1: ΒΑΣΙΚΕΣ ΠΛΗΡΟΦΟΡΙΕΣ ΧΡΗΣΤΗ' as section;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

SELECT 
    '✅ ΒΡΕΘΗΚΕ ΧΡΗΣΤΗΣ' as status,
    up.user_id,
    up.first_name || ' ' || up.last_name as full_name,
    up.email,
    up.phone,
    up.role,
    up.created_at as registration_date,
    up.referral_code
FROM user_profiles up
WHERE up.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3';

-- ═══════════════════════════════════════════════════════════════════════════════
-- ΜΕΡΟΣ 2: ΕΝΕΡΓΕΣ ΣΥΝΔΡΟΜΕΣ (MEMBERSHIPS)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT '🎯 ΜΕΡΟΣ 2: ΕΝΕΡΓΕΣ ΣΥΝΔΡΟΜΕΣ' as section;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

SELECT 
    m.id as membership_id,
    mp.name as package_name,
    mp.package_type,
    m.start_date,
    m.end_date,
    m.is_active,
    m.expires_at,
    m.source_package_name,
    m.created_at,
    CASE 
        WHEN m.end_date < CURRENT_DATE THEN '❌ ΛΗΞΕ'
        WHEN m.is_active = false THEN '❌ ΑΝΕΝΕΡΓΗ'
        ELSE '✅ ΕΝΕΡΓΗ'
    END as membership_status,
    (CURRENT_DATE - m.start_date)::integer as days_since_activation,
    ((CURRENT_DATE - m.start_date)::integer / 7) as weeks_since_activation
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
ORDER BY m.created_at DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ΜΕΡΟΣ 3: PILATES DEPOSITS (ΔΙΑΘΕΣΙΜΑ ΜΑΘΗΜΑΤΑ)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT '🎓 ΜΕΡΟΣ 3: PILATES DEPOSITS (Διαθέσιμα Μαθήματα)' as section;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ ΔΕΝ ΥΠΑΡΧΟΥΝ PILATES DEPOSITS'
        ELSE '✅ ΒΡΕΘΗΚΑΝ ' || COUNT(*)::text || ' DEPOSITS'
    END as deposit_status
FROM pilates_deposits pd
WHERE pd.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3';

SELECT 
    pd.id as deposit_id,
    pd.deposit_remaining as available_lessons,
    pd.is_active,
    pd.credited_at,
    pd.expires_at,
    pd.created_at,
    pd.updated_at,
    mp.name as package_name,
    CASE 
        WHEN pd.expires_at < NOW() THEN '❌ ΛΗΞΕ'
        WHEN pd.is_active = false THEN '❌ ΑΝΕΝΕΡΓΟ'
        WHEN pd.deposit_remaining = 0 THEN '⚠️ 0 ΜΑΘΗΜΑΤΑ'
        ELSE '✅ ΕΝΕΡΓΟ'
    END as deposit_status
FROM pilates_deposits pd
LEFT JOIN membership_packages mp ON pd.package_id = mp.id
WHERE pd.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
ORDER BY pd.created_at DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ΜΕΡΟΣ 4: WEEKLY REFILLS (ΕΒΔΟΜΑΔΙΑΙΑ ΑΝΑΝΕΩΣΗ ΜΑΘΗΜΑΤΩΝ)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT '🔄 ΜΕΡΟΣ 4: WEEKLY REFILLS (Εβδομαδιαία Ανανέωση)' as section;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ ΔΕΝ ΥΠΑΡΧΟΥΝ WEEKLY REFILLS - ΑΥΤΟ ΕΙΝΑΙ ΤΟ ΠΡΟΒΛΗΜΑ!'
        ELSE '✅ ΒΡΕΘΗΚΑΝ ' || COUNT(*)::text || ' REFILLS'
    END as refill_status
FROM ultimate_weekly_refills uwr
WHERE uwr.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3';

SELECT 
    uwr.id as refill_id,
    uwr.package_name,
    uwr.activation_date,
    uwr.refill_date,
    uwr.refill_week_number,
    uwr.target_deposit_amount,
    uwr.previous_deposit_amount,
    uwr.new_deposit_amount,
    uwr.created_at,
    CASE 
        WHEN uwr.new_deposit_amount > uwr.previous_deposit_amount 
        THEN '✅ ΠΡΟΣΘΕΘΗΚΑΝ ' || (uwr.new_deposit_amount - uwr.previous_deposit_amount)::text || ' ΜΑΘΗΜΑΤΑ'
        ELSE '⚠️ ΔΕΝ ΠΡΟΣΤΕΘΗΚΑΝ ΜΑΘΗΜΑΤΑ'
    END as refill_action
FROM ultimate_weekly_refills uwr
WHERE uwr.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
ORDER BY uwr.refill_date DESC
LIMIT 10;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ΜΕΡΟΣ 5: MEMBERSHIP REQUESTS (ΑΙΤΗΜΑΤΑ ΣΥΝΔΡΟΜΩΝ)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT '📝 ΜΕΡΟΣ 5: MEMBERSHIP REQUESTS (Αιτήματα Συνδρομών)' as section;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

SELECT 
    mr.id as request_id,
    mp.name as package_name,
    mr.duration_type,
    mr.requested_price,
    mr.status,
    mr.approved_at,
    mr.created_at,
    CASE 
        WHEN mr.status = 'approved' THEN '✅ ΕΓΚΡΙΘΗΚΕ'
        WHEN mr.status = 'pending' THEN '⏳ ΑΝΑΜΟΝΗ'
        WHEN mr.status = 'rejected' THEN '❌ ΑΠΟΡΡΙΦΘΗΚΕ'
        ELSE '❓ ΑΓΝΩΣΤΟ'
    END as request_status
FROM membership_requests mr
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mr.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
ORDER BY mr.created_at DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ΜΕΡΟΣ 6: PILATES BOOKINGS (ΚΛΕΙΣΜΕΝΑ ΜΑΘΗΜΑΤΑ)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT '📅 ΜΕΡΟΣ 6: PILATES BOOKINGS (Κλεισμένα Μαθήματα)' as section;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ ΔΕΝ ΥΠΑΡΧΟΥΝ ΚΛΕΙΣΜΕΝΑ ΜΑΘΗΜΑΤΑ'
        ELSE '✅ ΒΡΕΘΗΚΑΝ ' || COUNT(*)::text || ' BOOKINGS'
    END as bookings_status
FROM pilates_bookings pb
WHERE pb.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3';

SELECT 
    pb.id as booking_id,
    pss.date as lesson_date,
    pss.start_time,
    pss.end_time,
    pb.status,
    pb.booking_date,
    CASE 
        WHEN pb.status = 'confirmed' THEN '✅ ΕΠΙΒΕΒΑΙΩΜΕΝΟ'
        WHEN pb.status = 'cancelled' THEN '❌ ΑΚΥΡΩΜΕΝΟ'
        WHEN pb.status = 'completed' THEN '✅ ΟΛΟΚΛΗΡΩΘΗΚΕ'
        ELSE '❓ ΑΓΝΩΣΤΟ'
    END as booking_status
FROM pilates_bookings pb
JOIN pilates_schedule_slots pss ON pb.slot_id = pss.id
WHERE pb.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
ORDER BY pss.date DESC, pss.start_time DESC
LIMIT 20;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ΜΕΡΟΣ 7: FEATURE FLAGS (ΕΛΕΓΧΟΣ ΣΥΣΤΗΜΑΤΟΣ)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT '🚩 ΜΕΡΟΣ 7: FEATURE FLAGS (Έλεγχος Συστήματος)' as section;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

SELECT 
    ff.name as flag_name,
    ff.is_enabled,
    ff.description,
    ff.updated_at,
    CASE 
        WHEN ff.is_enabled = true THEN '✅ ΕΝΕΡΓΟ'
        ELSE '❌ ΑΝΕΝΕΡΓΟ - ΑΥΤΟ ΕΙΝΑΙ ΤΟ ΠΡΟΒΛΗΜΑ!'
    END as flag_status
FROM feature_flags ff
WHERE ff.name IN ('ultimate_weekly_pilates_refill', 'weekly_pilates_refill_enabled');

-- ═══════════════════════════════════════════════════════════════════════════════
-- ΜΕΡΟΣ 8: ΔΙΑΓΝΩΣΗ - ΕΛΕΓΧΟΣ ΓΙΑ ULTIMATE PACKAGES
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT '🔍 ΜΕΡΟΣ 8: ΔΙΑΓΝΩΣΗ - Έλεγχος για Ultimate Packages' as section;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

-- Έλεγχος αν ο χρήστης έχει Ultimate ή Ultimate Medium membership
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ Ο χρήστης ΔΕΝ ΕΧΕΙ Ultimate ή Ultimate Medium membership!'
        ELSE '✅ Ο χρήστης έχει ' || COUNT(*)::text || ' Ultimate membership(s)'
    END as ultimate_check,
    CASE 
        WHEN COUNT(*) = 0 THEN '💡 ΛΥΣΗ: Ο χρήστης πρέπει να έχει Ultimate (500€) ή Ultimate Medium (400€) για να παίρνει εβδομαδιαία Pilates μαθήματα!'
        ELSE ''
    END as solution
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
  AND m.is_active = true
  AND m.end_date >= CURRENT_DATE
  AND (mp.name = 'Ultimate' OR mp.name = 'Ultimate Medium');

-- ═══════════════════════════════════════════════════════════════════════════════
-- ΜΕΡΟΣ 9: ΣΥΝΟΛΙΚΗ ΔΙΑΓΝΩΣΗ - ΤΙ ΠΑΕΙ ΛΑΘΟΣ
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT '🎯 ΜΕΡΟΣ 9: ΣΥΝΟΛΙΚΗ ΔΙΑΓΝΩΣΗ' as section;
SELECT '═══════════════════════════════════════════════════════════════' as separator;

DO $$
DECLARE
    v_has_ultimate boolean;
    v_has_deposits boolean;
    v_has_refills boolean;
    v_feature_enabled boolean;
    v_membership_count integer;
    v_deposit_count integer;
    v_refill_count integer;
BEGIN
    -- Έλεγχος για Ultimate membership
    SELECT COUNT(*) > 0 INTO v_has_ultimate
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE m.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
      AND m.is_active = true
      AND (mp.name = 'Ultimate' OR mp.name = 'Ultimate Medium');
    
    SELECT COUNT(*) INTO v_membership_count
    FROM memberships m
    WHERE m.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
      AND m.is_active = true;
    
    -- Έλεγχος για deposits
    SELECT COUNT(*) > 0 INTO v_has_deposits
    FROM pilates_deposits pd
    WHERE pd.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
      AND pd.is_active = true;
    
    SELECT COUNT(*) INTO v_deposit_count
    FROM pilates_deposits pd
    WHERE pd.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3';
    
    -- Έλεγχος για refills
    SELECT COUNT(*) > 0 INTO v_has_refills
    FROM ultimate_weekly_refills uwr
    WHERE uwr.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3';
    
    SELECT COUNT(*) INTO v_refill_count
    FROM ultimate_weekly_refills uwr
    WHERE uwr.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3';
    
    -- Έλεγχος feature flag
    SELECT COALESCE(is_enabled, false) INTO v_feature_enabled
    FROM feature_flags
    WHERE name IN ('ultimate_weekly_pilates_refill', 'weekly_pilates_refill_enabled')
    LIMIT 1;
    
    -- Εκτύπωση διάγνωσης
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '🔍 ΑΝΑΛΥΤΙΚΗ ΔΙΑΓΝΩΣΗ ΓΙΑ: Χρήστος ΣΑΛΤΣΙΔΗΣ';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 ΚΑΤΑΣΤΑΣΗ ΣΥΣΤΗΜΑΤΟΣ:';
    RAISE NOTICE '  • Ενεργές συνδρομές: %', v_membership_count;
    RAISE NOTICE '  • Έχει Ultimate membership: %', CASE WHEN v_has_ultimate THEN '✅ ΝΑΙ' ELSE '❌ ΟΧΙ' END;
    RAISE NOTICE '  • Pilates deposits (σύνολο): %', v_deposit_count;
    RAISE NOTICE '  • Ενεργά deposits: %', CASE WHEN v_has_deposits THEN '✅ ΝΑΙ' ELSE '❌ ΟΧΙ' END;
    RAISE NOTICE '  • Weekly refills (σύνολο): %', v_refill_count;
    RAISE NOTICE '  • Feature flag enabled: %', CASE WHEN v_feature_enabled THEN '✅ ΝΑΙ' ELSE '❌ ΟΧΙ' END;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 ΔΙΑΓΝΩΣΗ:';
    
    IF NOT v_has_ultimate THEN
        RAISE NOTICE '  ❌ ΠΡΟΒΛΗΜΑ #1: Ο χρήστης ΔΕΝ έχει Ultimate ή Ultimate Medium membership';
        RAISE NOTICE '     💡 ΛΥΣΗ: Δώστε του Ultimate (500€) ή Ultimate Medium (400€) membership';
        RAISE NOTICE '     • Ultimate: 3 Pilates μαθήματα κάθε 7 ημέρες';
        RAISE NOTICE '     • Ultimate Medium: 1 Pilates μάθημα κάθε 7 ημέρες';
    ELSIF NOT v_has_deposits THEN
        RAISE NOTICE '  ❌ ΠΡΟΒΛΗΜΑ #2: Ο χρήστης έχει Ultimate αλλά δεν έχει Pilates deposits';
        RAISE NOTICE '     💡 ΛΥΣΗ: Τρέξτε manual refill από το Admin Panel ή δημιουργήστε deposit χειροκίνητα';
    ELSIF NOT v_feature_enabled THEN
        RAISE NOTICE '  ❌ ΠΡΟΒΛΗΜΑ #3: Το feature flag "ultimate_weekly_pilates_refill" είναι ΑΝΕΝΕΡΓΟ';
        RAISE NOTICE '     💡 ΛΥΣΗ: Ενεργοποιήστε το feature flag από το Admin Panel';
    ELSIF NOT v_has_refills THEN
        RAISE NOTICE '  ⚠️  ΠΡΟΒΛΗΜΑ #4: Ο χρήστης έχει Ultimate αλλά δεν έχουν γίνει weekly refills';
        RAISE NOTICE '     💡 ΛΥΣΗ: Τρέξτε manual refill από το Admin Panel → Weekly Refill Manager';
    ELSE
        RAISE NOTICE '  ✅ ΟΛΑ ΚΑΛΑ: Το σύστημα φαίνεται να λειτουργεί κανονικά';
        RAISE NOTICE '     💡 Ελέγξτε αν τα deposits έχουν εξαντληθεί από bookings';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    
END $$;

