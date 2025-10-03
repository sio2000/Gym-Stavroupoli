-- Test script to verify delete third installment functionality
-- This script will help us test the database functions

-- First, let's see what membership requests exist with installments
SELECT 
    'Current membership requests with installments:' as info,
    id,
    has_installments,
    installment_1_locked,
    installment_2_locked,
    installment_3_locked,
    third_installment_deleted,
    third_installment_deleted_at,
    third_installment_deleted_by
FROM membership_requests 
WHERE has_installments = true 
ORDER BY created_at DESC
LIMIT 10;

-- Test the is_installment_locked function
SELECT 
    'Testing is_installment_locked function:' as info,
    id,
    is_installment_locked(id, 1) as installment_1_locked_status,
    is_installment_locked(id, 2) as installment_2_locked_status,
    is_installment_locked(id, 3) as installment_3_locked_status
FROM membership_requests 
WHERE has_installments = true 
LIMIT 5;

-- Test the delete_third_installment_permanently function (with a test request if available)
-- Note: This will only work if there are actual requests in the database
DO $$
DECLARE
    test_request_id UUID;
    test_user_id UUID := '00000000-0000-0000-0000-000000000000'::UUID; -- Replace with actual user ID
BEGIN
    -- Find a request with installments that hasn't been deleted yet
    SELECT id INTO test_request_id 
    FROM membership_requests 
    WHERE has_installments = true 
    AND third_installment_deleted = false 
    LIMIT 1;
    
    IF test_request_id IS NOT NULL THEN
        RAISE NOTICE 'Found test request: %', test_request_id;
        
        -- Test the delete function (this will actually delete the 3rd installment)
        -- Uncomment the next line only if you want to actually test the deletion
        -- PERFORM delete_third_installment_permanently(test_request_id, test_user_id);
        
        RAISE NOTICE 'Delete function test completed (no actual deletion performed)';
    ELSE
        RAISE NOTICE 'No suitable test request found';
    END IF;
END $$;
