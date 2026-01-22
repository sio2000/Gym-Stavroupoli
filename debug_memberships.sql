-- Debug script to check memberships for legacy users
-- Run this in Supabase SQL Editor

-- Check a specific user's memberships
SELECT
  m.id,
  m.user_id,
  m.package_id,
  mp.name as package_name,
  m.start_date,
  m.end_date,
  m.is_active,
  m.status,
  m.created_at,
  m.approved_at
FROM memberships m
LEFT JOIN membership_packages mp ON m.package_id = mp.id
WHERE m.user_id = 'REPLACE_WITH_USER_ID'
ORDER BY m.created_at DESC;

-- Check all memberships created today
SELECT
  m.id,
  m.user_id,
  up.first_name,
  up.last_name,
  up.email,
  m.package_id,
  mp.name as package_name,
  m.start_date,
  m.end_date,
  m.is_active,
  m.status,
  m.created_at,
  m.approved_at
FROM memberships m
LEFT JOIN membership_packages mp ON m.package_id = mp.id
LEFT JOIN user_profiles up ON m.user_id = up.user_id
WHERE DATE(m.created_at) = CURRENT_DATE
ORDER BY m.created_at DESC;

-- Check membership requests created today
SELECT
  mr.id,
  mr.user_id,
  up.first_name,
  up.last_name,
  up.email,
  mr.package_id,
  mp.name as package_name,
  mr.duration_type,
  mr.status,
  mr.created_at,
  mr.approved_at
FROM membership_requests mr
LEFT JOIN membership_packages mp ON mr.package_id = mp.id
LEFT JOIN user_profiles up ON mr.user_id = up.user_id
WHERE DATE(mr.created_at) = CURRENT_DATE
ORDER BY mr.created_at DESC;