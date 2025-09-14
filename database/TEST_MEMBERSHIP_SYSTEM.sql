-- TEST MEMBERSHIP SYSTEM - Δοκιμή του νέου συστήματος συνδρομών
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Έλεγχος δομής πινάκων
SELECT 'Step 1: Checking table structure' as step;

-- Έλεγχος πίνακα memberships
SELECT 
    'memberships' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'memberships';

-- Έλεγχος πίνακα membership_requests
SELECT 
    'membership_requests' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'membership_requests';

-- Έλεγχος πίνακα membership_packages
SELECT 
    'membership_packages' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'membership_packages';

-- 2. Έλεγχος δεδομένων
SELECT 'Step 2: Checking data' as step;

-- Έλεγχος πακέτων συνδρομών
SELECT 'Membership Packages:' as info, COUNT(*) as count FROM membership_packages;
SELECT 'Membership Package Durations:' as info, COUNT(*) as count FROM membership_package_durations;
SELECT 'Membership Requests:' as info, COUNT(*) as count FROM membership_requests;
SELECT 'Memberships:' as info, COUNT(*) as count FROM memberships;

-- 3. Έλεγχος RLS policies
SELECT 'Step 3: Checking RLS policies' as step;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('memberships', 'membership_requests', 'membership_packages', 'membership_package_durations')
ORDER BY tablename, policyname;

-- 4. Δοκιμή functions
SELECT 'Step 4: Testing functions' as step;

-- Δοκιμή function λήξης
SELECT 'Testing expire_memberships function...' as test;
SELECT expire_memberships();

-- Δοκιμή function στατιστικών
SELECT 'Testing get_membership_stats function...' as test;
SELECT * FROM get_membership_stats();

-- 5. Δοκιμή view
SELECT 'Step 5: Testing membership_overview view' as step;
SELECT COUNT(*) as overview_count FROM membership_overview;

-- 6. Δοκιμή ερωτημάτων
SELECT 'Step 6: Testing queries' as step;

-- Έλεγχος ενεργών συνδρομών
SELECT 
    'Active memberships:' as info,
    COUNT(*) as count
FROM memberships 
WHERE status = 'active';

-- Έλεγχος συνδρομών που λήγουν σύντομα
SELECT 
    'Memberships expiring soon:' as info,
    COUNT(*) as count
FROM memberships 
WHERE status = 'active' 
AND end_date <= CURRENT_DATE + INTERVAL '7 days';

-- 7. Δοκιμή εισαγωγής test δεδομένων
SELECT 'Step 7: Testing data insertion' as step;

-- Δημιουργία test membership (αν υπάρχουν δεδομένα)
DO $$
DECLARE
    test_user_id UUID;
    test_package_id UUID;
    test_membership_id UUID;
BEGIN
    -- Βρίσκουμε έναν χρήστη
    SELECT user_id INTO test_user_id FROM user_profiles LIMIT 1;
    
    -- Βρίσκουμε ένα πακέτο
    SELECT id INTO test_package_id FROM membership_packages LIMIT 1;
    
    IF test_user_id IS NOT NULL AND test_package_id IS NOT NULL THEN
        -- Δημιουργούμε test membership που λήγει σε 30 ημέρες
        INSERT INTO memberships (user_id, package_id, duration_type, start_date, end_date, status)
        VALUES (
            test_user_id, 
            test_package_id, 
            'month', 
            CURRENT_DATE, 
            CURRENT_DATE + INTERVAL '30 days', 
            'active'
        )
        RETURNING id INTO test_membership_id;
        
        RAISE NOTICE 'Test membership created with ID: %', test_membership_id;
        
        -- Δοκιμάζουμε την function λήξης
        PERFORM check_and_expire_memberships();
        
        -- Ελέγχουμε αν το test membership είναι ακόμα ενεργό
        IF EXISTS (SELECT 1 FROM memberships WHERE id = test_membership_id AND status = 'active') THEN
            RAISE NOTICE 'Test membership is still active (as expected)';
        ELSE
            RAISE NOTICE 'Test membership was expired unexpectedly';
        END IF;
        
        -- Καθαρισμός test data
        DELETE FROM memberships WHERE id = test_membership_id;
        RAISE NOTICE 'Test membership cleaned up';
    ELSE
        RAISE NOTICE 'No test data available - skipping test insertion';
    END IF;
END $$;

-- 8. Έλεγχος indexes
SELECT 'Step 8: Checking indexes' as step;

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('memberships', 'membership_requests', 'membership_packages', 'membership_package_durations')
ORDER BY tablename, indexname;

-- 9. Τελικός έλεγχος
SELECT 'Step 9: Final verification' as step;

-- Έλεγχος ότι όλα τα απαραίτητα στοιχεία υπάρχουν
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships') 
        THEN '✓ memberships table exists'
        ELSE '✗ memberships table missing'
    END as check_memberships_table,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_requests') 
        THEN '✓ membership_requests table exists'
        ELSE '✗ membership_requests table missing'
    END as check_requests_table,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'expire_memberships') 
        THEN '✓ expire_memberships function exists'
        ELSE '✗ expire_memberships function missing'
    END as check_expire_function,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'membership_overview') 
        THEN '✓ membership_overview view exists'
        ELSE '✗ membership_overview view missing'
    END as check_overview_view;
