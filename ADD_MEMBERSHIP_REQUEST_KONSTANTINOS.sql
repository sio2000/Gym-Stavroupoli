-- ═══════════════════════════════════════════════════════════════════════════════
-- ΠΡΟΣΘΗΚΗ ΑΙΤΗΜΑΤΟΣ ΣΥΝΔΡΟΜΗΣ FREE GYM 1 ΕΤΟΣ
-- Για: Κωνσταντίνος Χρυσοστόμου (kwnstantinos.xrysos@gmail.com)
-- Τύπος: Free Gym - 1 Έτος (365 ημέρες)
-- Ημερομηνία: 3 Νοεμβρίου 2025
-- ═══════════════════════════════════════════════════════════════════════════════

-- ΒΗΜΑ 1: Έλεγχος ότι υπάρχει ο χρήστης
DO $$
DECLARE
    v_user_id UUID;
    v_package_id UUID;
    v_duration_id UUID;
    v_price DECIMAL(10,2);
    v_existing_request_id UUID;
BEGIN
    -- Βρες τον χρήστη με το email
    SELECT user_id INTO v_user_id
    FROM user_profiles
    WHERE email = 'kwnstantinos.xrysos@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'ΣΦΑΛΜΑ: Δεν βρέθηκε χρήστης με email kwnstantinos.xrysos@gmail.com';
    END IF;
    
    RAISE NOTICE '✅ Βρέθηκε χρήστης με user_id: %', v_user_id;
    
    -- Βρες το Free Gym package
    SELECT id INTO v_package_id
    FROM membership_packages
    WHERE name = 'Free Gym' AND is_active = true;
    
    IF v_package_id IS NULL THEN
        RAISE EXCEPTION 'ΣΦΑΛΜΑ: Δεν βρέθηκε ενεργό Free Gym package';
    END IF;
    
    RAISE NOTICE '✅ Βρέθηκε Free Gym package με id: %', v_package_id;
    
    -- Βρες το duration για 1 έτος (year) και το price του
    SELECT id, price INTO v_duration_id, v_price
    FROM membership_package_durations
    WHERE package_id = v_package_id 
      AND duration_type = 'year'
      AND is_active = true;
    
    IF v_duration_id IS NULL THEN
        RAISE EXCEPTION 'ΣΦΑΛΜΑ: Δεν βρέθηκε duration type "year" για Free Gym package';
    END IF;
    
    RAISE NOTICE '✅ Βρέθηκε duration "year" με price: €%', v_price;
    
    -- Έλεγχος αν υπάρχει ήδη pending αίτημα για αυτόν τον χρήστη για Free Gym 1 έτος
    SELECT id INTO v_existing_request_id
    FROM membership_requests
    WHERE user_id = v_user_id
      AND package_id = v_package_id
      AND duration_type = 'year'
      AND status = 'pending';
    
    IF v_existing_request_id IS NOT NULL THEN
        RAISE NOTICE '⚠️  Υπάρχει ήδη pending αίτημα με id: %', v_existing_request_id;
        RAISE NOTICE '⚠️  Δεν θα δημιουργηθεί νέο αίτημα για να αποφευχθεί duplication';
        RETURN;
    END IF;
    
    -- Δημιουργία νέου αιτήματος συνδρομής
    INSERT INTO membership_requests (
        user_id,
        package_id,
        duration_type,
        requested_price,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_package_id,
        'year',
        v_price,
        'pending',
        NOW(),
        NOW()
    ) RETURNING id INTO v_existing_request_id;
    
    RAISE NOTICE '✅ ✅ ✅ ΕΠΙΤΥΧΙΑ! Δημιουργήθηκε αίτημα συνδρομής με id: %', v_existing_request_id;
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE 'ΣΤΟΙΧΕΙΑ ΑΙΤΗΜΑΤΟΣ:';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE 'Χρήστης: Κωνσταντίνος Χρυσοστόμου';
    RAISE NOTICE 'Email: kwnstantinos.xrysos@gmail.com';
    RAISE NOTICE 'Πακέτο: Free Gym';
    RAISE NOTICE 'Διάρκεια: 1 Έτος (365 ημέρες)';
    RAISE NOTICE 'Τιμή: €%', v_price;
    RAISE NOTICE 'Κατάσταση: Pending (Αναμονή έγκρισης)';
    RAISE NOTICE 'Request ID: %', v_existing_request_id;
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Το αίτημα είναι τώρα ορατό στο Admin Panel στην καρτέλα "Αιτήματα Συνδρομών"';
    RAISE NOTICE '✅ Ο admin μπορεί να το εγκρίνει από εκεί';
    
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ΕΠΑΛΗΘΕΥΣΗ: Έλεγχος του νέου αιτήματος
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
    '✅ ΕΠΑΛΗΘΕΥΣΗ ΑΙΤΗΜΑΤΟΣ' as info,
    mr.id as request_id,
    up.first_name || ' ' || up.last_name as full_name,
    up.email,
    up.phone,
    mp.name as package_name,
    mr.duration_type,
    mr.requested_price,
    mr.status,
    mr.created_at,
    'Το αίτημα δημιουργήθηκε επιτυχώς!' as message
FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
JOIN membership_packages mp ON mr.package_id = mp.id
WHERE up.email = 'kwnstantinos.xrysos@gmail.com'
  AND mp.name = 'Free Gym'
  AND mr.duration_type = 'year'
ORDER BY mr.created_at DESC
LIMIT 1;

