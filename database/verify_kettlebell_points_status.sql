-- =====================================================
-- KETTLEBELL POINTS STATUS VERIFICATION SCRIPT
-- =====================================================
-- Αυτό το script ελέγχει την τρέχουσα κατάσταση των Kettlebell Points
-- Χρησιμοποιήστε το πριν και μετά από το reset
-- =====================================================

-- ΒΗΜΑ 1: Τρέχουσα κατάσταση των Kettlebell Points
-- =====================================================
SELECT 
    'CURRENT STATUS' as check_type,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    COALESCE(SUM(points), 0) as total_points,
    COALESCE(AVG(points), 0) as avg_points_per_record,
    MIN(points) as min_points,
    MAX(points) as max_points,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM user_kettlebell_points;

-- ΒΗΜΑ 2: Top 10 χρήστες με τα περισσότερα points
-- =====================================================
SELECT 
    'TOP USERS' as check_type,
    up.user_id,
    COALESCE(up.first_name, '') || ' ' || COALESCE(up.last_name, '') as user_name,
    up.email,
    COALESCE(SUM(ukp.points), 0) as total_points,
    COUNT(ukp.id) as records_count
FROM user_profiles up
LEFT JOIN user_kettlebell_points ukp ON up.user_id = ukp.user_id
GROUP BY up.user_id, up.first_name, up.last_name, up.email
HAVING COALESCE(SUM(ukp.points), 0) > 0
ORDER BY total_points DESC
LIMIT 10;

-- ΒΗΜΑ 3: Έλεγχος backup tables
-- =====================================================
SELECT 
    'BACKUP TABLES' as check_type,
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as table_size
FROM information_schema.tables 
WHERE table_name LIKE 'user_kettlebell_points_backup_%'
ORDER BY table_name DESC;

-- ΒΗΜΑ 4: Σύνοψη ανά ημερομηνία δημιουργίας
-- =====================================================
SELECT 
    'BY DATE' as check_type,
    DATE(created_at) as creation_date,
    COUNT(*) as records_count,
    COUNT(DISTINCT user_id) as unique_users,
    COALESCE(SUM(points), 0) as total_points
FROM user_kettlebell_points
GROUP BY DATE(created_at)
ORDER BY creation_date DESC;

-- ΒΗΜΑ 5: Έλεγχος εφαρμογής (αν τα points εμφανίζονται σωστά)
-- =====================================================
-- Αυτό το query μιμείται την λογική της εφαρμογής
SELECT 
    'APPLICATION VIEW' as check_type,
    ukp.user_id,
    COALESCE(up.first_name, '') || ' ' || COALESCE(up.last_name, '') as user_name,
    COALESCE(SUM(ukp.points), 0) as total_points,
    json_agg(
        json_build_object(
            'id', ukp.id,
            'points', ukp.points,
            'program_id', ukp.program_id,
            'created_at', ukp.created_at
        ) ORDER BY ukp.created_at DESC
    ) as points_history
FROM user_profiles up
LEFT JOIN user_kettlebell_points ukp ON up.user_id = ukp.user_id
GROUP BY ukp.user_id, up.first_name, up.last_name
HAVING COALESCE(SUM(ukp.points), 0) > 0
ORDER BY total_points DESC
LIMIT 5;

-- ΒΗΜΑ 6: Συνολική επιβεβαίωση
-- =====================================================
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM user_kettlebell_points) = 0 
        THEN '✅ SYSTEM RESET: No kettlebell points found'
        WHEN (SELECT COUNT(*) FROM user_kettlebell_points) > 0 
        THEN '⚠️  ACTIVE SYSTEM: Kettlebell points exist'
        ELSE '❌ ERROR: Unknown state'
    END as system_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name LIKE 'user_kettlebell_points_backup_%')
        THEN '✅ BACKUP AVAILABLE: Backup tables found'
        ELSE '❌ NO BACKUP: No backup tables found'
    END as backup_status;
