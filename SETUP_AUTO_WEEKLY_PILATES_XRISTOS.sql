-- ═══════════════════════════════════════════════════════════════════════════════
-- ΡΥΘΜΙΣΗ ΑΥΤΟΜΑΤΗΣ ΕΒΔΟΜΑΔΙΑΙΑΣ ΑΝΑΝΕΩΣΗΣ PILATES
-- Χρήστης: Χρήστος ΣΑΛΤΣΙΔΗΣ
-- User ID: cde3259d-17c7-4076-9bc7-31f5fa4a44a3
-- 
-- ΣΤΟΧΟΣ: Από εδώ και πέρα να παίρνει +1 Pilates μάθημα κάθε 7 ημέρες
-- ΠΡΟΣΟΧΗ: ΔΕΝ θα αγγίξουμε το υπάρχον deposit (1 μάθημα)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_user_id UUID := 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3';
    v_user_name TEXT;
    v_ultimate_medium_package_id UUID;
    v_pilates_package_id UUID;
    v_free_gym_package_id UUID;
    v_existing_ultimate_membership BOOLEAN := false;
    v_pilates_membership_id UUID;
    v_free_gym_membership_id UUID;
    v_feature_flag_exists BOOLEAN := false;
    v_start_date DATE := CURRENT_DATE;
    v_end_date DATE := CURRENT_DATE + INTERVAL '365 days';
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '🔄 ΡΥΘΜΙΣΗ ΑΥΤΟΜΑΤΗΣ ΕΒΔΟΜΑΔΙΑΙΑΣ ΑΝΑΝΕΩΣΗΣ PILATES';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    
    -- 1. Βρες το όνομα χρήστη
    SELECT first_name || ' ' || last_name INTO v_user_name
    FROM user_profiles WHERE user_id = v_user_id;
    
    RAISE NOTICE 'Χρήστης: %', v_user_name;
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE '';
    
    -- 2. Βρες τα package IDs
    SELECT id INTO v_ultimate_medium_package_id
    FROM membership_packages 
    WHERE name = 'Ultimate Medium' AND is_active = true
    LIMIT 1;
    
    SELECT id INTO v_pilates_package_id
    FROM membership_packages 
    WHERE name = 'Pilates' AND is_active = true
    LIMIT 1;
    
    SELECT id INTO v_free_gym_package_id
    FROM membership_packages 
    WHERE name = 'Free Gym' AND is_active = true
    LIMIT 1;
    
    IF v_ultimate_medium_package_id IS NULL THEN
        RAISE EXCEPTION 'ΣΦΑΛΜΑ: Δεν βρέθηκε το Ultimate Medium package!';
    END IF;
    
    RAISE NOTICE '✅ Ultimate Medium Package ID: %', v_ultimate_medium_package_id;
    RAISE NOTICE '✅ Pilates Package ID: %', COALESCE(v_pilates_package_id::text, 'N/A');
    RAISE NOTICE '✅ Free Gym Package ID: %', COALESCE(v_free_gym_package_id::text, 'N/A');
    RAISE NOTICE '';
    
    -- 3. Έλεγχος: Έχει ήδη Ultimate ή Ultimate Medium membership;
    SELECT EXISTS(
        SELECT 1 FROM memberships m
        JOIN membership_packages mp ON m.package_id = mp.id
        WHERE m.user_id = v_user_id
          AND m.is_active = true
          AND (mp.name = 'Ultimate' OR mp.name = 'Ultimate Medium')
    ) INTO v_existing_ultimate_membership;
    
    IF v_existing_ultimate_membership THEN
        RAISE NOTICE '✅ Ο χρήστης έχει ήδη Ultimate/Ultimate Medium membership';
        RAISE NOTICE '   → ΔΕΝ χρειάζεται να δημιουργηθεί νέο';
    ELSE
        RAISE NOTICE '⚠️  Ο χρήστης ΔΕΝ έχει Ultimate/Ultimate Medium membership';
        RAISE NOTICE '';
        RAISE NOTICE '📝 ΔΗΜΙΟΥΡΓΙΑ DUAL MEMBERSHIPS (Pilates + Free Gym)...';
        
        -- Δημιουργία Pilates Membership
        IF v_pilates_package_id IS NOT NULL THEN
            INSERT INTO memberships (
                id,
                user_id,
                package_id,
                start_date,
                end_date,
                is_active,
                expires_at,
                created_at,
                updated_at,
                source_package_name
            ) VALUES (
                gen_random_uuid(),
                v_user_id,
                v_pilates_package_id,
                v_start_date,
                v_end_date,
                true,
                v_end_date::timestamp + INTERVAL '23:59:59',
                NOW(),
                NOW(),
                'Ultimate Medium'
            ) RETURNING id INTO v_pilates_membership_id;
            
            RAISE NOTICE '   ✅ Pilates membership δημιουργήθηκε';
            RAISE NOTICE '      • ID: %', v_pilates_membership_id;
        END IF;
        
        -- Δημιουργία Free Gym Membership
        IF v_free_gym_package_id IS NOT NULL THEN
            INSERT INTO memberships (
                id,
                user_id,
                package_id,
                start_date,
                end_date,
                is_active,
                expires_at,
                created_at,
                updated_at,
                source_package_name
            ) VALUES (
                gen_random_uuid(),
                v_user_id,
                v_free_gym_package_id,
                v_start_date,
                v_end_date,
                true,
                v_end_date::timestamp + INTERVAL '23:59:59',
                NOW(),
                NOW(),
                'Ultimate Medium'
            ) RETURNING id INTO v_free_gym_membership_id;
            
            RAISE NOTICE '   ✅ Free Gym membership δημιουργήθηκε';
            RAISE NOTICE '      • ID: %', v_free_gym_membership_id;
        END IF;
        
        RAISE NOTICE '   ✅ Διάρκεια: % έως %', v_start_date, v_end_date;
        RAISE NOTICE '   ✅ Source Package: Ultimate Medium (1 μάθημα/εβδομάδα)';
    END IF;
    
    RAISE NOTICE '';
    
    -- 4. Ενεργοποίηση Feature Flag
    SELECT EXISTS(
        SELECT 1 FROM feature_flags 
        WHERE name IN ('weekly_pilates_refill_enabled', 'ultimate_weekly_pilates_refill')
    ) INTO v_feature_flag_exists;
    
    IF v_feature_flag_exists THEN
        RAISE NOTICE '🚩 Feature Flag υπάρχει ήδη';
        
        UPDATE feature_flags 
        SET 
            is_enabled = true,
            updated_at = NOW()
        WHERE name IN ('weekly_pilates_refill_enabled', 'ultimate_weekly_pilates_refill');
        
        RAISE NOTICE '   ✅ Feature flag ΕΝΕΡΓΟΠΟΙΗΘΗΚΕ!';
    ELSE
        RAISE NOTICE '🚩 Δημιουργία Feature Flag...';
        
        INSERT INTO feature_flags (name, is_enabled, description, created_at, updated_at)
        VALUES (
            'weekly_pilates_refill_enabled',
            true,
            'Enable weekly Pilates deposit refills for Ultimate packages',
            NOW(),
            NOW()
        )
        ON CONFLICT (name) DO UPDATE SET
            is_enabled = true,
            updated_at = NOW();
        
        RAISE NOTICE '   ✅ Feature flag ΔΗΜΙΟΥΡΓΗΘΗΚΕ και ΕΝΕΡΓΟΠΟΙΗΘΗΚΕ!';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ ✅ ✅ ΟΛΟΚΛΗΡΩΘΗΚΕ ΕΠΙΤΥΧΩΣ!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📋 ΤΙ ΕΓΙΝΕ:';
    RAISE NOTICE '   1. ✅ Ο χρήστης έχει τώρα Ultimate Medium setup';
    RAISE NOTICE '   2. ✅ Το feature flag είναι ΕΝΕΡΓΟ';
    RAISE NOTICE '   3. ✅ Το υπάρχον deposit (1 μάθημα) ΔΕΝ αγγίχτηκε';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 ΠΩΣ ΛΕΙΤΟΥΡΓΕΙ:';
    RAISE NOTICE '   • Κάθε 7 ημέρες από σήμερα (%)', v_start_date;
    RAISE NOTICE '   • Το σύστημα θα ελέγχει αυτόματα';
    RAISE NOTICE '   • Αν deposit < 1 → θα το φέρνει σε 1';
    RAISE NOTICE '   • Αν deposit = 0 → θα το φέρνει σε 1';
    RAISE NOTICE '   • Αν deposit = 1 → θα το αφήσει στο 1 (ΠΡΟΣΟΧΗ!)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  ΣΗΜΑΝΤΙΚΟ:';
    RAISE NOTICE '   • Το weekly refill κάνει TOP-UP στο 1, όχι +1';
    RAISE NOTICE '   • Δηλαδή: Αν έχει 0 → γίνεται 1';
    RAISE NOTICE '   • Αλλά: Αν έχει ήδη 1 → μένει 1';
    RAISE NOTICE '   • Για να μαζεύει μαθήματα, χρειάζεται Ultimate (3/εβδομάδα)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 ΕΠΟΜΕΝΟ ΒΗΜΑ:';
    RAISE NOTICE '   Τρέξε το function για να ξεκινήσει το refill history:';
    RAISE NOTICE '   SELECT * FROM process_weekly_pilates_refills();';
    RAISE NOTICE '';
    
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ΤΡΕΞΕ ΤΟ WEEKLY REFILL FUNCTION ΓΙΑ ΝΑ ΞΕΚΙΝΗΣΕΙ ΤΟ HISTORY
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'Τρέχει το weekly refill function...' as step;

