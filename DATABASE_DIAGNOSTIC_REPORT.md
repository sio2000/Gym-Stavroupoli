🔍 DATABASE SCHEMA DIAGNOSTIC REPORT
═══════════════════════════════════════════════════════════════════════════════

📊 ANALYSIS DATE: January 31, 2026

═══════════════════════════════════════════════════════════════════════════════
1️⃣  TABLE INVENTORY
═══════════════════════════════════════════════════════════════════════════════

ACTIVE TABLES (with data):
├─ memberships                          [79 rows]    ✅ CORE
├─ membership_packages                  [8 rows]     ✅ CORE  
├─ membership_requests                  [26 rows]    ✅ CORE
├─ pilates_deposits                     [36 rows]    ✅ CORE
├─ pilates_bookings                     [11 rows]    ✅ CORE
├─ membership_package_durations         [13 rows]    ✅ CORE
├─ user_profiles                        [40 rows]    ✅ CORE
└─ membership_overview                  [79 rows]    ⚠️ VIEW

EMPTY TABLES (UNUSED - Can be cleaned):
├─ ultimate_weekly_refills              [0 rows]     ❌ UNUSED
├─ ultimate_dual_membership             [0 rows]     ❌ UNUSED
├─ membership_logs                      [0 rows]     ❌ UNUSED
└─ membership_expiration                [0 rows]     ❌ UNUSED

═══════════════════════════════════════════════════════════════════════════════
2️⃣  MEMBERSHIPS TABLE - STRUCTURE ANALYSIS
═══════════════════════════════════════════════════════════════════════════════

FILLED COLUMNS (21 total):
✅ id                    - PRIMARY KEY UUID
✅ user_id              - FK to user_profiles
✅ package_id           - FK to membership_packages
✅ start_date           - Start of subscription
✅ end_date             - Expiration date
✅ is_active            - Boolean status flag
✅ created_at           - Creation timestamp
✅ updated_at           - Last update timestamp
✅ approved_at          - Approval timestamp
✅ duration_type        - Type of membership duration
✅ status               - String status ("active", "inactive", etc)
✅ auto_renew           - Auto-renewal flag

NULL/UNUSED COLUMNS (Cluttering the schema):
❌ approved_by          - Never used
❌ expires_at           - Redundant (use end_date)
❌ source_request_id    - Never populated
❌ source_package_name  - Never used
❌ deleted_at           - Soft delete timestamp (unused)
❌ cancellation_reason  - Never used
❌ cancelled_at         - Never used
❌ cancelled_by         - Never used
❌ renewal_package_id   - Never used

═══════════════════════════════════════════════════════════════════════════════
3️⃣  CRITICAL ISSUES FOUND
═══════════════════════════════════════════════════════════════════════════════

🚨 ISSUE #1: RLS POLICIES BLOCKING INSERTS
───────────────────────────────────────────
PROBLEM:
  When app tries to INSERT into memberships, RLS policy rejects it
  Error: "new row violates row-level security policy"
  
CAUSE:
  RLS policy may be too restrictive for admin/secretary operations
  Likely: Policy checking auth.uid() = user_id 
          BUT admin doesn't own those memberships
  
IMPACT:
  🔴 CRITICAL - Cannot create memberships via app
  Must use SECURITY DEFINER functions to bypass RLS
  
SOLUTION:
  RLS needs to allow:
  ├─ Users to see/modify THEIR OWN memberships
  └─ Admins/secretaries to create memberships for ANY user

---

🚨 ISSUE #2: DUPLICATE STATUS COLUMNS
───────────────────────────────────────
PROBLEM:
  Two columns for same data:
  ├─ is_active     (BOOLEAN)  - Controls active/inactive
  └─ status        (TEXT)     - Also stores "active"/"inactive"
  
CAUSE:
  Schema migration created redundant columns
  
IMPACT:
  ⚠️  HIGH - Data inconsistency risk
  Must sync both columns, confusing code logic
  Wastes storage space
  
SOLUTION:
  Use ONLY is_active (BOOLEAN) field
  Remove status field OR keep only for audit trail

---

🚨 ISSUE #3: EXPIRED MEMBERSHIPS NOT AUTO-DEACTIVATING
───────────────────────────────────────────────────────
PROBLEM:
  Memberships with end_date < TODAY still have is_active = true
  System doesn't automatically mark expired memberships as inactive
  
CAUSE:
  No BEFORE UPDATE/INSERT trigger to enforce:
    IF end_date < CURRENT_DATE THEN is_active := false
  
IMPACT:
  🔴 CRITICAL - Expired users still appear "active"
  Pilates classes can be booked after expiration
  Refill system may credit expired accounts
  
SOLUTION:
  Create BEFORE INSERT/UPDATE trigger:
    ```sql
    IF NEW.end_date < CURRENT_DATE THEN
      NEW.is_active := false;
    END IF;
    ```

---

🚨 ISSUE #4: ORPHANED PILATES DEPOSITS
──────────────────────────────────────
PROBLEM:
  When membership expires, pilates_deposits stay ACTIVE
  Active deposits exist for inactive memberships
  
CAUSE:
  No CASCADE trigger from memberships → pilates_deposits
  When membership expires, deposits aren't deactivated
  
IMPACT:
  ⚠️  HIGH - System integrity broken
  Deposits show lessons available after membership expired
  Booking system can consume "phantom" lessons
  
