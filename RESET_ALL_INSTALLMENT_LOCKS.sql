-- Reset all installment locks to ensure clean state
-- This will unlock all installments and reset deletion flags

UPDATE membership_requests 
SET 
  installment_1_locked = FALSE,
  installment_2_locked = FALSE,
  installment_3_locked = FALSE,
  third_installment_deleted = FALSE,
  third_installment_deleted_at = NULL,
  third_installment_deleted_by = NULL
WHERE has_installments = TRUE;

-- Show the results
SELECT 
  'Reset completed' as status,
  COUNT(*) as total_requests_updated
FROM membership_requests 
WHERE has_installments = TRUE;

-- Show current state
SELECT 
  id,
  user_id,
  installment_1_locked,
  installment_2_locked,
  installment_3_locked,
  third_installment_deleted
FROM membership_requests 
WHERE has_installments = TRUE
ORDER BY created_at DESC
LIMIT 10;