SELECT * FROM process_weekly_pilates_refills();

-- ═══════════════════════════════════════════════════════════════════════════════
-- ΕΠΑΛΗΘΕΥΣΗ: Έλεγχος όλων των ρυθμίσεων
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Memberships
SELECT 
    '1️⃣ MEMBERSHIPS' as check_type,
    m.id,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    m.is_active,
    m.source_package_name
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
  AND m.is_active = true
ORDER BY m.created_at DESC;

-- 2. Pilates Deposit
SELECT 
    '2️⃣ PILATES DEPOSIT' as check_type,
    pd.id,
    pd.deposit_remaining as available_lessons,
    pd.is_active,
    pd.credited_at,
    pd.expires_at
FROM pilates_deposits pd
WHERE pd.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
  AND pd.is_active = true
ORDER BY pd.created_at DESC
LIMIT 1;

-- 3. Weekly Refills History
SELECT 
    '3️⃣ WEEKLY REFILLS HISTORY' as check_type,
    uwr.refill_date,
    uwr.refill_week_number,
    uwr.package_name,
    uwr.previous_deposit_amount,
    uwr.new_deposit_amount,
    (uwr.new_deposit_amount - uwr.previous_deposit_amount) as added
FROM ultimate_weekly_refills uwr
WHERE uwr.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
ORDER BY uwr.refill_date DESC
LIMIT 5;

