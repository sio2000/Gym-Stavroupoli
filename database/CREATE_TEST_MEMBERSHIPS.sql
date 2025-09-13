-- CREATE TEST MEMBERSHIPS FOR ALL CATEGORIES
-- This script creates test memberships for Free Gym, Pilates, and Personal Training

-- Step 1: Get or create a test user
DO $$
DECLARE
    test_user_id UUID;
    free_gym_package_id UUID;
    pilates_package_id UUID;
    personal_package_id UUID;
    current_date DATE := CURRENT_DATE;
BEGIN
    -- Get first user from user_profiles, or create one if none exists
    SELECT user_id INTO test_user_id 
    FROM user_profiles 
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        -- Create a test user
        INSERT INTO user_profiles (user_id, email, first_name, last_name, role)
        VALUES (gen_random_uuid(), 'test@freegym.gr', 'Test', 'User', 'user')
        RETURNING user_id INTO test_user_id;
        
        RAISE NOTICE 'Created test user: %', test_user_id;
    ELSE
        RAISE NOTICE 'Using existing user: %', test_user_id;
    END IF;
    
    -- Get package IDs
    SELECT id INTO free_gym_package_id FROM membership_packages WHERE package_type = 'free_gym' LIMIT 1;
    SELECT id INTO pilates_package_id FROM membership_packages WHERE package_type = 'pilates' LIMIT 1;
    SELECT id INTO personal_package_id FROM membership_packages WHERE package_type = 'personal_training' LIMIT 1;
    
    -- If personal_training doesn't exist, try 'personal'
    IF personal_package_id IS NULL THEN
        SELECT id INTO personal_package_id FROM membership_packages WHERE package_type = 'personal' LIMIT 1;
    END IF;
    
    RAISE NOTICE 'Package IDs - Free Gym: %, Pilates: %, Personal: %', 
        free_gym_package_id, pilates_package_id, personal_package_id;
    
    -- Clean up existing memberships for this user
    DELETE FROM memberships WHERE user_id = test_user_id;
    RAISE NOTICE 'Cleaned up existing memberships for test user';
    
    -- Create Free Gym membership
    IF free_gym_package_id IS NOT NULL THEN
        INSERT INTO memberships (user_id, package_id, duration_type, start_date, end_date, is_active)
        VALUES (test_user_id, free_gym_package_id, 'month', current_date, current_date + INTERVAL '1 month', true);
        RAISE NOTICE 'Created Free Gym membership';
    ELSE
        RAISE NOTICE 'Free Gym package not found - skipping';
    END IF;
    
    -- Create Pilates membership
    IF pilates_package_id IS NOT NULL THEN
        INSERT INTO memberships (user_id, package_id, duration_type, start_date, end_date, is_active)
        VALUES (test_user_id, pilates_package_id, 'month', current_date, current_date + INTERVAL '1 month', true);
        RAISE NOTICE 'Created Pilates membership';
    ELSE
        RAISE NOTICE 'Pilates package not found - skipping';
    END IF;
    
    -- Create Personal Training membership
    IF personal_package_id IS NOT NULL THEN
        INSERT INTO memberships (user_id, package_id, duration_type, start_date, end_date, is_active)
        VALUES (test_user_id, personal_package_id, 'month', current_date, current_date + INTERVAL '1 month', true);
        RAISE NOTICE 'Created Personal Training membership';
    ELSE
        RAISE NOTICE 'Personal Training package not found - skipping';
    END IF;
    
    RAISE NOTICE 'Test memberships created successfully for user: %', test_user_id;
    RAISE NOTICE 'You can now test QR code generation for all categories!';
    
END $$;

-- Step 2: Verify the test data
SELECT 
    'Test Memberships Created' as info,
    m.id,
    m.user_id,
    m.is_active,
    m.start_date,
    m.end_date,
    mp.name as package_name,
    mp.package_type
FROM memberships m
JOIN membership_packages mp ON m.package_id = mp.id
ORDER BY mp.package_type;
