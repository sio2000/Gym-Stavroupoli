-- Check QR codes data in database
-- This script shows what QR codes exist and their categories

-- =============================================
-- STEP 1: CHECK ALL QR CODES
-- =============================================
SELECT 'All QR codes in database:' as status;
SELECT 
    id,
    user_id,
    category,
    status,
    qr_token,
    created_at
FROM qr_codes 
ORDER BY created_at DESC;

-- =============================================
-- STEP 2: CHECK QR TOKEN FORMAT
-- =============================================
SELECT 'QR token format analysis:' as status;
SELECT 
    id,
    category,
    qr_token,
    CASE 
        WHEN array_length(string_to_array(qr_token, ':'), 1) = 4 THEN 'Old format (no category)'
        WHEN array_length(string_to_array(qr_token, ':'), 1) = 5 THEN 'New format (with category)'
        ELSE 'Unknown format'
    END as token_format
FROM qr_codes;

-- =============================================
-- STEP 3: CHECK CATEGORY DISTRIBUTION
-- =============================================
SELECT 'Category distribution:' as status;
SELECT 
    category,
    COUNT(*) as count
FROM qr_codes 
GROUP BY category
ORDER BY count DESC;

-- =============================================
-- STEP 4: CHECK USER'S QR CODES
-- =============================================
SELECT 'User QR codes:' as status;
SELECT 
    id,
    category,
    status,
    qr_token,
    created_at
FROM qr_codes 
WHERE user_id = '2bf5fc31-2b64-4778-aecf-06d90abfd80d'
ORDER BY created_at DESC;

-- Success message
SELECT 'QR codes data checked!' as result;
