-- ═══════════════════════════════════════════════════════════════════════════════
-- ΔΙΟΡΘΩΣΗ PILATES ΓΙΑ: Χρήστος ΣΑΛΤΣΙΔΗΣ
-- User ID: cde3259d-17c7-4076-9bc7-31f5fa4a44a3
-- Email: xrhstossaltsidhs@gmail.com
-- 
-- ΣΤΟΧΟΣ: Να δώσουμε 1 μάθημα Pilates την εβδομάδα
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_user_id UUID := 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3';
    v_user_name TEXT;
    v_pilates_package_id UUID;
    v_existing_deposit_id UUID;
    v_existing_deposit_remaining INTEGER;
    v_new_deposit_id UUID;
BEGIN
    -- Βρες το όνομα του χρήστη
    SELECT first_name || ' ' || last_name INTO v_user_name
    FROM user_profiles
    WHERE user_id = v_user_id;
    
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '🔧 ΔΙΟΡΘΩΣΗ PILATES DEPOSITS';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Χρήστης: %', v_user_name;
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE '';
    
    -- Βρες το Pilates package
    SELECT id INTO v_pilates_package_id
    FROM membership_packages
    WHERE name = 'Pilates'
    LIMIT 1;
    
    IF v_pilates_package_id IS NULL THEN
        -- Αν δεν υπάρχει "Pilates" package, χρησιμοποίησε οποιοδήποτε
        SELECT id INTO v_pilates_package_id
        FROM membership_packages
        WHERE name ILIKE '%pilates%'
        LIMIT 1;
    END IF;
    
    RAISE NOTICE '✅ Pilates Package ID: %', v_pilates_package_id;
    
    -- Έλεγχος για υπάρχον ενεργό deposit
    SELECT id, deposit_remaining 
    INTO v_existing_deposit_id, v_existing_deposit_remaining
    FROM pilates_deposits
    WHERE user_id = v_user_id
      AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_existing_deposit_id IS NOT NULL THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  ΒΡΕΘΗΚΕ ΥΠΑΡΧΟΝ DEPOSIT:';
        RAISE NOTICE '   • Deposit ID: %', v_existing_deposit_id;
        RAISE NOTICE '   • Τρέχοντα μαθήματα: %', v_existing_deposit_remaining;
        RAISE NOTICE '';
        RAISE NOTICE '🔄 ΕΝΗΜΕΡΩΣΗ: Θέτω τα μαθήματα σε 1...';
        
        -- Ενημέρωσε το υπάρχον deposit
        UPDATE pilates_deposits
        SET 
            deposit_remaining = 1,
            is_active = true,
            updated_at = NOW()
        WHERE id = v_existing_deposit_id;
        
        RAISE NOTICE '✅ ΕΠΙΤΥΧΙΑ! Το deposit ενημερώθηκε σε 1 μάθημα!';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '📝 ΔΕΝ ΒΡΕΘΗΚΕ ΕΝΕΡΓΟ DEPOSIT';
        RAISE NOTICE '🔄 ΔΗΜΙΟΥΡΓΙΑ: Δημιουργώ νέο deposit με 1 μάθημα...';
        
        -- Δημιούργησε νέο deposit
        INSERT INTO pilates_deposits (
            user_id,
            package_id,
            deposit_remaining,
            credited_at,
            expires_at,
            is_active,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            v_pilates_package_id,
            1, -- 1 μάθημα
            NOW(),
            NOW() + INTERVAL '1 year', -- Λήγει σε 1 χρόνο
            true,
            NULL, -- System created
            NOW(),
            NOW()
        ) RETURNING id INTO v_new_deposit_id;
        
        RAISE NOTICE '✅ ΕΠΙΤΥΧΙΑ! Νέο deposit δημιουργήθηκε!';
        RAISE NOTICE '   • Deposit ID: %', v_new_deposit_id;
        RAISE NOTICE '   • Μαθήματα: 1';
        RAISE NOTICE '   • Λήγει: % (1 χρόνος)', (NOW() + INTERVAL '1 year')::date;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ ✅ ✅ ΟΛΟΚΛΗΡΩΘΗΚΕ!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📋 ΕΠΟΜΕΝΑ ΒΗΜΑΤΑ:';
    RAISE NOTICE '   1. Ο χρήστης έχει ΤΩΡΑ 1 μάθημα Pilates διαθέσιμο';
    RAISE NOTICE '   2. Για ΑΥΤΟΜΑΤΗ εβδομαδιαία ανανέωση (+1 κάθε 7 ημέρες):';
    RAISE NOTICE '      → Πήγαινε στο Admin Panel';
    RAISE NOTICE '      → Weekly Refill Manager tab';
    RAISE NOTICE '      → Ενεργοποίησε το feature flag';
    RAISE NOTICE '      → Τρέξε Manual Refill για αυτόν τον χρήστη';
    RAISE NOTICE '';
    
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ΕΠΑΛΗΘΕΥΣΗ: Έλεγχος του deposit
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
    '✅ ΕΠΑΛΗΘΕΥΣΗ - PILATES DEPOSIT' as info,
    pd.id as deposit_id,
    up.first_name || ' ' || up.last_name as user_name,
    up.email,
    pd.deposit_remaining as available_lessons,
    pd.is_active,
    pd.credited_at,
    pd.expires_at,
    'Ο χρήστης έχει τώρα ' || pd.deposit_remaining || ' διαθέσιμο μάθημα Pilates!' as status
FROM pilates_deposits pd
JOIN user_profiles up ON pd.user_id = up.user_id
WHERE pd.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
  AND pd.is_active = true
ORDER BY pd.created_at DESC
LIMIT 1;

