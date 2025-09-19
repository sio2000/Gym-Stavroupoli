-- CHANGE PERSONAL TRAINING DURATION FROM 365 DAYS TO 30 DAYS (1 MONTH)
-- This script updates all personal training related packages from 1 year to 1 month duration
-- Execute in Supabase SQL Editor

-- ========================================
-- PHASE 1: UPDATE PERSONAL TRAINING PACKAGES
-- ========================================

SELECT 'PHASE 1: Updating Personal Training package durations from 365 to 30 days...' as phase;

-- Update the main Personal Training package duration_days
UPDATE membership_packages 
SET 
    duration_days = 30,
    description = REPLACE(REPLACE(description, '1 year', '1 month'), '365 days', '30 days'),
    updated_at = NOW()
WHERE package_type = 'personal' 
AND duration_days = 365;

-- Log the changes
SELECT 'Updated Personal Training packages:' as info;
SELECT id, name, package_type, duration_days, description 
FROM membership_packages 
WHERE package_type = 'personal';

-- ========================================
-- PHASE 2: UPDATE PERSONAL TRAINING PACKAGE DURATIONS
-- ========================================

SELECT 'PHASE 2: Updating Personal Training package duration entries...' as phase;

-- Update package durations for personal training
UPDATE membership_package_durations mpd
SET 
    duration_days = 30,
    updated_at = NOW()
FROM membership_packages mp
WHERE mpd.package_id = mp.id 
AND mp.package_type = 'personal'
AND mpd.duration_days = 365;

-- Log the changes
SELECT 'Updated Personal Training package durations:' as info;
SELECT mpd.id, mp.name, mpd.duration_type, mpd.duration_days, mpd.price
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.package_type = 'personal'
ORDER BY mp.name, mpd.duration_days;

-- ========================================
-- PHASE 3: UPDATE EXISTING ACTIVE MEMBERSHIPS
-- ========================================

SELECT 'PHASE 3: Updating existing active personal training memberships...' as phase;

-- Update existing active memberships to have 30 days from their start_date
-- Only update those that have more than 30 days remaining
UPDATE memberships m
SET 
    end_date = m.start_date + INTERVAL '30 days',
    updated_at = NOW()
FROM membership_packages mp
WHERE m.package_id = mp.id
AND mp.package_type = 'personal'
AND m.status = 'active'
AND (m.end_date - m.start_date) > 30; -- Only update if current duration is more than 30 days

-- Log the changes
SELECT 'Updated existing active personal training memberships:' as info;
SELECT m.id, mp.name, m.start_date, m.end_date, m.status,
       (m.end_date - m.start_date) as duration
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
WHERE mp.package_type = 'personal'
AND m.status = 'active'
ORDER BY m.created_at DESC;

-- ========================================
-- PHASE 4: VERIFICATION
-- ========================================

SELECT 'PHASE 4: Verification of changes...' as phase;

-- Verify all personal training packages now have 30 days duration
SELECT 'Personal Training packages verification:' as info;
SELECT 
    mp.name,
    mp.package_type,
    mp.duration_days,
    COUNT(mpd.id) as duration_options,
    STRING_AGG(mpd.duration_type || ':' || mpd.duration_days || 'days', ', ') as durations
FROM membership_packages mp
LEFT JOIN membership_package_durations mpd ON mp.id = mpd.package_id
WHERE mp.package_type = 'personal'
GROUP BY mp.id, mp.name, mp.package_type, mp.duration_days;

-- Check for any remaining 365-day durations in personal training
SELECT 'Remaining 365-day personal training items:' as warning;
SELECT 'Packages:' as type, COUNT(*) as count
FROM membership_packages 
WHERE package_type = 'personal' AND duration_days = 365
UNION ALL
SELECT 'Package Durations:' as type, COUNT(*) as count
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.package_type = 'personal' AND mpd.duration_days = 365;

-- ========================================
-- PHASE 5: UPDATE PERSONAL TRAINING CODES EXPIRATION
-- ========================================

SELECT 'PHASE 5: Updating personal training codes expiration...' as phase;

-- Update any existing personal training codes that have long expiration dates
-- Set them to expire in 30 days from now if they expire more than 30 days from now
UPDATE personal_training_codes 
SET 
    expires_at = NOW() + INTERVAL '30 days',
    updated_at = NOW()
WHERE package_type = 'personal'
AND is_active = true
AND (expires_at IS NULL OR expires_at > NOW() + INTERVAL '30 days');

-- Log the changes
SELECT 'Updated personal training codes:' as info;
SELECT code, package_type, expires_at, is_active
FROM personal_training_codes
WHERE package_type = 'personal'
ORDER BY created_at DESC
LIMIT 10;

SELECT 'PERSONAL TRAINING DURATION CHANGE TO 30 DAYS COMPLETED!' as completion_status;
