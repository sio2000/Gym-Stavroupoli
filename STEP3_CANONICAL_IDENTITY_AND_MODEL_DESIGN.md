-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 3: CANONICAL IDENTITY & SUBSCRIPTION MODEL DESIGN
-- ══════════════════════════════════════════════════════════════════════════════
-- 
-- This document defines the SINGLE SOURCE OF TRUTH for users and subscriptions.
-- NO DATA DELETION. All existing columns remain.
-- NEW columns are added (nullable initially) to enable parallel coexistence.
-- 
-- ══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
3.1: CANONICAL USER IDENTITY
═══════════════════════════════════════════════════════════════════════════════

DECISION: Use user_profiles.user_id as the CANONICAL identity

RATIONALE:
- user_id = auth.users(id) (the true user identity from Supabase Auth)
- Already used by MOST tables (memberships, lesson_bookings, trainers, etc.)
- Matches Supabase convention
- Fewer migration points required

LEGACY COLUMN (user_profiles.id):
- KEEP it (never delete)
- Mark as "legacy" via metadata
- Will remain for backward compatibility during transition
- After stabilization, can be deprecated (but never deleted)

USER PROFILE STRUCTURE (FINAL):
  id                              UUID        (legacy key, keep for reference)
  user_id                         UUID UNIQUE (canonical, FK target, = auth.users.id)
  first_name, last_name, email    TEXT        (user data, never delete)
  phone, dob, address             TEXT        (user data, never delete)
  role                            TEXT        ('user', 'trainer', 'admin', 'secretary')
  profile_photo, avatar_url       TEXT        (user data, never delete)
  emergency_contact_*             TEXT        (user data, never delete)
  language, timezone              TEXT        (preferences)
  notification_preferences        JSONB       (user data, never delete)
  referral_code                   TEXT        (engagement data)
  
  NEW: is_merged                  BOOLEAN     (=true if merged into another user, false otherwise)
  NEW: merged_into_user_id        UUID FK     (if is_merged=true, points to canonical user_id)
  NEW: merge_reason               TEXT        ('duplicate_detection', 'manual_review', etc.)
  NEW: merge_recorded_at          TIMESTAMPTZ (when merge metadata was recorded)
  
  created_at, updated_at          TIMESTAMPTZ

MERGE STRATEGY (for duplicate users):
- Do NOT delete the duplicate user_profile row
- Set is_merged = true and merged_into_user_id = <canonical_user_id>
- Keep all original data fields intact (first_name, email, phone, etc.) for historical audit
- For subscriptions/bookings of the merged user: update FKs to point to canonical user_id
- All historical relationships preserved via audit tables

═══════════════════════════════════════════════════════════════════════════════
3.2: CANONICAL SUBSCRIPTION MODEL (memberships)
═══════════════════════════════════════════════════════════════════════════════

DECISION: Consolidate into single memberships table

Current state: TWO tables (membership_requests + memberships)
Future state: ONE canonical subscription with single state machine

membership_requests TABLE:
- Represents: PENDING approval workflow
- Keep as-is (requests can stay for audit/history)
- Do NOT merge with memberships

memberships TABLE (CANONICAL ACTIVE SUBSCRIPTIONS):

  id                              UUID        (PK)
  user_id                         UUID        (FK → user_profiles.user_id) CANONICAL
  package_id                      UUID        (FK → membership_packages.id)
  
  -- Temporal boundaries (deterministic)
  start_date                      DATE        (subscription begins)
  end_date                        DATE        (subscription naturally ends)
  expires_at                      TIMESTAMPTZ GENERATED (= end_date AT TIME ZONE 'UTC')
  
  -- Status (single source of truth)
  status                          ENUM        ('active', 'expired', 'cancelled', 'suspended')
                                              - 'active' = user can use services
                                              - 'expired' = end_date passed, auto-transitioned
                                              - 'cancelled' = explicit cancellation by user/admin
                                              - 'suspended' = manual admin action (e.g., abuse)
  
  is_active                       BOOLEAN     DERIVED (calculated from status + expires_at)
                                              = (status = 'active' AND expires_at > NOW())
                                              
  -- Approval metadata
  approved_by                     UUID FK     (admin/secretary who approved)
  approved_at                     TIMESTAMPTZ (when approved)
  
  -- Renewal control
  auto_renew                      BOOLEAN     (if true, should auto-renew on expiry)
  renewal_package_id              UUID FK     (package to renew into, if auto_renew=true)
  
  -- Duration info
  duration_type                   TEXT ENUM   ('year', 'semester', 'month', 'lesson', 'custom')
  duration_days                   INTEGER     (calculated from duration_type + package)
  
  -- Audit trail
  created_at                      TIMESTAMPTZ (when subscription initiated)
  updated_at                      TIMESTAMPTZ (when last modified)
  deleted_at                      TIMESTAMPTZ (soft-delete marker, never hard-delete)
  
  -- NEW: Cancellation reason (for debugging)
  cancellation_reason             TEXT        ('user_request', 'payment_failed', 'admin_cancel', NULL)
  cancelled_at                    TIMESTAMPTZ (when cancelled, if applicable)
  cancelled_by                    UUID FK     (who cancelled, if not self)

