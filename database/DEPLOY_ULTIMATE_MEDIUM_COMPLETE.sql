-- DEPLOY ULTIMATE MEDIUM COMPLETE
-- This script deploys the Ultimate Medium package step by step

-- ========================================
-- STEP 1: FIX CONSTRAINT DYNAMICALLY
-- ========================================

SELECT 'STEP 1: Fixing constraint dynamically...' as phase;

-- Dynamic constraint fix (inline)
DO $$
DECLARE
    v_current_duration_types TEXT[];
    v_new_constraint_definition TEXT;
    v_constraint_name TEXT := 'membership_package_durations_duration_type_check';
BEGIN
    -- STEP 1: Get all distinct duration_types currently in the table
    SELECT ARRAY_AGG(DISTINCT duration_type ORDER BY duration_type)
    INTO v_current_duration_types
    FROM membership_package_durations;

    RAISE NOTICE 'Existing duration types found: %', v_current_duration_types;

    -- STEP 2: Add 'ultimate_medium_1year' if not already present
    IF NOT (v_current_duration_types @> ARRAY['ultimate_medium_1year'::text]) THEN
        v_current_duration_types := ARRAY_APPEND(v_current_duration_types, 'ultimate_medium_1year'::text);
        RAISE NOTICE 'Added ultimate_medium_1year to the list.';
    END IF;

    -- Ensure 'ultimate_1year' is also present, as it's part of the original constraint
    IF NOT (v_current_duration_types @> ARRAY['ultimate_1year'::text]) THEN
        v_current_duration_types := ARRAY_APPEND(v_current_duration_types, 'ultimate_1year'::text);
        RAISE NOTICE 'Added ultimate_1year to the list.';
    END IF;

    -- Sort the array for consistency
    SELECT ARRAY_AGG(x ORDER BY x) INTO v_current_duration_types FROM UNNEST(v_current_duration_types) AS x;

    RAISE NOTICE 'Final list of duration types for constraint: %', v_current_duration_types;

    -- STEP 3: Drop the existing constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = v_constraint_name) THEN
        EXECUTE FORMAT('ALTER TABLE membership_package_durations DROP CONSTRAINT %I;', v_constraint_name);
        RAISE NOTICE 'Dropped existing constraint: %', v_constraint_name;
    ELSE
        RAISE NOTICE 'Constraint % does not exist, skipping drop.', v_constraint_name;
    END IF;

    -- STEP 4: Recreate the constraint with the updated list of duration types
    v_new_constraint_definition := FORMAT('ALTER TABLE membership_package_durations ADD CONSTRAINT %I CHECK ((duration_type = ANY (ARRAY[%s]::text[])))',
                                          v_constraint_name,
                                          ARRAY_TO_STRING(ARRAY(SELECT QUOTE_LITERAL(elem) FROM UNNEST(v_current_duration_types) AS elem), ', '));

    RAISE NOTICE 'Executing new constraint definition: %', v_new_constraint_definition;
    EXECUTE v_new_constraint_definition;

    RAISE NOTICE 'Successfully updated constraint % to include all necessary duration types.', v_constraint_name;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating constraint: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Verify the new constraint definition
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'membership_package_durations_duration_type_check';

-- ========================================
-- STEP 2: CREATE ULTIMATE MEDIUM PACKAGE
-- ========================================

SELECT 'STEP 2: Creating Ultimate Medium package...' as phase;

-- Create Ultimate Medium Package (3x/week Pilates + Free Gym for 1 year)
INSERT INTO membership_packages (
    id, 
    name, 
    description, 
    duration_days, 
    price, 
    package_type, 
    is_active, 
    features, 
    created_at, 
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'Ultimate Medium',
    '3x/week Pilates + Free Gym for 1 year with Installments Option',
    365,
    400.00, -- Price is €400 instead of €500
    'ultimate',
    true,
    '{"3x/week Pilates", "Free Gym Access", "Installments Available", "1 Year Duration"}',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM membership_packages WHERE name = 'Ultimate Medium');

-- ========================================
-- STEP 3: CREATE ULTIMATE MEDIUM DURATION
-- ========================================

SELECT 'STEP 3: Creating Ultimate Medium duration...' as phase;

