-- ΕΛΕΓΧΟΣ ΠΛΗΡΟΦΟΡΙΩΝ ΧΡΗΣΤΗ: Μαστοροδήμου Σταυρούλα (stavmst18@gmail.com)
-- User ID: 617c6696-3a17-4e1a-9cf2-26d4c2c12411
-- ΑΥΤΟ ΕΙΝΑΙ READ-ONLY QUERY - ΔΕΝ ΚΑΝΕΙ ΑΛΛΑΓΕΣ

-- 1. ΒΑΣΙΚΕΣ ΠΛΗΡΟΦΟΡΙΕΣ ΧΡΗΣΤΗ
SELECT
  '=== ΒΑΣΙΚΕΣ ΠΛΗΡΟΦΟΡΙΕΣ ΧΡΗΣΤΗ ===' as section,
  up.user_id,
  up.first_name,
  up.last_name,
  up.email,
  up.phone,
  up.dob,
  up.created_at as registration_date,
  up.referral_code,
  up.role,
  up.is_active as user_active,
  NULL
FROM user_profiles up
WHERE up.user_id = '617c6696-3a17-4e1a-9cf2-26d4c2c12411'

UNION ALL

-- 2. ΕΝΕΡΓΕΣ ΣΥΝΔΡΟΜΕΣ
SELECT
  '=== ΕΝΕΡΓΕΣ ΣΥΝΔΡΟΜΕΣ ===' as section,
  m.id::text,
  mp.name as package_name,
  m.start_date,
  m.end_date,
  m.is_active,
  m.status,
  m.duration_type,
  m.created_at,
  NULL,
  NULL,
  NULL
FROM memberships m
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.user_id = '617c6696-3a17-4e1a-9cf2-26d4c2c12411'
  AND m.is_active = true
  AND m.end_date >= CURRENT_DATE

UNION ALL

-- 3. ΙΣΤΟΡΙΚΟ ΣΥΝΔΡΟΜΩΝ
SELECT
  '=== ΙΣΤΟΡΙΚΟ ΣΥΝΔΡΟΜΩΝ ===' as section,
  m.id::text,
  mp.name as package_name,
  m.start_date,
  m.end_date,
  m.is_active,
  m.status,
  m.created_at,
  NULL,
  NULL,
  NULL,
  NULL
FROM memberships m
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.user_id = '617c6696-3a17-4e1a-9cf2-26d4c2c12411'

UNION ALL

-- 4. PILATES DEPOSITS
SELECT
  '=== PILATES DEPOSITS ===' as section,
  pd.id::text,
  pd.deposit_remaining,
  pd.deposit_total,
  pd.is_active,
  pd.credited_at,
  pd.expires_at,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL
FROM pilates_deposits pd
WHERE pd.user_id = '617c6696-3a17-4e1a-9cf2-26d4c2c12411'

UNION ALL

-- 5. CASH TRANSACTIONS
SELECT
  '=== CASH TRANSACTIONS ===' as section,
  ct.id::text,
  ct.amount,
  ct.transaction_type,
  ct.notes,
  ct.created_at,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL
FROM user_cash_transactions ct
WHERE ct.user_id = '617c6696-3a17-4e1a-9cf2-26d4c2c12411'

UNION ALL

-- 6. MEMBERSHIP REQUESTS
SELECT
  '=== MEMBERSHIP REQUESTS ===' as section,
  mr.id::text,
  mp.name as package_name,
  mr.duration_type,
  mr.requested_price,
  mr.status,
  mr.created_at,
  mr.approved_at,
  NULL,
  NULL,
  NULL,
  NULL
FROM membership_requests mr
LEFT JOIN membership_packages mp ON mr.package_id = mp.id
WHERE mr.user_id = '617c6696-3a17-4e1a-9cf2-26d4c2c12411'

UNION ALL

-- 7. REFERRAL POINTS
SELECT
  '=== REFERRAL POINTS ===' as section,
  rp.points::text,
  rp.updated_at::text,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL
FROM user_referral_points rp
WHERE rp.user_id = '617c6696-3a17-4e1a-9cf2-26d4c2c12411'

UNION ALL

-- 8. KETTLEBELL POINTS
SELECT
  '=== KETTLEBELL POINTS SUMMARY ===' as section,
  COALESCE(SUM(kp.points), 0)::text as total_points,
  MAX(kp.created_at)::text as last_updated,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL
FROM kettlebell_points kp
WHERE kp.user_id = '617c6696-3a17-4e1a-9cf2-26d4c2c12411'

UNION ALL

-- 9. PERSONAL TRAINING SCHEDULES
SELECT
  '=== PERSONAL TRAINING ===' as section,
  pts.id::text,
  pts.month::text || '/' || pts.year::text as period,
  pts.status,
  pts.created_at::text,
  pts.updated_at::text,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL
FROM personal_training_schedules pts
WHERE pts.user_id = '617c6696-3a17-4e1a-9cf2-26d4c2c12411'