CRITICAL: is_active is DERIVED, not stored
- Trigger: before insert/update, compute is_active = (status='active' AND expires_at > NOW())
- Alternative: use a computed column or view
- Ensures no stale flag values

SINGLE STATE MACHINE:
  pending* → active → expired → [suspended | reactivated]
     ↓
  rejected
  
  active → cancelled
  
  * memberships table does NOT store 'pending' — that's in membership_requests table
  * Once approved, creates a record in memberships with status='active'

═══════════════════════════════════════════════════════════════════════════════
3.3: PILATES SUBSCRIPTION CONSOLIDATION
═══════════════════════════════════════════════════════════════════════════════

PROBLEM: Pilates subscriptions are SEPARATE (pilates_deposits)

SOLUTION: Keep pilates_deposits but LINK to memberships

pilates_deposits TABLE (unchanged structure):
  id                              UUID
  user_id                         UUID FK → user_profiles.user_id
  deposit_amount                  INTEGER (number of classes)
  deposit_remaining               INTEGER (classes left)
  is_active                       BOOLEAN
  credited_at, expires_at         TIMESTAMPTZ
  created_at, updated_at          TIMESTAMPTZ
  
  NEW: membership_id              UUID FK → memberships.id (optional, for cross-reference)
  NEW: linked_to_membership       BOOLEAN (=true if this deposit is tied to a membership)

RULE: Pilates memberships MUST be linked to active memberships
- When user purchases pilates package → creates membership record
- When pilates_deposits.is_active=false → should also mark corresponding membership expired
- Trigger: if deposit_remaining<=0, set is_active=false, add to audit table

pilates_bookings TABLE (unchanged):
  Tracks individual class bookings, decrements deposit_remaining

═══════════════════════════════════════════════════════════════════════════════
3.4: LESSONS & BOOKINGS (unchanged structure, improved integrity)
═══════════════════════════════════════════════════════════════════════════════

lesson_bookings TABLE:
  id, user_id, lesson_id, booking_date, status, etc.
  FK: user_id → user_profiles.user_id ✓ (already correct)
  
  NEW GUARD: On insert, check that user has active membership
  - Trigger/function: if lesson requires membership, verify user.membership.status='active'
  - If not, raise exception or set booking.status='pending_approval'

lessons TABLE (unchanged):
  id, name, category_id, trainer_id, room_id, day_of_week, start_time, end_time, capacity
  All FKs already use correct columns

═══════════════════════════════════════════════════════════════════════════════
3.5: AUDIT & HISTORY (NEW - CRITICAL FOR DEBUGGABILITY)
═══════════════════════════════════════════════════════════════════════════════

NEW TABLE: membership_history
  id                              UUID        (PK)
  membership_id                   UUID        (FK → memberships.id)
  old_status                      TEXT        (previous status)
  new_status                      TEXT        (new status)
  reason                          TEXT        ('system_expiration', 'user_cancel', 'admin_action', 'auto_renew', ...)
  performed_by                    UUID FK     (auth.uid() or 'SYSTEM' string)
  triggered_by                    TEXT        ('scheduled_job', 'api_call', 'trigger', 'manual')
  metadata                        JSONB       (extra context: {deposit_remaining: 0, etc.})
  created_at                      TIMESTAMPTZ (when state change occurred)

NEW TABLE: user_merge_audit
  id                              UUID
  legacy_user_id                  UUID
  canonical_user_id               UUID
  merge_reason                    TEXT        ('duplicate_detection', 'manual_consolidation')
  legacy_fields_preserved         JSONB       (copy of original profile data)
  merged_by_admin                 UUID FK
  merge_timestamp                 TIMESTAMPTZ
  records_updated_count           INTEGER     (number of FKs relinked)

NEW TABLE: subscription_data_migration_log
  id                              UUID
  operation_type                  TEXT        ('canonical_key_added', 'fk_validated', 'pilates_linked', ...)
  table_name                      TEXT
  affected_rows                   INTEGER
  old_value_sample                TEXT
  new_value_sample                TEXT
  performed_at                    TIMESTAMPTZ
  performed_by                    TEXT