-- 4. Feature Flag
SELECT 
    '4️⃣ FEATURE FLAG' as check_type,
    ff.name,
    ff.is_enabled,
    CASE WHEN ff.is_enabled THEN '✅ ΕΝΕΡΓΟ' ELSE '❌ ΑΝΕΝΕΡΓΟ' END as status
FROM feature_flags ff
WHERE ff.name IN ('weekly_pilates_refill_enabled', 'ultimate_weekly_pilates_refill');

-- 5. Τελική Κατάσταση
SELECT 
    '5️⃣ ΤΕΛΙΚΗ ΚΑΤΑΣΤΑΣΗ' as summary,
    up.first_name || ' ' || up.last_name as user_name,
    up.email,
    pd.deposit_remaining as current_lessons,
    CASE 
        WHEN m_count.cnt > 0 THEN '✅ Έχει Ultimate setup'
        ELSE '❌ Δεν έχει Ultimate setup'
    END as has_ultimate,
    CASE 
        WHEN ff.is_enabled THEN '✅ Auto refill ΕΝΕΡΓΟ'
        ELSE '❌ Auto refill ΑΝΕΝΕΡΓΟ'
    END as auto_refill_status,
    '🎉 ΟΛΑ ΕΤΟΙΜΑ! Θα παίρνει +1 μάθημα κάθε 7 ημέρες (top-up σε 1)' as final_message
FROM user_profiles up
LEFT JOIN pilates_deposits pd ON up.user_id = pd.user_id AND pd.is_active = true
LEFT JOIN (
    SELECT user_id, COUNT(*) as cnt
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE m.is_active = true
      AND m.source_package_name IN ('Ultimate', 'Ultimate Medium')
    GROUP BY user_id
) m_count ON up.user_id = m_count.user_id
LEFT JOIN feature_flags ff ON ff.name IN ('weekly_pilates_refill_enabled', 'ultimate_weekly_pilates_refill')
WHERE up.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
LIMIT 1;

