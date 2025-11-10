-- ═══════════════════════════════════════════════════════════════════════════════
-- ΕΝΕΡΓΟΠΟΙΗΣΗ ΕΒΔΟΜΑΔΙΑΙΑΣ ΑΝΑΝΕΩΣΗΣ PILATES
-- Για: Χρήστος ΣΑΛΤΣΙΔΗΣ (cde3259d-17c7-4076-9bc7-31f5fa4a44a3)
-- 
-- Αυτό το script θα ρυθμίσει τον χρήστη να παίρνει:
-- +1 μάθημα Pilates κάθε 7 ημέρες αυτόματα
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_user_id UUID := 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3';
    v_user_name TEXT;
    v_pilates_membership_id UUID;
    v_pilates_package_id UUID;
    v_ultimate_medium_package_id UUID;
    v_membership_exists BOOLEAN := false;
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '🔄 ΕΝΕΡΓΟΠΟΙΗΣΗ ΕΒΔΟΜΑΔΙΑΙΑΣ ΑΝΑΝΕΩΣΗΣ PILATES';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    
    -- Βρες το όνομα
    SELECT first_name || ' ' || last_name INTO v_user_name
    FROM user_profiles WHERE user_id = v_user_id;
    
    RAISE NOTICE 'Χρήστης: %', v_user_name;
    RAISE NOTICE '';
    
    -- Βρες τα packages
    SELECT id INTO v_pilates_package_id
    FROM membership_packages WHERE name = 'Pilates' LIMIT 1;
    
    SELECT id INTO v_ultimate_medium_package_id
    FROM membership_packages WHERE name = 'Ultimate Medium' LIMIT 1;
    
    -- Έλεγχος: Έχει ήδη Pilates membership;
    SELECT EXISTS(
        SELECT 1 FROM memberships m
        JOIN membership_packages mp ON m.package_id = mp.id
        WHERE m.user_id = v_user_id
          AND m.is_active = true
          AND mp.name ILIKE '%pilates%'
    ) INTO v_membership_exists;
    
    IF v_membership_exists THEN
        RAISE NOTICE '✅ Ο χρήστης έχει ήδη Pilates membership';
    ELSE
        RAISE NOTICE '⚠️  Ο χρήστης ΔΕΝ έχει Pilates membership';
        RAISE NOTICE '📝 Δημιουργία Pilates membership...';
        
        -- Δημιούργησε Pilates membership (1 χρόνος)
        INSERT INTO memberships (
            id,
            user_id,
            package_id,
            start_date,
            end_date,
            is_active,
            expires_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            v_user_id,
            COALESCE(v_pilates_package_id, v_ultimate_medium_package_id),
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '365 days',
            true,
            (CURRENT_DATE + INTERVAL '365 days')::timestamp + INTERVAL '23:59:59',
            NOW(),
            NOW()
        ) RETURNING id INTO v_pilates_membership_id;
        
        RAISE NOTICE '✅ Pilates membership δημιουργήθηκε!';
        RAISE NOTICE '   • Membership ID: %', v_pilates_membership_id;
        RAISE NOTICE '   • Διάρκεια: 1 χρόνος (έως %)', (CURRENT_DATE + INTERVAL '365 days');
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ ΟΛΟΚΛΗΡΩΘΗΚΕ!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📋 ΓΙΑ ΑΥΤΟΜΑΤΗ ΕΒΔΟΜΑΔΙΑΙΑ ΑΝΑΝΕΩΣΗ:';
    RAISE NOTICE '';
    RAISE NOTICE '1️⃣ Ενεργοποίηση Feature Flag:';
    RAISE NOTICE '   • Admin Panel → Weekly Refill Manager';
    RAISE NOTICE '   • Άνοιξε το "Feature Flag Control"';
    RAISE NOTICE '   • Ενεργοποίησε: "Enable Weekly Pilates Refill"';
    RAISE NOTICE '';
    RAISE NOTICE '2️⃣ Τρέξε Manual Refill:';
    RAISE NOTICE '   • Στο Weekly Refill Manager';
    RAISE NOTICE '   • Πάτησε "Process Weekly Refills"';
    RAISE NOTICE '   • Αυτό θα δημιουργήσει το refill history';
    RAISE NOTICE '';
    RAISE NOTICE '3️⃣ Αυτόματο Refill:';
    RAISE NOTICE '   • Από εκεί και πέρα, κάθε 7 ημέρες';
    RAISE NOTICE '   • Ο χρήστης θα παίρνει +1 μάθημα αυτόματα';
    RAISE NOTICE '   • (Αν το feature flag είναι ενεργό)';
    RAISE NOTICE '';
    
END $$;

-- Επαλήθευση
SELECT 
    '✅ MEMBERSHIPS' as info,
    m.id,
    mp.name as package_name,
    m.start_date,
    m.end_date,
    m.is_active
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.user_id = 'cde3259d-17c7-4076-9bc7-31f5fa4a44a3'
ORDER BY m.created_at DESC;

