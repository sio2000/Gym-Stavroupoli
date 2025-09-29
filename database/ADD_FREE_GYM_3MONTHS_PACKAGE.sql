-- ADD FREE GYM 3-MONTHS PACKAGE (99€)
-- Safe migration to add 3-month duration option to Free Gym package
-- Version: 1.0.0
-- Created: 2025-01-27
-- Feature: Add 3 months (99€) subscription package between 1-month and 6-month options

-- =============================================
-- BACKUP INSTRUCTIONS (RUN BEFORE MIGRATION)
-- =============================================
-- 1. Create full database backup:
--    pg_dump -h your-host -U your-user -d your-db > backup_before_3months_package_$(date +%Y%m%d_%H%M%S).sql
-- 2. Test migration on staging environment first
-- 3. Verify rollback scripts work in staging

-- =============================================
-- MIGRATION: ADD 3-MONTHS DURATION TO FREE GYM
-- =============================================

-- Start transaction for safety
BEGIN;

-- Step 0: Fix constraints to include '3months' duration type
SELECT 'Step 0: Fixing constraints to include 3months duration type...' as step;

-- Drop and recreate membership_package_durations constraint
ALTER TABLE membership_package_durations 
DROP CONSTRAINT IF EXISTS membership_package_durations_duration_type_check;

ALTER TABLE membership_package_durations 
ADD CONSTRAINT membership_package_durations_duration_type_check 
CHECK (duration_type IN (
    'year', 
    'semester', 
    '3 Μήνες',  -- NEW: 3-month option for Free Gym (Greek)
    'month', 
    'lesson',
    'pilates_trial',
    'pilates_1month',
    'pilates_2months',
    'pilates_3months',
    'pilates_6months',
    'pilates_1year',
    'ultimate_1year'
));

-- Drop and recreate membership_requests constraint
ALTER TABLE membership_requests 
DROP CONSTRAINT IF EXISTS membership_requests_duration_type_check;

ALTER TABLE membership_requests 
ADD CONSTRAINT membership_requests_duration_type_check 
CHECK (duration_type IN (
    'year', 
    'semester', 
    '3 Μήνες',  -- NEW: 3-month option for Free Gym (Greek)
    'month', 
    'lesson',
    'pilates_trial',
    'pilates_1month',
    'pilates_2months',
    'pilates_3months',
    'pilates_6months',
    'pilates_1year',
    'ultimate_1year'
));

-- Drop and recreate memberships constraint
ALTER TABLE memberships 
DROP CONSTRAINT IF EXISTS memberships_duration_type_check;

ALTER TABLE memberships 
ADD CONSTRAINT memberships_duration_type_check 
CHECK (duration_type IN (
    'year', 
    'semester', 
    '3 Μήνες',  -- NEW: 3-month option for Free Gym (Greek)
    'month', 
    'lesson',
    'pilates_trial',
    'pilates_1month',
    'pilates_2months',
    'pilates_3months',
    'pilates_6months',
    'pilates_1year',
    'ultimate_1year'
));

-- Step 1: Verify Free Gym package exists
SELECT 'Step 1: Verifying Free Gym package exists...' as step;

DO $$
DECLARE
    free_gym_package_id UUID;
    package_exists BOOLEAN;
BEGIN
    -- Check if Free Gym package exists
    SELECT id INTO free_gym_package_id 
    FROM membership_packages 
    WHERE name = 'Free Gym' AND is_active = true;
    
    package_exists := (free_gym_package_id IS NOT NULL);
    
    IF NOT package_exists THEN
        RAISE EXCEPTION 'Free Gym package not found or inactive. Cannot add 3-months duration.';
    END IF;
    
    RAISE NOTICE 'Free Gym package found with ID: %', free_gym_package_id;
END $$;

-- Step 2: Check if 3-months duration already exists
SELECT 'Step 2: Checking if 3-months duration already exists...' as step;

DO $$
DECLARE
    duration_exists BOOLEAN;
    free_gym_package_id UUID;
BEGIN
    -- Get Free Gym package ID
    SELECT id INTO free_gym_package_id 
    FROM membership_packages 
    WHERE name = 'Free Gym' AND is_active = true;
    
    -- Check if 3-months duration already exists
    SELECT EXISTS(
        SELECT 1 FROM membership_package_durations 
        WHERE package_id = free_gym_package_id 
        AND duration_type = '3 Μήνες'
    ) INTO duration_exists;
    
    IF duration_exists THEN
        RAISE NOTICE '3-months duration already exists for Free Gym package. Skipping insertion.';
    ELSE
        RAISE NOTICE '3-months duration does not exist. Proceeding with insertion.';
    END IF;
END $$;

-- Step 3: Add 3-months duration option to Free Gym package
SELECT 'Step 3: Adding 3-months duration option...' as step;

INSERT INTO membership_package_durations (
    package_id,
    duration_type,
    duration_days,
    price,
    is_active,
    created_at,
    updated_at
)
SELECT 
    mp.id,
    '3months',
    90, -- 3 months = 90 days
    99.00, -- 99€ as requested
    true,
    NOW(),
    NOW()
FROM membership_packages mp
WHERE mp.name = 'Free Gym' 
AND mp.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM membership_package_durations mpd 
    WHERE mpd.package_id = mp.id 
    AND mpd.duration_type = '3 Μήνες'
);

-- Step 4: Verify insertion
SELECT 'Step 4: Verifying 3-months duration was added...' as step;

SELECT 
    mp.name as package_name,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.is_active,
    mpd.created_at
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Free Gym' 
AND mpd.duration_type = '3 Μήνες';

-- Step 5: Show updated Free Gym duration options in correct order
SELECT 'Step 5: Updated Free Gym duration options (sorted by duration):' as step;

SELECT 
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.is_active,
    CASE 
        WHEN mpd.duration_type = 'lesson' THEN 1
        WHEN mpd.duration_type = 'month' THEN 2
        WHEN mpd.duration_type = '3 Μήνες' THEN 3
        WHEN mpd.duration_type = 'semester' THEN 4
        WHEN mpd.duration_type = 'year' THEN 5
        ELSE 999
    END as sort_order
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Free Gym' 
AND mpd.is_active = true
ORDER BY sort_order;

-- Step 6: Success message
SELECT 'SUCCESS: 3-months (99€) duration added to Free Gym package!' as result;
SELECT 'New order: lesson (1d) → month (30d) → 3months (90d) → semester (180d) → year (365d)' as order_info;

-- Commit transaction
COMMIT;

-- =============================================
-- ROLLBACK SCRIPT (if needed)
-- =============================================
-- To rollback this migration, run:
-- DELETE FROM membership_package_durations 
-- WHERE package_id IN (SELECT id FROM membership_packages WHERE name = 'Free Gym')
-- AND duration_type = '3 Μήνες';
