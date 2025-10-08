-- WEEKLY PILATES REFILL SYSTEM - DOWN MIGRATION (ROLLBACK)
-- Safe rollback script to remove weekly Pilates refill functionality

-- ========================================
-- PHASE 1: DISABLE FEATURE FLAG
-- ========================================

SELECT 'PHASE 1: Disabling feature flag...' as phase;

-- Disable the weekly refill feature flag
UPDATE public.feature_flags 
SET is_enabled = false, updated_at = now()
WHERE name = 'weekly_pilates_refill_enabled';

-- ========================================
-- PHASE 1.5: RESTORE ORIGINAL PILATES DEPOSITS RLS POLICIES
-- ========================================

SELECT 'PHASE 1.5: Restoring original pilates_deposits RLS policies...' as phase;

-- Drop the policies we created
DROP POLICY IF EXISTS pilates_deposits_insert_admin_only ON public.pilates_deposits;
DROP POLICY IF EXISTS pilates_deposits_update_admin_only ON public.pilates_deposits;
DROP POLICY IF EXISTS pilates_deposits_delete_admin_only ON public.pilates_deposits;

-- Note: Original policies should be restored based on your system's original setup

-- ========================================
-- PHASE 2: DROP FUNCTIONS
-- ========================================

SELECT 'PHASE 2: Dropping functions...' as phase;

-- Drop the weekly refill functions
DROP FUNCTION IF EXISTS public.process_weekly_pilates_refills();
DROP FUNCTION IF EXISTS public.get_user_weekly_refill_status(UUID);
DROP FUNCTION IF EXISTS public.manual_trigger_weekly_refill(UUID);

-- ========================================
-- PHASE 3: RESTORE ORIGINAL ULTIMATE ACTIVATION
-- ========================================

SELECT 'PHASE 3: Restoring original Ultimate activation...' as phase;

-- Restore the original create_ultimate_dual_memberships function without Pilates deposit crediting
CREATE OR REPLACE FUNCTION public.create_ultimate_dual_memberships(
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
-- PHASE 4: DROP TABLES
-- ========================================

SELECT 'PHASE 4: Dropping tables...' as phase;

-- Drop the weekly refills table
DROP TABLE IF EXISTS public.ultimate_weekly_refills CASCADE;

-- Note: We keep feature_flags table as it might be used for other features
-- If you want to remove it completely, uncomment the line below:
-- DROP TABLE IF EXISTS public.feature_flags CASCADE;

-- ========================================
-- PHASE 5: CLEANUP INDEXES
-- ========================================

SELECT 'PHASE 5: Cleaning up indexes...' as phase;

-- Indexes are automatically dropped with the tables
-- No manual cleanup needed

-- ========================================
-- PHASE 6: VERIFY ROLLBACK
-- ========================================

SELECT 'PHASE 6: Verifying rollback...' as phase;

-- Check that functions are dropped
SELECT 
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'process_weekly_pilates_refills'
            AND routine_schema = 'public'
        ) THEN 'Functions successfully removed'
        ELSE 'Functions still exist - check manually'
    END as function_cleanup_status;

-- Check that tables are dropped
SELECT 
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'ultimate_weekly_refills'
            AND table_schema = 'public'
        ) THEN 'Tables successfully removed'
        ELSE 'Tables still exist - check manually'
    END as table_cleanup_status;

SELECT 'Weekly Pilates refill system rollback completed!' as result;
