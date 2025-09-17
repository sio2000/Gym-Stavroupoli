-- Ultimate Package Dual Activation System
-- This script adds functionality to automatically create 2 separate memberships 
-- (Pilates + Free Gym) when an Ultimate package is approved

-- Create a function to handle Ultimate package approval with dual activation
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
        'Ultimate'
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
        'Ultimate'
    ) RETURNING id INTO v_free_gym_membership_id;
    
    -- Return result with both membership IDs
    v_result := jsonb_build_object(
        'success', true,
        'pilates_membership_id', v_pilates_membership_id,
        'free_gym_membership_id', v_free_gym_membership_id,
        'start_date', p_start_date,
        'end_date', v_end_date,
        'duration_days', p_duration_days
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

-- Add columns to memberships table to track Ultimate package source
ALTER TABLE "public"."memberships" 
ADD COLUMN IF NOT EXISTS "source_request_id" UUID,
ADD COLUMN IF NOT EXISTS "source_package_name" TEXT;

-- Add comments for the new columns
COMMENT ON COLUMN "public"."memberships"."source_request_id" IS 'ID of the original membership request that created this membership (useful for Ultimate dual activation)';
COMMENT ON COLUMN "public"."memberships"."source_package_name" IS 'Name of the original package that created this membership (e.g., Ultimate, Pilates, Free Gym)';

-- Create index for faster queries on Ultimate-sourced memberships
CREATE INDEX IF NOT EXISTS "idx_memberships_source_request" 
ON "public"."memberships" ("source_request_id");

CREATE INDEX IF NOT EXISTS "idx_memberships_source_package" 
ON "public"."memberships" ("source_package_name");

-- Create a function to get all memberships created by an Ultimate request
CREATE OR REPLACE FUNCTION get_ultimate_sourced_memberships(p_request_id UUID)
RETURNS TABLE(
    membership_id UUID,
    user_id UUID,
    package_id UUID,
    package_name TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as membership_id,
        m.user_id,
        m.package_id,
        mp.name as package_name,
        m.start_date,
        m.end_date,
        m.is_active,
        m.expires_at
    FROM memberships m
    JOIN membership_packages mp ON m.package_id = mp.id
    WHERE m.source_request_id = p_request_id
    AND m.source_package_name = 'Ultimate'
    ORDER BY mp.name;
END;
$$ LANGUAGE plpgsql;

-- Create a function to expire Ultimate-sourced memberships together
CREATE OR REPLACE FUNCTION expire_ultimate_memberships(p_request_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_affected_count INTEGER;
BEGIN
    -- Update all memberships created by this Ultimate request
    UPDATE memberships 
    SET 
        is_active = false,
        updated_at = NOW()
    WHERE source_request_id = p_request_id
    AND source_package_name = 'Ultimate'
    AND is_active = true;
    
    GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    
    RETURN v_affected_count;
END;
$$ LANGUAGE plpgsql;

-- Create a view to easily see Ultimate dual memberships
CREATE OR REPLACE VIEW ultimate_dual_memberships_view AS
SELECT 
    mr.id as request_id,
    mr.user_id,
    up.first_name,
    up.last_name,
    up.email,
    mr.status as request_status,
    mr.created_at as request_created_at,
    
    -- Pilates membership info
    pm.id as pilates_membership_id,
    pm.start_date as pilates_start_date,
    pm.end_date as pilates_end_date,
    pm.is_active as pilates_is_active,
    
    -- Free Gym membership info  
    fm.id as free_gym_membership_id,
    fm.start_date as free_gym_start_date,
    fm.end_date as free_gym_end_date,
    fm.is_active as free_gym_is_active,
    
    -- Overall status
    CASE 
        WHEN pm.is_active = true AND fm.is_active = true THEN 'both_active'
        WHEN pm.is_active = true OR fm.is_active = true THEN 'partially_active'
        ELSE 'inactive'
    END as overall_status
    
FROM membership_requests mr
JOIN user_profiles up ON mr.user_id = up.user_id
JOIN membership_packages mp ON mr.package_id = mp.id
LEFT JOIN memberships pm ON pm.source_request_id = mr.id 
    AND pm.source_package_name = 'Ultimate'
    AND pm.package_id = (SELECT id FROM membership_packages WHERE name = 'Pilates' LIMIT 1)
LEFT JOIN memberships fm ON fm.source_request_id = mr.id 
    AND fm.source_package_name = 'Ultimate'
    AND fm.package_id = (SELECT id FROM membership_packages WHERE name = 'Free Gym' LIMIT 1)
WHERE mp.name = 'Ultimate'
ORDER BY mr.created_at DESC;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_ultimate_dual_memberships(UUID, UUID, INTEGER, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ultimate_sourced_memberships(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION expire_ultimate_memberships(UUID) TO authenticated;
GRANT SELECT ON ultimate_dual_memberships_view TO authenticated;

-- Create a trigger to automatically expire Ultimate memberships when they reach end_date
CREATE OR REPLACE FUNCTION auto_expire_ultimate_memberships()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if this is an Ultimate-sourced membership becoming inactive
    IF NEW.source_package_name = 'Ultimate' AND OLD.is_active = true AND NEW.is_active = false THEN
        -- Log the expiration (optional)
        INSERT INTO membership_logs (
            membership_id,
            action,
            details,
            created_at
        ) VALUES (
            NEW.id,
            'auto_expired',
            jsonb_build_object(
                'source_package', 'Ultimate',
                'source_request_id', NEW.source_request_id,
                'expired_at', NOW()
            ),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS membership_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID REFERENCES memberships(id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_expire_ultimate ON memberships;
CREATE TRIGGER trigger_auto_expire_ultimate
    AFTER UPDATE ON memberships
    FOR EACH ROW
    EXECUTE FUNCTION auto_expire_ultimate_memberships();

SELECT 'Ultimate dual activation system added successfully!' as result;
