-- =====================================================
-- SAFE KETTLEBELL POINTS RESET SCRIPT
-- =====================================================
-- Αυτό το script μηδενίζει μόνο τα Kettlebell Points
-- ΔΕΝ αγγίζει κανένα άλλο δεδομένο (cash, memberships, κλπ)
-- =====================================================

-- ΒΗΜΑ 1: Δημιουργία backup πριν από οποιαδήποτε αλλαγή
-- =====================================================
DO $$
DECLARE
    backup_table_name TEXT;
    timestamp_str TEXT;
    kettlebell_count INTEGER;
    kettlebell_total INTEGER;
BEGIN
    -- Δημιουργία timestamp για το backup
    timestamp_str := to_char(now(), 'YYYYMMDD_HH24MISS');
    backup_table_name := 'user_kettlebell_points_backup_' || timestamp_str;
    
    -- Δημιουργία backup table
    EXECUTE format('CREATE TABLE %I AS SELECT * FROM user_kettlebell_points', backup_table_name);
    
    -- Προσθήκη backup timestamp
    EXECUTE format('ALTER TABLE %I ADD COLUMN backup_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()', backup_table_name);
    
    -- Έλεγχος backup
    EXECUTE format('SELECT COUNT(*), COALESCE(SUM(points), 0) FROM %I', backup_table_name) 
    INTO kettlebell_count, kettlebell_total;
    
    RAISE NOTICE 'Backup created: %', backup_table_name;
    RAISE NOTICE 'Backed up % records with total % points', kettlebell_count, kettlebell_total;
    
    -- Εγγραφή σε log table (αν υπάρχει)
    BEGIN
        EXECUTE format('INSERT INTO admin_operations_log (operation_type, details, created_at, created_by) VALUES (%L, %L, NOW(), %L)',
                      'KETTLEBELL_POINTS_RESET_BACKUP',
                      'Created backup table: ' || backup_table_name || ' with ' || kettlebell_count || ' records',
                      'system');
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Admin log table not found - skipping log entry';
    END;
END $$;

-- ΒΗΜΑ 2: Έλεγχος τρέχουσας κατάστασης
-- =====================================================
SELECT 
    'BEFORE RESET' as status,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    COALESCE(SUM(points), 0) as total_points,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM user_kettlebell_points;

-- ΒΗΜΑ 3: Μηδενισμός των Kettlebell Points
-- =====================================================
-- Προσοχή: Αυτό θα διαγράψει ΟΛΑ τα records από τον πίνακα user_kettlebell_points
-- Αλλά θα κρατήσει το backup για επαναφορά αν χρειαστεί

DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    -- Διαγραφή όλων των records
    DELETE FROM user_kettlebell_points;
    
    -- Έλεγχος ότι όλα διαγράφηκαν
    SELECT COUNT(*) INTO remaining_count FROM user_kettlebell_points;
    
    IF remaining_count > 0 THEN
        RAISE EXCEPTION 'FAILED: Some records still exist after deletion';
    END IF;
    
    RAISE NOTICE 'SUCCESS: All kettlebell points records deleted';
END $$;

-- ΒΗΜΑ 4: Επαλήθευση αποτελέσματος
-- =====================================================
SELECT 
    'AFTER RESET' as status,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    COALESCE(SUM(points), 0) as total_points
FROM user_kettlebell_points;

-- ΒΗΜΑ 5: Συνολική επιβεβαίωση
-- =====================================================
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM user_kettlebell_points) = 0 
        THEN '✅ SUCCESS: All kettlebell points reset to zero'
        ELSE '❌ WARNING: Some records still exist'
    END as final_status;

-- ΒΗΜΑ 6: Πληροφορίες για rollback
-- =====================================================
DO $$
DECLARE
    backup_table_name TEXT;
BEGIN
    -- Βρίσκουμε το πιο πρόσφατο backup table
    SELECT table_name INTO backup_table_name
    FROM information_schema.tables 
    WHERE table_name LIKE 'user_kettlebell_points_backup_%'
    ORDER BY table_name DESC 
    LIMIT 1;
    
    IF backup_table_name IS NOT NULL THEN
        RAISE NOTICE '========================================';
        RAISE NOTICE 'ROLLBACK INSTRUCTIONS:';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'To restore data, run:';
        RAISE NOTICE '';
        RAISE NOTICE 'BEGIN;';
        RAISE NOTICE 'INSERT INTO user_kettlebell_points SELECT id, user_id, points, program_id, created_at, created_by FROM %;', backup_table_name;
        RAISE NOTICE 'COMMIT;';
        RAISE NOTICE '';
        RAISE NOTICE 'Backup table: %', backup_table_name;
        RAISE NOTICE '========================================';
    ELSE
        RAISE WARNING 'No backup table found!';
    END IF;
END $$;