-- Create Ultimate Medium package duration (1 year with installments)
WITH ultimate_medium_package AS (
    SELECT id FROM membership_packages WHERE name = 'Ultimate Medium' LIMIT 1
)
INSERT INTO membership_package_durations (
    id,
    package_id,
    duration_type,
    duration_days,
    price,
    classes_count,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    ump.id,
    'ultimate_medium_1year', -- Unique duration type for Ultimate Medium
    365,
    400.00, -- Price is €400 instead of €500
    156, -- 3 classes per week * 52 weeks (same as Ultimate)
    true,
    NOW(),
    NOW()
FROM ultimate_medium_package ump
WHERE EXISTS (SELECT 1 FROM ultimate_medium_package)
AND NOT EXISTS (SELECT 1 FROM membership_package_durations WHERE duration_type = 'ultimate_medium_1year');

-- ========================================
-- STEP 4: UPDATE DUAL ACTIVATION FUNCTION
-- ========================================

SELECT 'STEP 4: Updating dual activation function...' as phase;

-- Update the function to handle Ultimate Medium packages
CREATE OR REPLACE FUNCTION create_ultimate_dual_memberships(
    p_user_id UUID,
    p_ultimate_request_id UUID,
    p_duration_days INTEGER DEFAULT 365,
    p_start_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
DECLARE
    v_pilates_package_id UUID;
    v_free_gym_package_id UUID;
    v_end_date DATE;
    v_pilates_membership_id UUID;
    v_free_gym_membership_id UUID;
    v_result JSONB;
    v_source_package_name TEXT;
BEGIN
    -- Calculate end date
    v_end_date := p_start_date + INTERVAL '1 day' * p_duration_days;
    
    -- Get Pilates package ID
    SELECT id INTO v_pilates_package_id 
    FROM membership_packages 
    WHERE name = 'Pilates' 
    LIMIT 1;
    
    -- Get Free Gym package ID
    SELECT id INTO v_free_gym_package_id 
    FROM membership_packages 
    WHERE name = 'Free Gym' 
    LIMIT 1;
    
    -- Validate that both packages exist
    IF v_pilates_package_id IS NULL THEN
        RAISE EXCEPTION 'Pilates package not found';
    END IF;
    
    IF v_free_gym_package_id IS NULL THEN
        RAISE EXCEPTION 'Free Gym package not found';
    END IF;
    
    -- Determine source package name from the original request
    SELECT mp.name INTO v_source_package_name
    FROM membership_requests mr
    JOIN membership_packages mp ON mr.package_id = mp.id
    WHERE mr.id = p_ultimate_request_id;
    
    -- Default to 'Ultimate' if not found
    IF v_source_package_name IS NULL THEN
        v_source_package_name := 'Ultimate';
    END IF;
    
    -- Create Pilates membership
    INSERT INTO memberships (
        id,
        user_id,
        package_id,
        start_date,
        end_date,
        is_active,
        expires_at,
        created_at,
        updated_at,
        source_request_id,
        source_package_name
    ) VALUES (
        gen_random_uuid(),
        p_user_id,
        v_pilates_package_id,
        p_start_date,
        v_end_date,
        true,
        v_end_date + INTERVAL '23:59:59',
        NOW(),
        NOW(),
        p_ultimate_request_id,
        v_source_package_name
    ) RETURNING id INTO v_pilates_membership_id;
    
    -- Create Free Gym membership
    INSERT INTO memberships (
        id,
        user_id,
        package_id,
        start_date,
        end_date,
        is_active,
        expires_at,
        created_at,
        updated_at,
        source_request_id,
        source_package_name
    ) VALUES (
        gen_random_uuid(),
        p_user_id,
        v_free_gym_package_id,
        p_start_date,
        v_end_date,
        true,
        v_end_date + INTERVAL '23:59:59',
        NOW(),
        NOW(),
        p_ultimate_request_id,
        v_source_package_name
    ) RETURNING id INTO v_free_gym_membership_id;
    
    -- Return result with both membership IDs
    v_result := jsonb_build_object(
        'success', true,
        'pilates_membership_id', v_pilates_membership_id,
        'free_gym_membership_id', v_free_gym_membership_id,
        'start_date', p_start_date,
        'end_date', v_end_date,
        'duration_days', p_duration_days,
        'source_package_name', v_source_package_name
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error information
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 5: VERIFY IMPLEMENTATION
-- ========================================

SELECT 'STEP 5: Verifying implementation...' as phase;

-- Check Ultimate Medium package
SELECT 
    'Ultimate Medium Package:' as info,
    id, name, package_type, price, duration_days
FROM membership_packages 
WHERE name = 'Ultimate Medium';

-- Check Ultimate Medium duration
SELECT 
    'Ultimate Medium Duration:' as info,
    id, duration_type, price, duration_days, classes_count
FROM membership_package_durations 
WHERE duration_type = 'ultimate_medium_1year';

-- Compare prices
SELECT 
    'Price Comparison:' as info,
    ultimate.name as package_name,
    ultimate.price as ultimate_price,
    ultimate_medium.price as ultimate_medium_price,
    (ultimate.price - ultimate_medium.price) as price_difference
FROM 
    (SELECT name, price FROM membership_packages WHERE name = 'Ultimate') ultimate,
    (SELECT name, price FROM membership_packages WHERE name = 'Ultimate Medium') ultimate_medium;

SELECT 'Ultimate Medium deployment completed successfully!' as result;