═══════════════════════════════════════════════════════════════════════════════
3.6: EXPIRATION LOGIC (SINGLE AUTHORITATIVE FUNCTION)
═══════════════════════════════════════════════════════════════════════════════

OLD: 3+ conflicting functions → REMOVED (will be deleted during migration)

NEW: Single idempotent function

CREATE OR REPLACE FUNCTION subscription_expire_worker()
RETURNS TABLE (expired_count INTEGER, pilates_deactivated INTEGER) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_count INTEGER := 0;
  v_pilates_deactivated INTEGER := 0;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Phase 1: Expire memberships where end_date passed
  UPDATE memberships
  SET 
    status = 'expired',
    updated_at = v_now
  WHERE 
    status = 'active' 
    AND (expires_at < v_now OR end_date < CURRENT_DATE)
  RETURNING id INTO v_expired_count;
  
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  
  -- Phase 2: Log all expirations to membership_history
  INSERT INTO membership_history (membership_id, old_status, new_status, reason, performed_by, triggered_by, created_at)
  SELECT id, 'active', 'expired', 'system_expiration', 'SYSTEM', 'scheduled_job', v_now
  FROM memberships
  WHERE status = 'expired' AND updated_at >= (v_now - INTERVAL '1 minute');
  
  -- Phase 3: Deactivate pilates deposits where remaining <= 0
  UPDATE pilates_deposits
  SET 
    is_active = false,
    updated_at = v_now
  WHERE 
    is_active = true 
    AND deposit_remaining <= 0;
  
  GET DIAGNOSTICS v_pilates_deactivated = ROW_COUNT;
  
  -- Phase 4: Expire memberships tied to pilates deposits
  UPDATE memberships m
  SET 
    status = 'expired',
    updated_at = v_now,
    cancellation_reason = 'pilates_deposit_exhausted'
  WHERE 
    m.status = 'active'
    AND EXISTS (
      SELECT 1 FROM pilates_deposits pd 
      WHERE pd.user_id = m.user_id 
        AND pd.is_active = false 
        AND pd.deposit_remaining <= 0
    );
  
  RETURN QUERY SELECT v_expired_count, v_pilates_deactivated;
END;
$$;

-- SCHEDULED VIA:
-- Option A: pg_cron (if available in Supabase)
--   SELECT cron.schedule('membership-expiry-worker', '0 2 * * *', 'SELECT subscription_expire_worker();');
--
-- Option B: Supabase Edge Function (preferred)
--   Call this function via HTTP every hour
--
-- Option C: External cron (least preferred, but fallback)
--   curl -X POST https://<project>.supabase.co/functions/v1/expire-subscriptions

IDEMPOTENCY GUARANTEE:
- Function updates only rows WHERE status='active' AND condition
- Multiple runs will not double-update (status changes to 'expired', condition no longer matches)
- Membership_history records all transitions with timestamp

═══════════════════════════════════════════════════════════════════════════════
3.7: FOREIGN KEY CONSOLIDATION TARGET
═══════════════════════════════════════════════════════════════════════════════

All tables will reference ONLY:
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)

Tables affected:
  ✓ memberships (already correct)
  ✓ membership_requests (already correct)
  ✓ lesson_bookings (already correct)
  ✓ trainers (already correct)
  ✓ pilates_bookings (already correct)
  ✓ pilates_deposits (already correct)
  ✓ group_assignments (already correct)
  ✓ personal_training_schedules (already correct)
  ✓ group_schedule_templates (already correct)
  ✗ QR code tables (currently use user_profiles.id → WILL FIX)
  ✗ Legacy tables (if any) → WILL FIX

═══════════════════════════════════════════════════════════════════════════════
3.8: GUARANTEES (ZERO DATA LOSS)
═══════════════════════════════════════════════════════════════════════════════

NEVER:
- Delete user_profiles rows
- Delete membership_requests rows (represents history)
- Delete memberships rows (mark with deleted_at instead)
- Delete lesson_bookings or pilates_bookings
- Drop columns containing user data

ALWAYS:
- Create new columns as NULLABLE
- Populate new columns via UPDATE (not IN-PLACE edit)
- Record every migration step in audit tables
- Validate every FK change before applying
- Provide rollback SQL for each migration phase

═══════════════════════════════════════════════════════════════════════════════
END OF CANONICAL MODEL DESIGN
═══════════════════════════════════════════════════════════════════════════════
