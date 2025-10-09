-- Check QR System Feature Flag Status
-- This script checks if the QR system feature flag exists and is enabled

-- Check if feature_flags table exists
SELECT 'Checking feature_flags table...' as step;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'feature_flags'
) as table_exists;

-- Check if FEATURE_QR_SYSTEM flag exists
SELECT 'Checking FEATURE_QR_SYSTEM flag...' as step;
SELECT 
    name,
    is_enabled,
    description,
    created_at,
    updated_at
FROM feature_flags 
WHERE name = 'FEATURE_QR_SYSTEM';

-- Check all feature flags
SELECT 'All feature flags:' as step;
SELECT 
    name,
    is_enabled,
    description
FROM feature_flags 
ORDER BY name;

-- If flag doesn't exist, create it
INSERT INTO feature_flags (name, is_enabled, description) VALUES 
('FEATURE_QR_SYSTEM', true, 'QR Code entrance/exit system')
ON CONFLICT (name) DO UPDATE SET 
    is_enabled = true, 
    updated_at = NOW();

-- Verify the flag is now enabled
SELECT 'Final status:' as step;
SELECT 
    name,
    is_enabled,
    description,
    updated_at
FROM feature_flags 
WHERE name = 'FEATURE_QR_SYSTEM';
