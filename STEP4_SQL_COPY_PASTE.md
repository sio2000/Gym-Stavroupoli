# STEP 4 - SQL QUERIES ΓΙΑ COPY-PASTE
## Έτοιμα queries για ευθεία εκτέλεση στο Supabase

---

## ✅ PHASE 1: BASELINE ROW COUNTS
### (Αντιγραφή ολόκληρο το block παρακάτω)

```
SELECT 'PHASE 1: BASELINE ROW COUNTS' as phase_marker;

SELECT
  'user_profiles' as table_name,
  COUNT(*) as row_count,
  'PRIMARY CASCADE HUB' as category
FROM user_profiles
UNION ALL SELECT
  'memberships',
  COUNT(*),
  'USER SUBSCRIPTIONS'
FROM memberships
UNION ALL SELECT
  'membership_requests',
  COUNT(*),
  'USER SUBSCRIPTIONS'
FROM membership_requests
UNION ALL SELECT
  'pilates_deposits',
  COUNT(*),
  'USER SUBSCRIPTIONS'
FROM pilates_deposits
UNION ALL SELECT
  'pilates_bookings',
  COUNT(*),
  'USER TRANSACTIONS'
FROM pilates_bookings
UNION ALL SELECT
  'lesson_bookings',
  COUNT(*),
  'USER TRANSACTIONS'
FROM lesson_bookings
UNION ALL SELECT
  'lesson_attendance',
  COUNT(*),
  'USER TRANSACTIONS'
FROM lesson_attendance
UNION ALL SELECT
  'bookings',
  COUNT(*),
  'USER TRANSACTIONS'
FROM bookings
UNION ALL SELECT
  'qr_codes',
  COUNT(*),
  'USER TRANSACTIONS'
FROM qr_codes
UNION ALL SELECT
  'scan_audit_logs',
  COUNT(*),
  'USER TRANSACTIONS'
FROM scan_audit_logs
UNION ALL SELECT
  'payments',
  COUNT(*),
  'USER TRANSACTIONS'
FROM payments
UNION ALL SELECT
  'absence_records',
  COUNT(*),
  'USER DATA'
FROM absence_records
UNION ALL SELECT
  'referrals',
  COUNT(*),
  'USER DATA'
FROM referrals
UNION ALL SELECT
  'user_kettlebell_points',
  COUNT(*),
  'USER DATA'
FROM user_kettlebell_points
UNION ALL SELECT
  'user_group_weekly_presets',
  COUNT(*),
  'USER DATA'
FROM user_group_weekly_presets
UNION ALL SELECT
  'audit_logs',
  COUNT(*),
  'USER DATA'
FROM audit_logs
UNION ALL SELECT
  'user_profile_audit_logs',
  COUNT(*),
  'USER DATA'
FROM user_profile_audit_logs
UNION ALL SELECT
  'personal_training_codes',
  COUNT(*),
  'USER DATA'
FROM personal_training_codes
UNION ALL SELECT
  'personal_training_schedules',
  COUNT(*),
  'USER DATA'
FROM personal_training_schedules
UNION ALL SELECT
  'group_assignments',
  COUNT(*),
  'USER DATA'
FROM group_assignments
UNION ALL SELECT
  'membership_logs',
  COUNT(*),
  'USER DATA'
FROM membership_logs
ORDER BY row_count DESC;

SELECT 'PROTECTED TABLES (DO NOT DELETE):' as verification;
SELECT
  'membership_packages' as table_name,
  COUNT(*) as row_count,
  'PROTECTED' as status
FROM membership_packages
UNION ALL SELECT
  'membership_package_durations',
  COUNT(*),
  'PROTECTED'
FROM membership_package_durations
UNION ALL SELECT
  'lesson_categories',
  COUNT(*),
  'PROTECTED'
FROM lesson_categories
UNION ALL SELECT
  'rooms',
  COUNT(*),
  'PROTECTED'
FROM rooms
UNION ALL SELECT
  'lessons',
  COUNT(*),
  'PROTECTED'
FROM lessons
UNION ALL SELECT
  'lesson_schedules',
  COUNT(*),
  'PROTECTED'
FROM lesson_schedules
UNION ALL SELECT
  'trainers',
  COUNT(*),
  'PROTECTED'
FROM trainers
UNION ALL SELECT
  'group_schedule_templates',
  COUNT(*),
  'PROTECTED'
FROM group_schedule_templates
UNION ALL SELECT
  'pilates_schedule_slots',
  COUNT(*),
  'PROTECTED'
FROM pilates_schedule_slots
ORDER BY row_count DESC;
```

