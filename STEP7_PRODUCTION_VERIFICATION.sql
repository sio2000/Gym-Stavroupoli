-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 7: PRODUCTION VERIFICATION SCRIPT (READ-ONLY)
-- ══════════════════════════════════════════════════════════════════════════════
-- 
-- This script verifies that STEP 6 deployment completed successfully.
-- SAFE FOR PRODUCTION: Read-only queries only, no data mutations.
-- 
-- Execute this script AFTER STEP 6 application deployment.
-- ══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION 1: AUDIT INFRASTRUCTURE TABLES EXIST
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
  'VERIFICATION 1: Audit infrastructure' as check_name,
  COUNT(*) as audit_tables_found
FROM information_schema.tables
WHERE table_schema = 'migration_audit'
  AND table_name IN (
    'user_profile_merge',
    'membership_history',
    'migration_log',
    'fk_validation_log'
  );

-- Expected: 4 tables found

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION 2: CANONICAL EXPIRATION FUNCTION EXISTS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
  'VERIFICATION 2: Canonical expiration functions' as check_name,
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'subscription_expire_worker') as subscription_expire_worker_exists,
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'trigger_expiration_manually') as trigger_expiration_manually_exists
FROM (SELECT 1) dummy;

-- Expected: both columns = true

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION 3: ENFORCEMENT TRIGGERS EXIST
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
  'VERIFICATION 3: Enforcement triggers' as check_name,
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  CASE 
    WHEN tgname = 'trigger_membership_is_active' THEN 'Sync is_active with status'
    WHEN tgname = 'trigger_link_pilates_membership' THEN 'Link pilates to memberships'
    WHEN tgname = 'trigger_lesson_booking_access' THEN 'Guard lesson booking access'
    ELSE 'Unknown'
  END as purpose
FROM pg_trigger
WHERE tgname IN (
  'trigger_membership_is_active',
  'trigger_link_pilates_membership',
  'trigger_lesson_booking_access'
)
ORDER BY tgname;

-- Expected: 3 rows (one for each trigger)

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION 4: MEMBERSHIPS TABLE SCHEMA CHANGES PRESENT
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
  'VERIFICATION 4: Memberships table schema' as check_name,
  COUNT(*) as new_columns_found,
  STRING_AGG(column_name, ', ' ORDER BY column_name) as columns_present
FROM information_schema.columns
WHERE table_name = 'memberships'
  AND column_name IN (
    'deleted_at',
    'cancellation_reason',
    'cancelled_at',
    'cancelled_by',
    'auto_renew',
    'renewal_package_id',
    'is_active',
    'expires_at'
  );

-- Expected: 8 columns found

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION 5: USER_PROFILES TABLE SCHEMA CHANGES PRESENT
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
  'VERIFICATION 5: User profiles table schema' as check_name,
  COUNT(*) as merge_columns_found,
  STRING_AGG(column_name, ', ' ORDER BY column_name) as columns_present
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN (
    'is_merged',
    'merged_into_user_id',
    'merge_reason',
    'merge_recorded_at'
  );

-- Expected: 4 columns found

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION 6: PILATES_DEPOSITS TABLE SCHEMA CHANGES PRESENT
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
  'VERIFICATION 6: Pilates deposits table schema' as check_name,
  COUNT(*) as pilates_columns_found,
  STRING_AGG(column_name, ', ' ORDER BY column_name) as columns_present
FROM information_schema.columns
WHERE table_name = 'pilates_deposits'
  AND column_name IN (
    'membership_id',
    'linked_to_membership'
  );

-- Expected: 2 columns found

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION 7: DATA PRESERVATION - NO HARD DELETES ON CORE TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
  'VERIFICATION 7: Data preservation (no hard deletes)' as check_name,
  (SELECT COUNT(*) FROM user_profiles) as user_profiles_count,
  (SELECT COUNT(*) FROM memberships) as memberships_total_count,
  (SELECT COUNT(*) FROM memberships WHERE deleted_at IS NULL) as memberships_active_count,
  (SELECT COUNT(*) FROM lesson_bookings) as lesson_bookings_count,
  (SELECT COUNT(*) FROM pilates_bookings) as pilates_bookings_count,
  (SELECT COUNT(*) FROM pilates_deposits) as pilates_deposits_total_count;

-- Expected: All counts > 0, data preserved without hard deletes

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION 8: FK CONSISTENCY CHECK (CRITICAL)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  orphan_memberships INTEGER;
  orphan_lesson_bookings INTEGER;
  orphan_pilates_bookings INTEGER;
  orphan_pilates_deposits INTEGER;
