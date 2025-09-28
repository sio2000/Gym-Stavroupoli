-- =====================================================
-- ROLLBACK SCRIPT FOR KETTLEBELL POINTS RESET
-- =====================================================
-- Αυτό το script επαναφέρει τα Kettlebell Points από το backup
-- Χρησιμοποιήστε το ΜΟΝΟ αν χρειάζεται να επαναφέρετε τα δεδομένα
-- =====================================================

-- ΒΗΜΑ 1: Εύρεση του πιο πρόσφατου backup table
-- =====================================================
DO $$
DECLARE
    backup_table_name TEXT;
    backup_count INTEGER;
BEGIN
    -- Βρίσκουμε το πιο πρόσφατο backup table
    SELECT table_name INTO backup_table_name
    FROM information_schema.tables 
    WHERE table_name LIKE 'user_kettlebell_points_backup_%'
    ORDER BY table_name DESC 
    LIMIT 1;
    
    IF backup_table_name IS NULL THEN
        RAISE EXCEPTION 'No backup table found! Cannot rollback.';
    END IF;
    
    -- Έλεγχος ότι το backup table έχει δεδομένα
    EXECUTE format('SELECT COUNT(*) FROM %I', backup_table_name) INTO backup_count;
    
    IF backup_count = 0 THEN
        RAISE EXCEPTION 'Backup table % is empty! Cannot rollback.', backup_table_name;
    END IF;
    
    RAISE NOTICE 'Found backup table: % with % records', backup_table_name, backup_count;
END $$;

-- ΒΗΜΑ 2: Επαναφορά των δεδομένων
-- =====================================================
DO $$
DECLARE
    backup_table_name TEXT;
    restored_count INTEGER;
BEGIN
    -- Βρίσκουμε το backup table
    SELECT table_name INTO backup_table_name
    FROM information_schema.tables 
    WHERE table_name LIKE 'user_kettlebell_points_backup_%'
    ORDER BY table_name DESC 
    LIMIT 1;
    
    -- Επαναφορά των δεδομένων
    EXECUTE format('INSERT INTO user_kettlebell_points SELECT id, user_id, points, program_id, created_at, created_by FROM %I', backup_table_name);
    
    -- Έλεγχος ότι τα δεδομένα επαναφέρθηκαν
    SELECT COUNT(*) INTO restored_count FROM user_kettlebell_points;
    
    RAISE NOTICE 'Successfully restored % records from backup table: %', restored_count, backup_table_name;
    
    -- Εγγραφή σε log table (αν υπάρχει)
    BEGIN
        EXECUTE format('INSERT INTO admin_operations_log (operation_type, details, created_at, created_by) VALUES (%L, %L, NOW(), %L)',
                      'KETTLEBELL_POINTS_ROLLBACK',
                      'Restored ' || restored_count || ' records from backup table: ' || backup_table_name,
                      'system');
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Admin log table not found - skipping log entry';
    END;
END $$;

-- ΒΗΜΑ 3: Επαλήθευση της επαναφοράς
-- =====================================================
SELECT 
    'AFTER ROLLBACK' as status,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    COALESCE(SUM(points), 0) as total_points,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM user_kettlebell_points;

-- ΒΗΜΑ 4: Συνολική επιβεβαίωση
-- =====================================================
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM user_kettlebell_points) > 0 
        THEN '✅ SUCCESS: Kettlebell points restored from backup'
        ELSE '❌ ERROR: No records found after rollback'
    END as rollback_status;
