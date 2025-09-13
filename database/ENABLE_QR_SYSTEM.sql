-- Enable QR System Feature Flag
-- This script enables the QR system for testing

-- Enable the QR system feature flag
UPDATE feature_flags 
SET is_enabled = true, updated_at = NOW()
WHERE name = 'FEATURE_QR_SYSTEM';

-- Verify the feature flag is enabled
SELECT 'Feature flag status:' as status;
SELECT name, is_enabled, description, updated_at 
FROM feature_flags 
WHERE name = 'FEATURE_QR_SYSTEM';

-- Success message
SELECT 'QR System enabled successfully!' as result;
