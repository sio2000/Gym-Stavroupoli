-- Update existing data to ensure consistency
-- Set installment_1_locked = TRUE for existing locked installments
UPDATE membership_requests 
SET installment_1_locked = TRUE
WHERE id IN (
  SELECT DISTINCT request_id 
  FROM locked_installments 
  WHERE installment_number = 1
);

-- Set installment_2_locked = TRUE for existing locked installments
UPDATE membership_requests 
SET installment_2_locked = TRUE
WHERE id IN (
  SELECT DISTINCT request_id 
  FROM locked_installments 
  WHERE installment_number = 2
);

-- Set installment_3_locked = TRUE for existing locked installments
UPDATE membership_requests 
SET installment_3_locked = TRUE
WHERE id IN (
  SELECT DISTINCT request_id 
  FROM locked_installments 
  WHERE installment_number = 3
);

-- Set third_installment_deleted = TRUE for existing deleted third installments
UPDATE membership_requests 
SET 
  third_installment_deleted = TRUE,
  installment_3_locked = TRUE
WHERE id IN (
  SELECT DISTINCT request_id 
  FROM locked_installments 
  WHERE installment_number = 3 AND deleted_at IS NOT NULL
);