**ΣΤΟΠ εδώ και σημείωσε τα νούμερα πριν προχωρήσεις!**

---

## 🟡 PHASE 2: DELETE LEAF NODES
### (Αντιγραφή ολόκληρο το block παρακάτω)

```
BEGIN;

DELETE FROM scan_audit_logs;
DELETE FROM lesson_attendance;
DELETE FROM absence_records;
DELETE FROM referrals;
DELETE FROM user_kettlebell_points;
DELETE FROM user_group_weekly_presets;
DELETE FROM audit_logs;
DELETE FROM user_profile_audit_logs;
DELETE FROM personal_training_schedules;

SELECT '---PHASE 2 CHECK---' as checkpoint;
SELECT
  'scan_audit_logs' as table_name,
  COUNT(*) as remaining_rows
FROM scan_audit_logs
UNION ALL SELECT 'lesson_attendance', COUNT(*) FROM lesson_attendance
UNION ALL SELECT 'absence_records', COUNT(*) FROM absence_records
UNION ALL SELECT 'referrals', COUNT(*) FROM referrals
UNION ALL SELECT 'user_kettlebell_points', COUNT(*) FROM user_kettlebell_points
UNION ALL SELECT 'user_group_weekly_presets', COUNT(*) FROM user_group_weekly_presets
UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL SELECT 'user_profile_audit_logs', COUNT(*) FROM user_profile_audit_logs
UNION ALL SELECT 'personal_training_schedules', COUNT(*) FROM personal_training_schedules;

COMMIT;
```

**Αν δείς 0 στα αποτελέσματα = SUCCESS ✅**

---

## 🟡 PHASE 3: DELETE TRANSACTIONAL DATA
### (Αντιγραφή ολόκληρο το block παρακάτω)

```
BEGIN;

DELETE FROM pilates_bookings;
DELETE FROM lesson_bookings;
DELETE FROM qr_codes;
DELETE FROM bookings;
DELETE FROM payments;
DELETE FROM personal_training_codes;
DELETE FROM group_assignments;

SELECT '---PHASE 3 CHECK---' as checkpoint;
SELECT
  'pilates_bookings' as table_name,
  COUNT(*) as remaining_rows
FROM pilates_bookings
UNION ALL SELECT 'lesson_bookings', COUNT(*) FROM lesson_bookings
UNION ALL SELECT 'qr_codes', COUNT(*) FROM qr_codes
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'personal_training_codes', COUNT(*) FROM personal_training_codes
UNION ALL SELECT 'group_assignments', COUNT(*) FROM group_assignments;

COMMIT;
```

**Αν δείς 0 στα αποτελέσματα = SUCCESS ✅**

---

## 🟠 PHASE 4: DELETE SUBSCRIPTION DATA
### (Αντιγραφή ολόκληρο το block παρακάτω)

```
BEGIN;

DELETE FROM membership_requests;
DELETE FROM memberships;
DELETE FROM pilates_deposits;

SELECT '---PHASE 4 CHECK---' as checkpoint;
SELECT
  'membership_requests' as table_name,
  COUNT(*) as remaining_rows
FROM membership_requests
UNION ALL SELECT 'memberships', COUNT(*) FROM memberships
UNION ALL SELECT 'pilates_deposits', COUNT(*) FROM pilates_deposits
UNION ALL SELECT 'membership_logs', COUNT(*) FROM membership_logs;

COMMIT;
```

**Αν δείς 0 στα αποτελέσματα = SUCCESS ✅**

---

## 🔴 PHASE 5: DELETE USER PROFILES (POINT OF NO RETURN)
### (Αντιγραφή ολόκληρο το block παρακάτω)

