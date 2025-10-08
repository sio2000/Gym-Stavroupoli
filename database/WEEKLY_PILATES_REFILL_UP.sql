-- WEEKLY PILATES REFILL SYSTEM - UP MIGRATION
-- Safe, idempotent migration for weekly Pilates deposit refills
-- for Ultimate (500€) and Ultimate Medium (400€) packages

-- ========================================
-- PHASE 1: CREATE WEEKLY REFILL TRACKING TABLE
-- ========================================

SELECT 'PHASE 1: Creating weekly refill tracking table...' as phase;

-- Create table to track weekly refills for Ultimate packages
CREATE TABLE IF NOT EXISTS public.ultimate_weekly_refills (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    membership_id uuid NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
    source_request_id uuid REFERENCES public.membership_requests(id) ON DELETE SET NULL,
    package_name text NOT NULL CHECK (package_name IN ('Ultimate', 'Ultimate Medium')),
    activation_date date NOT NULL,
    refill_date date NOT NULL,
    refill_week_number integer NOT NULL,
    target_deposit_amount integer NOT NULL,
    previous_deposit_amount integer NOT NULL,
    new_deposit_amount integer NOT NULL,
    pilates_deposit_id uuid REFERENCES public.pilates_deposits(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
    
    -- Ensure one refill per user per week
    UNIQUE(user_id, refill_date),
    
    -- Ensure refill week is positive
    CHECK (refill_week_number > 0),
    
    -- Ensure new amount is not less than previous
    CHECK (new_deposit_amount >= previous_deposit_amount)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ultimate_weekly_refills_user ON public.ultimate_weekly_refills(user_id);
CREATE INDEX IF NOT EXISTS idx_ultimate_weekly_refills_date ON public.ultimate_weekly_refills(refill_date);
CREATE INDEX IF NOT EXISTS idx_ultimate_weekly_refills_membership ON public.ultimate_weekly_refills(membership_id);
CREATE INDEX IF NOT EXISTS idx_ultimate_weekly_refills_source ON public.ultimate_weekly_refills(source_request_id);

-- ========================================
-- PHASE 2: CREATE FEATURE FLAG TABLE
-- ========================================

SELECT 'PHASE 2: Creating feature flag table...' as phase;

-- Create feature flags table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    is_enabled boolean NOT NULL DEFAULT false,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES public.user_profiles(user_id) ON DELETE SET NULL
);

-- Insert the weekly refill feature flag
INSERT INTO public.feature_flags (name, is_enabled, description)
VALUES ('weekly_pilates_refill_enabled', false, 'Enable weekly Pilates deposit refills for Ultimate packages')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- PHASE 3: CREATE WEEKLY REFILL FUNCTION
-- ========================================

SELECT 'PHASE 3: Creating weekly refill function...' as phase;

-- Function to process weekly refills for Ultimate packages
CREATE OR REPLACE FUNCTION public.process_weekly_pilates_refills()
RETURNS TABLE(
    processed_count integer,
    success_count integer,
    error_count integer,
    details jsonb
) AS $$
DECLARE
    v_processed_count integer := 0;
    v_success_count integer := 0;
    v_error_count integer := 0;
    v_details jsonb := '[]'::jsonb;
    v_refill_record record;
    v_user_record record;
    v_active_deposit record;
    v_new_deposit_amount integer;
    v_target_deposit_amount integer;
    v_pilates_package_id uuid;
    v_deposit_id uuid;
    v_refill_date date;
    v_refill_week integer;
    v_error_message text;
BEGIN
    -- Check if feature is enabled
    IF NOT EXISTS (
        SELECT 1 FROM public.feature_flags 
        WHERE name = 'weekly_pilates_refill_enabled' 
        AND is_enabled = true
    ) THEN
        RETURN QUERY SELECT 0, 0, 0, '{"error": "Feature disabled"}'::jsonb;
        RETURN;
    END IF;

    -- Get Pilates package ID
    SELECT id INTO v_pilates_package_id 
    FROM public.membership_packages 
    WHERE name = 'Pilates' 
    LIMIT 1;

    IF v_pilates_package_id IS NULL THEN
        RETURN QUERY SELECT 0, 0, 1, '{"error": "Pilates package not found"}'::jsonb;
        RETURN;
    END IF;

    -- Set refill date to today
    v_refill_date := CURRENT_DATE;

    -- Process each active Ultimate membership
    FOR v_user_record IN (
        SELECT 
            m.id as membership_id,
            m.user_id,
            m.start_date as activation_date,
            m.end_date,
            m.source_request_id,
            mp.name as package_name
        FROM public.memberships m
        JOIN public.membership_packages mp ON m.package_id = mp.id
        WHERE m.source_package_name IN ('Ultimate', 'Ultimate Medium')
        AND m.is_active = true
        AND m.start_date <= v_refill_date
        AND m.end_date >= v_refill_date
        AND NOT EXISTS (
            SELECT 1 FROM public.ultimate_weekly_refills uwr
            WHERE uwr.user_id = m.user_id 
            AND uwr.refill_date = v_refill_date
        )
    ) LOOP
        v_processed_count := v_processed_count + 1;
        
        BEGIN
            -- Calculate refill week number
            v_refill_week := EXTRACT(DAYS FROM v_refill_date - v_user_record.activation_date) / 7 + 1;
            
            -- Skip if not a weekly refill day (should be every 7 days from activation)
            IF EXTRACT(DAYS FROM v_refill_date - v_user_record.activation_date) % 7 != 0 THEN
                CONTINUE;
            END IF;
            
            -- Determine target deposit amount based on package
            v_target_deposit_amount := CASE 
                WHEN v_user_record.package_name = 'Ultimate' THEN 3
                WHEN v_user_record.package_name = 'Ultimate Medium' THEN 1
                ELSE 0
            END;
            
            IF v_target_deposit_amount = 0 THEN
                CONTINUE;
            END IF;
            
            -- Get current active deposit
            SELECT * INTO v_active_deposit 
            FROM public.get_active_pilates_deposit(v_user_record.user_id);
            
            -- Calculate new deposit amount (top-up to target)
            v_new_deposit_amount := GREATEST(
                COALESCE(v_active_deposit.deposit_remaining, 0), 
                v_target_deposit_amount
            );
            
            -- Only process if we need to top-up
            IF v_new_deposit_amount > COALESCE(v_active_deposit.deposit_remaining, 0) THEN
                -- Create or update Pilates deposit
                IF v_active_deposit.id IS NOT NULL THEN
                    -- Update existing deposit
                    UPDATE public.pilates_deposits 
                    SET 
                        deposit_remaining = v_new_deposit_amount,
                        is_active = true,
                        updated_at = now()
                    WHERE id = v_active_deposit.id
                    RETURNING id INTO v_deposit_id;
                ELSE
                    -- Create new deposit
                    INSERT INTO public.pilates_deposits (
                        user_id, 
                        package_id, 
                        deposit_remaining, 
                        expires_at, 
                        is_active,
                        created_by
                    ) VALUES (
                        v_user_record.user_id,
                        v_pilates_package_id,
                        v_new_deposit_amount,
                        v_user_record.end_date + INTERVAL '23:59:59',
                        true,
                        NULL -- System created
                    ) RETURNING id INTO v_deposit_id;
                END IF;
                
                -- Record the refill
                INSERT INTO public.ultimate_weekly_refills (
                    user_id,
                    membership_id,
                    source_request_id,
                    package_name,
                    activation_date,
                    refill_date,
                    refill_week_number,
                    target_deposit_amount,
                    previous_deposit_amount,
                    new_deposit_amount,
                    pilates_deposit_id,
                    created_by
                ) VALUES (
                    v_user_record.user_id,
                    v_user_record.membership_id,
                    v_user_record.source_request_id,
                    v_user_record.package_name,
                    v_user_record.activation_date,
                    v_refill_date,
                    v_refill_week,
                    v_target_deposit_amount,
                    COALESCE(v_active_deposit.deposit_remaining, 0),
                    v_new_deposit_amount,
                    v_deposit_id,
                    NULL -- System created
                );
                
                v_success_count := v_success_count + 1;
                
                -- Add to details
                v_details := v_details || jsonb_build_object(
                    'user_id', v_user_record.user_id,
                    'package_name', v_user_record.package_name,
                    'previous_amount', COALESCE(v_active_deposit.deposit_remaining, 0),
                    'new_amount', v_new_deposit_amount,
                    'week_number', v_refill_week
                );
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                v_error_count := v_error_count + 1;
                v_error_message := SQLERRM;
                
                -- Add error to details
                v_details := v_details || jsonb_build_object(
                    'user_id', v_user_record.user_id,
                    'error', v_error_message
                );
        END;
    END LOOP;
    
    RETURN QUERY SELECT v_processed_count, v_success_count, v_error_count, v_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PHASE 4: CREATE HELPER FUNCTIONS
-- ========================================

SELECT 'PHASE 4: Creating helper functions...' as phase;

-- Function to get refill status for a user
CREATE OR REPLACE FUNCTION public.get_user_weekly_refill_status(p_user_id uuid)
RETURNS TABLE(
    user_id uuid,
    package_name text,
    activation_date date,
    next_refill_date date,
    next_refill_week integer,
    current_deposit_amount integer,
    target_deposit_amount integer,
    is_refill_due boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.user_id,
        mp.name as package_name,
        m.start_date as activation_date,
        (m.start_date + INTERVAL '1 day' * (7 * CEIL(EXTRACT(DAYS FROM CURRENT_DATE - m.start_date) / 7.0)))::date as next_refill_date,
        CEIL(EXTRACT(DAYS FROM CURRENT_DATE - m.start_date) / 7.0)::integer as next_refill_week,
        COALESCE(pd.deposit_remaining, 0) as current_deposit_amount,
        CASE 
            WHEN mp.name = 'Ultimate' THEN 3
            WHEN mp.name = 'Ultimate Medium' THEN 1
            ELSE 0
        END as target_deposit_amount,
        (EXTRACT(DAYS FROM CURRENT_DATE - m.start_date) % 7 = 0) as is_refill_due
    FROM public.memberships m
    JOIN public.membership_packages mp ON m.package_id = mp.id
    LEFT JOIN public.get_active_pilates_deposit(m.user_id) pd ON true
    WHERE m.user_id = p_user_id
    AND m.source_package_name IN ('Ultimate', 'Ultimate Medium')
    AND m.is_active = true
    AND m.start_date <= CURRENT_DATE
    AND m.end_date >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to manually trigger refill for a user
CREATE OR REPLACE FUNCTION public.manual_trigger_weekly_refill(p_user_id uuid)
RETURNS TABLE(
    success boolean,
    message text,
    details jsonb
) AS $$
DECLARE
    v_result record;
BEGIN
    -- Check if user has active Ultimate membership
    IF NOT EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.user_id = p_user_id
        AND m.source_package_name IN ('Ultimate', 'Ultimate Medium')
        AND m.is_active = true
        AND m.start_date <= CURRENT_DATE
        AND m.end_date >= CURRENT_DATE
    ) THEN
        RETURN QUERY SELECT false, 'No active Ultimate membership found', '{}'::jsonb;
        RETURN;
    END IF;
    
    -- Process refill
    SELECT * INTO v_result FROM public.process_weekly_pilates_refills() WHERE processed_count > 0 LIMIT 1;
    
    IF v_result IS NULL OR v_result.success_count = 0 THEN
        RETURN QUERY SELECT false, 'No refills processed', COALESCE(v_result.details, '{}'::jsonb);
    ELSE
        RETURN QUERY SELECT true, 'Refill processed successfully', v_result.details;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PHASE 5: ADD PILATES DEPOSIT CREDITING TO ULTIMATE ACTIVATION
-- ========================================

SELECT 'PHASE 5: Updating Ultimate activation to credit Pilates deposits...' as phase;

-- Update the create_ultimate_dual_memberships function to include Pilates deposit crediting
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
    v_ultimate_package_id UUID;
    v_deposit_amount INTEGER;
    v_pilates_deposit_id UUID;
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
    
    -- Get the Ultimate package ID for deposit crediting
    SELECT id INTO v_ultimate_package_id
    FROM membership_packages
    WHERE name = v_source_package_name
    LIMIT 1;
    
    -- Determine initial deposit amount based on package
    v_deposit_amount := CASE 
        WHEN v_source_package_name = 'Ultimate' THEN 3
        WHEN v_source_package_name = 'Ultimate Medium' THEN 1
        ELSE 0
    END;
    
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
    
    -- Create initial Pilates deposit if amount > 0
    IF v_deposit_amount > 0 THEN
        INSERT INTO public.pilates_deposits (
            user_id,
            package_id,
            deposit_remaining,
            expires_at,
            is_active,
            created_by
        ) VALUES (
            p_user_id,
            v_ultimate_package_id,
            v_deposit_amount,
            v_end_date + INTERVAL '23:59:59',
            true,
            NULL -- System created
        ) RETURNING id INTO v_pilates_deposit_id;
    END IF;
    
    -- Return result with both membership IDs and deposit info
    v_result := jsonb_build_object(
        'success', true,
        'pilates_membership_id', v_pilates_membership_id,
        'free_gym_membership_id', v_free_gym_membership_id,
        'start_date', p_start_date,
        'end_date', v_end_date,
        'duration_days', p_duration_days,
        'source_package_name', v_source_package_name,
        'initial_deposit_amount', v_deposit_amount,
        'pilates_deposit_id', v_pilates_deposit_id
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
-- PHASE 6: GRANT PERMISSIONS
-- ========================================

SELECT 'PHASE 6: Granting permissions...' as phase;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.process_weekly_pilates_refills() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_weekly_refill_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manual_trigger_weekly_refill(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_ultimate_dual_memberships(UUID, UUID, INTEGER, DATE) TO authenticated;

-- Grant table permissions
GRANT SELECT ON public.ultimate_weekly_refills TO authenticated;
GRANT SELECT ON public.feature_flags TO authenticated;

-- ========================================
-- PHASE 7: CREATE RLS POLICIES
-- ========================================

SELECT 'PHASE 7: Creating RLS policies...' as phase;

-- Enable RLS on new tables
ALTER TABLE public.ultimate_weekly_refills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ultimate_weekly_refills (with IF NOT EXISTS check)
DROP POLICY IF EXISTS ultimate_weekly_refills_select_own_or_admin ON public.ultimate_weekly_refills;
DROP POLICY IF EXISTS ultimate_weekly_refills_modify_admin_only ON public.ultimate_weekly_refills;

CREATE POLICY ultimate_weekly_refills_select_own_or_admin ON public.ultimate_weekly_refills
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

CREATE POLICY ultimate_weekly_refills_modify_admin_only ON public.ultimate_weekly_refills
    FOR ALL USING (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    ) WITH CHECK (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

-- Create RLS policies for feature_flags (with IF NOT EXISTS check)
DROP POLICY IF EXISTS feature_flags_select_admin_only ON public.feature_flags;
DROP POLICY IF EXISTS feature_flags_modify_admin_only ON public.feature_flags;

CREATE POLICY feature_flags_select_admin_only ON public.feature_flags
    FOR SELECT USING (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

CREATE POLICY feature_flags_modify_admin_only ON public.feature_flags
    FOR ALL USING (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    ) WITH CHECK (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

-- ========================================
-- PHASE 8: FIX PILATES DEPOSITS RLS POLICIES
-- ========================================

SELECT 'PHASE 8: Fixing pilates_deposits RLS policies...' as phase;

-- Drop existing problematic policies
DROP POLICY IF EXISTS pilates_deposits_select_own_or_admin ON public.pilates_deposits;
DROP POLICY IF EXISTS pilates_deposits_modify_admin_only ON public.pilates_deposits;

-- Create corrected RLS policies for pilates_deposits
CREATE POLICY pilates_deposits_select_own_or_admin ON public.pilates_deposits
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

CREATE POLICY pilates_deposits_insert_admin_only ON public.pilates_deposits
    FOR INSERT WITH CHECK (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

CREATE POLICY pilates_deposits_update_admin_only ON public.pilates_deposits
    FOR UPDATE USING (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    ) WITH CHECK (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

CREATE POLICY pilates_deposits_delete_admin_only ON public.pilates_deposits
    FOR DELETE USING (
        (EXISTS (SELECT 1 FROM auth.jwt() j WHERE (j ->> 'role') IN ('admin','secretary')))
    );

SELECT 'Weekly Pilates refill system created successfully!' as result;
