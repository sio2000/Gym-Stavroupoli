-- UPDATE ULTIMATE DUAL ACTIVATION FOR ULTIMATE MEDIUM
-- This script updates the create_ultimate_dual_memberships function to support Ultimate Medium

-- ========================================
-- PHASE 1: UPDATE DUAL ACTIVATION FUNCTION
-- ========================================

SELECT 'PHASE 1: Updating dual activation function for Ultimate Medium...' as phase;

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
-- PHASE 2: VERIFY FUNCTION UPDATE
-- ========================================

SELECT 'PHASE 2: Verifying function update...' as phase;

-- Check the function signature
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'create_ultimate_dual_memberships'
AND routine_schema = 'public';

SELECT 'Ultimate dual activation function updated for Ultimate Medium!' as result;