⚠️ **ΠΡΟΣΟΧΗ: ΤΟ ΑΜΕΣΩ COMMIT ΔΙΑΓΡΑΦΕΙ ΟΛΑ ΤΑ USER DATA - ΜΟΝΙΜΑ**

```
BEGIN;

DELETE FROM user_profiles;

SELECT '---PHASE 5 CHECK---' as checkpoint;
SELECT
  'user_profiles' as table_name,
  COUNT(*) as remaining_rows
FROM user_profiles
UNION ALL SELECT 'memberships', COUNT(*) FROM memberships
UNION ALL SELECT 'membership_requests', COUNT(*) FROM membership_requests
UNION ALL SELECT 'pilates_deposits', COUNT(*) FROM pilates_deposits
UNION ALL SELECT 'pilates_bookings', COUNT(*) FROM pilates_bookings
UNION ALL SELECT 'lesson_bookings', COUNT(*) FROM lesson_bookings
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'group_assignments', COUNT(*) FROM group_assignments;

COMMIT;
```

**Αν ΟΛΕΣ οι γραμμές δείχνουν 0 = SUCCESS ✅ ΔΕΔΟΜΕΝΑ ΔΙΑΓΡΑΦΗΣΑΝ ΜΟΝΙΜΑ**

---

## ✅ PHASE 6: POST-DELETION VERIFICATION
### (Αντιγραφή ολόκληρο το block παρακάτω)

```
SELECT 'PHASE 6: POST-DELETION VERIFICATION' as phase_marker;

SELECT 'USER-GENERATED DATA VERIFICATION:' as check_type;
SELECT
  'user_profiles' as table_name,
  COUNT(*) as remaining_rows,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM user_profiles
UNION ALL SELECT
  'memberships',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM memberships
UNION ALL SELECT
  'membership_requests',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM membership_requests
UNION ALL SELECT
  'pilates_deposits',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM pilates_deposits
UNION ALL SELECT
  'pilates_bookings',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM pilates_bookings
UNION ALL SELECT
  'lesson_bookings',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM lesson_bookings
UNION ALL SELECT
  'lesson_attendance',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM lesson_attendance
UNION ALL SELECT
  'bookings',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM bookings
UNION ALL SELECT
  'qr_codes',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM qr_codes
UNION ALL SELECT
  'scan_audit_logs',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM scan_audit_logs
UNION ALL SELECT
  'payments',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM payments
UNION ALL SELECT
  'absence_records',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM absence_records
UNION ALL SELECT
  'referrals',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM referrals
UNION ALL SELECT
  'user_kettlebell_points',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM user_kettlebell_points
UNION ALL SELECT
  'user_group_weekly_presets',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM user_group_weekly_presets
UNION ALL SELECT
  'audit_logs',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM audit_logs
UNION ALL SELECT
  'user_profile_audit_logs',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM user_profile_audit_logs
UNION ALL SELECT
  'personal_training_codes',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM personal_training_codes
UNION ALL SELECT
  'personal_training_schedules',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM personal_training_schedules
UNION ALL SELECT
  'group_assignments',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM group_assignments
UNION ALL SELECT
  'membership_logs',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM membership_logs
ORDER BY remaining_rows DESC;

SELECT 'PROTECTED TABLES VERIFICATION:' as check_type;
SELECT
  'membership_packages' as table_name,
  COUNT(*) as row_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END as status
FROM membership_packages
UNION ALL SELECT
  'membership_package_durations',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM membership_package_durations
UNION ALL SELECT
  'lesson_categories',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM lesson_categories
UNION ALL SELECT
  'rooms',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM rooms
UNION ALL SELECT
  'lessons',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM lessons
UNION ALL SELECT
  'lesson_schedules',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM lesson_schedules
UNION ALL SELECT
  'trainers',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM trainers
UNION ALL SELECT
  'group_schedule_templates',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM group_schedule_templates
UNION ALL SELECT
  'pilates_schedule_slots',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ INTACT' ELSE '❌ EMPTY' END
FROM pilates_schedule_slots
ORDER BY row_count DESC;
```

**Αν δείς ✅ PASS σε όλα τα user tables = SUCCESS ✅**
**Αν δείς ✅ INTACT σε όλα τα protected tables = SUCCESS ✅**