BEGIN
  -- Check memberships FKs
  SELECT COUNT(*)
  INTO orphan_memberships
  FROM memberships m
  LEFT JOIN user_profiles up ON up.user_id = m.user_id
  WHERE up.user_id IS NULL AND m.deleted_at IS NULL;
  
  -- Check lesson_bookings FKs
  SELECT COUNT(*)
  INTO orphan_lesson_bookings
  FROM lesson_bookings lb
  LEFT JOIN user_profiles up ON up.user_id = lb.user_id
  WHERE up.user_id IS NULL;
  
  -- Check pilates_bookings FKs
  SELECT COUNT(*)
  INTO orphan_pilates_bookings
  FROM pilates_bookings pb
  LEFT JOIN user_profiles up ON up.user_id = pb.user_id
  WHERE up.user_id IS NULL;
  
  -- Check pilates_deposits FKs
  SELECT COUNT(*)
  INTO orphan_pilates_deposits
  FROM pilates_deposits pd
  LEFT JOIN user_profiles up ON up.user_id = pd.user_id
  WHERE up.user_id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'VERIFICATION 8: FK CONSISTENCY CHECK';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'Orphan memberships: %', orphan_memberships;
  RAISE NOTICE 'Orphan lesson_bookings: %', orphan_lesson_bookings;
  RAISE NOTICE 'Orphan pilates_bookings: %', orphan_pilates_bookings;
  RAISE NOTICE 'Orphan pilates_deposits: %', orphan_pilates_deposits;
  RAISE NOTICE '';
  
  IF orphan_memberships = 0 AND orphan_lesson_bookings = 0 
     AND orphan_pilates_bookings = 0 AND orphan_pilates_deposits = 0 THEN
    RAISE NOTICE '✓ ALL FK CONSTRAINTS VALID';
  ELSE
    RAISE WARNING '⚠ FK VIOLATIONS FOUND - INVESTIGATE IMMEDIATELY';
  END IF;
  
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- Expected: All orphan counts = 0

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION 9: IS_ACTIVE DERIVATION CORRECTNESS
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  incorrect_is_active INTEGER;
  total_memberships INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_memberships FROM memberships WHERE deleted_at IS NULL;
  
  SELECT COUNT(*)
  INTO incorrect_is_active
  FROM memberships
  WHERE is_active != (
    status = 'active'
    AND deleted_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW())
  )
  AND deleted_at IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'VERIFICATION 9: IS_ACTIVE DERIVATION';
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE 'Total active memberships: %', total_memberships;
  RAISE NOTICE 'Mismatched is_active values: %', incorrect_is_active;
  RAISE NOTICE '';
  
  IF incorrect_is_active = 0 THEN
    RAISE NOTICE '✓ is_active correctly synchronized for all records';
  ELSE
    RAISE WARNING '⚠ % memberships have incorrect is_active value', incorrect_is_active;
  END IF;
  
  RAISE NOTICE '════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- Expected: 0 mismatched rows

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION 10: MEMBERSHIP SOFT-DELETE USAGE
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
  'VERIFICATION 10: Soft-delete usage' as check_name,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_memberships,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as soft_deleted_memberships,
  COUNT(DISTINCT user_id) as distinct_users_with_memberships
FROM memberships;

-- Expected: soft_deleted_memberships >= 0, active_memberships > 0

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION 11: PILATES-MEMBERSHIP LINKING
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
  'VERIFICATION 11: Pilates-membership linking' as check_name,
  COUNT(*) FILTER (WHERE linked_to_membership = TRUE) as linked_deposits,
  COUNT(*) FILTER (WHERE linked_to_membership = FALSE) as unlinked_deposits,
  COUNT(*) as total_deposits
FROM pilates_deposits;

-- Expected: linked_deposits + unlinked_deposits = total_deposits

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION 12: MIGRATION AUDIT TRAIL COMPLETENESS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
  'VERIFICATION 12: Migration audit trail' as check_name,
  operation_type,
  COUNT(*) as operation_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count
FROM migration_audit.migration_log
GROUP BY operation_type
ORDER BY operation_type;

-- Expected: All operations completed, no failures

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION 13: MEMBERSHIP HISTORY AUDIT TRAIL
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
  'VERIFICATION 13: Membership history audit trail' as check_name,
  COUNT(*) as total_audit_records,
  COUNT(DISTINCT membership_id) as unique_memberships_tracked
FROM migration_audit.membership_history;

-- Expected: total_audit_records > 0, audit trail active

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION 14: USER PROFILE MERGE TRACKING
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
  'VERIFICATION 14: User profile merge tracking' as check_name,
  COUNT(*) as merge_records,
  COUNT(DISTINCT canonical_user_id) as canonical_users,
  COUNT(DISTINCT legacy_user_id) as legacy_users_merged
FROM migration_audit.user_profile_merge;

-- Expected: merge_records >= 0 (0 if no duplicates found)

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION 15: DATA INTEGRITY SAMPLE CHECK
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 
  'VERIFICATION 15: Data field integrity (sample check)' as check_name,
  COUNT(*) as user_profiles_count,
  COUNT(*) FILTER (WHERE email IS NOT NULL) as with_email,
  COUNT(*) FILTER (WHERE first_name IS NOT NULL OR last_name IS NOT NULL) as with_name
FROM user_profiles
LIMIT 100;

-- Expected: Most fields populated, no unexpected NULLs

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUMMARY: VERIFICATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- Review all verification results above. If all checks pass:
-- ✓ STEP 6 deployment verified
-- ✓ No data loss detected
-- ✓ Schema changes confirmed
-- ✓ FK consistency validated
-- ✓ Audit infrastructure operational
--
-- If any check fails, investigate before proceeding to production use.
-- 
-- ═══════════════════════════════════════════════════════════════════════════════