SOLUTION:
  Create AFTER UPDATE trigger on memberships:
    IF NEW.is_active = false AND OLD.is_active = true THEN
      UPDATE pilates_deposits 
      SET is_active = false
      WHERE user_id = NEW.user_id;
    END IF;

---

🚨 ISSUE #5: NINE UNUSED NULL COLUMNS
──────────────────────────────────────
PROBLEM:
  Columns taking up space but never used:
  ├─ approved_by
  ├─ expires_at
  ├─ source_request_id
  ├─ source_package_name
  ├─ deleted_at
  ├─ cancellation_reason
  ├─ cancelled_at
  ├─ cancelled_by
  └─ renewal_package_id
  
CAUSE:
  Schema includes fields for features never implemented
  
IMPACT:
  📍 MEDIUM - Technical debt, confusing schema
  Makes development harder
  Wastes column space (minor)
  
SOLUTION:
  For each column: Either implement the feature OR drop the column
  Recommendation: Keep approved_at, drop the rest

═══════════════════════════════════════════════════════════════════════════════
4️⃣  RELATIONSHIP MAPPING
═══════════════════════════════════════════════════════════════════════════════

✅ HEALTHY RELATIONSHIPS:
├─ memberships.user_id → user_profiles.user_id         [5 tested, 0 orphaned]
├─ memberships.package_id → membership_packages.id      [5 tested, 0 orphaned]
├─ pilates_deposits.user_id → user_profiles.user_id    [5 tested, 0 orphaned]
├─ membership_requests.user_id → user_profiles.user_id [5 tested, 0 orphaned]
└─ membership_requests.package_id → membership_packages.id [5 tested, 0 orphaned]

═══════════════════════════════════════════════════════════════════════════════
5️⃣  ACTION PLAN (PRIORITY ORDER)
═══════════════════════════════════════════════════════════════════════════════

🔴 PHASE 1: CRITICAL FIXES (Do immediately)
────────────────────────────────────────────
1. ✏️  Implement BEFORE trigger to auto-deactivate expired memberships
   File: database/FIX_EXPIRED_MEMBERSHIPS_TRIGGER.sql
   
2. ✏️  Implement CASCADE trigger to deactivate deposits when membership expires
   File: database/FIX_CASCADE_PILATES_DEACTIVATION.sql
   
3. ✏️  Review & fix RLS policies to allow admin/secretary operations
   File: database/FIX_RLS_POLICIES.sql

🟠 PHASE 2: SCHEMA CLEANUP (Next iteration)
────────────────────────────────────────────
4. ✏️  Remove 9 unused NULL columns OR document why they're needed
   
5. ✏️  Remove duplicate "status" column, keep only is_active
   
6. ✏️  Drop empty tables (ultimate_weekly_refills, etc)

🟡 PHASE 3: VERIFICATION (After fixes)
────────────────────────────────────────
7. 🧪 Test: Membership expires → is_active auto-set to false
   
8. 🧪 Test: Membership inactive → pilates_deposits auto-deactivate
   
9. 🧪 Test: Admin can create memberships without RLS errors
   
10. 🧪 Test: Refill system respects expired memberships

═══════════════════════════════════════════════════════════════════════════════
6️⃣  RECOMMENDED SQL FIXES
═══════════════════════════════════════════════════════════════════════════════

FIX #1: Auto-deactivate expired memberships
────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auto_deactivate_expired_memberships()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date < CURRENT_DATE THEN
    NEW.is_active := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expire_membership_trigger
BEFORE INSERT OR UPDATE ON memberships
FOR EACH ROW
EXECUTE FUNCTION auto_deactivate_expired_memberships();

---

FIX #2: Cascade deactivate pilates deposits
─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION cascade_deactivate_deposits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = false AND OLD.is_active = true THEN
    UPDATE pilates_deposits 
    SET is_active = false, updated_at = NOW()
    WHERE user_id = NEW.user_id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cascade_deactivate_trigger
AFTER UPDATE ON memberships
FOR EACH ROW
EXECUTE FUNCTION cascade_deactivate_deposits();

---

FIX #3: RLS Policy (Admin can create memberships for others)
─────────────────────────────────────────────────────────────
CREATE POLICY "admin_can_manage_all_memberships" ON memberships
  FOR INSERT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'secretary')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'secretary')
    )
  );

═══════════════════════════════════════════════════════════════════════════════
7️⃣  EMPTY TABLES - CLEANUP RECOMMENDATIONS
═══════════════════════════════════════════════════════════════════════════════

🗑️  TABLES MARKED FOR DELETION:

ultimate_weekly_refills
├─ Status: 0 rows, never used
├─ Purpose: (unclear from current codebase)
└─ Action: 🗑️ DROP if not needed

ultimate_dual_membership
├─ Status: 0 rows, never used
├─ Purpose: (unclear from current codebase)
└─ Action: 🗑️ DROP if not needed

membership_logs
├─ Status: 0 rows, never used
├─ Purpose: Audit trail?
└─ Action: ⚠️  Keep if audit trail is desired, else DROP

membership_expiration
├─ Status: 0 rows, never used
├─ Purpose: (unclear from current codebase)
└─ Action: 🗑️ DROP if not needed

═══════════════════════════════════════════════════════════════════════════════
8️⃣  NEXT STEPS
═══════════════════════════════════════════════════════════════════════════════

1. ✅ Review this report with the team
2. 🔧 Run Phase 1 fixes in database
3. 🧪 Execute validation tests
4. 📋 Re-run this analysis to verify fixes applied
5. 📝 Document any intentional design choices

═══════════════════════════════════════════════════════════════════════════════