---

## 📋 ΒΗΜΑΤΟΛΟΓΙΑ ΕΚΤΕΛΕΣΗΣ

1. **Άνοιξε Supabase SQL Editor**
   - https://app.supabase.com → SQL Editor

2. **PHASE 1:**
   - Αντιγραφή όλο το SQL code από "PHASE 1" παραπάνω
   - Κόλλησε στο SQL Editor
   - Πάτησε RUN
   - Σημείωσε τα νούμερα (πόσοι users, memberships κλπ)

3. **PHASE 2:**
   - Αντιγραφή όλο το SQL code από "PHASE 2" παραπάνω
   - Κόλλησε στο SQL Editor
   - Πάτησε RUN
   - Έλεγχος: Όλα δείχνουν 0 rows? 
     - ✅ ΝΑΙ → Πήγαινε στο PHASE 3
     - ❌ ΟΧΙ → STOP, κάνε ROLLBACK

4. **PHASE 3:**
   - Αντιγραφή όλο το SQL code από "PHASE 3" παραπάνω
   - Κόλλησε στο SQL Editor
   - Πάτησε RUN
   - Έλεγχος: Όλα δείχνουν 0 rows?
     - ✅ ΝΑΙ → Πήγαινε στο PHASE 4
     - ❌ ΟΧΙ → STOP, κάνε ROLLBACK

5. **PHASE 4:**
   - Αντιγραφή όλο το SQL code από "PHASE 4" παραπάνω
   - Κόλλησε στο SQL Editor
   - Πάτησε RUN
   - Έλεγχος: Όλα δείχνουν 0 rows?
     - ✅ ΝΑΙ → Πήγαινε στο PHASE 5
     - ❌ ΟΧΙ → STOP, κάνε ROLLBACK

6. **PHASE 5 (⚠️ POINT OF NO RETURN):**
   - ⚠️ **ΤΕΛΕΥΤΑΙΑ ΕΥΚΑΙΡΙΑ ΓΙΑ ROLLBACK**
   - Αντιγραφή όλο το SQL code από "PHASE 5" παραπάνω
   - Κόλλησε στο SQL Editor
   - Πάτησε RUN
   - Έλεγχος: Όλα δείχνουν 0 rows?
     - ✅ ΝΑΙ → ΤΑ ΔΕΔΟΜΕΝΑ ΔΙΑΓΡΑΦΗΣΑΝ ΜΟΝΙΜΑ
     - ❌ ΟΧΙ → STOP (αλλά είναι αργά, έγινε ήδη COMMIT)

7. **PHASE 6 (Επαλήθευση):**
   - Αντιγραφή όλο το SQL code από "PHASE 6" παραπάνω
   - Κόλλησε στο SQL Editor
   - Πάτησε RUN
   - Έλεγχος:
     - Όλα user tables = 0 rows + ✅ PASS
     - Όλα protected tables = > 0 rows + ✅ INTACT

---

## 📝 ΑΠΟΤΕΛΕΣΜΑΤΑ ΠΟΥ ΠΕΡΙΜΕΝΕΤΑΙ

**PHASE 1 (Baseline):**
- user_profiles: [X] rows
- memberships: [Y] rows
- lesson_bookings: [Z] rows
- ... (σημείωσε όλα)

**PHASE 2:**
- Deletion complete
- All remaining_rows = 0 ✅

**PHASE 3:**
- Deletion complete
- All remaining_rows = 0 ✅

**PHASE 4:**
- Deletion complete
- All remaining_rows = 0 ✅

**PHASE 5:**
- ⚠️ USER PROFILES DELETED
- All user tables = 0 ✅
- Cascaded successfully

**PHASE 6:**
- All user-generated tables = 0 rows + ✅ PASS
- membership_packages > 0 + ✅ INTACT
- lessons > 0 + ✅ INTACT
- trainers > 0 + ✅ INTACT
- pilates_schedule_slots > 0 + ✅ INTACT

---

## 🚀 ΕΤΟΙΜΟΣ;

Αντιγραφή την **PHASE 1** παραπάνω, κόλλησε, εκτέλεσε και πες μου τα αποτελέσματα!
