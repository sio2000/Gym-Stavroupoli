-- Add missing installment locking columns to membership_requests table
ALTER TABLE membership_requests 
ADD COLUMN IF NOT EXISTS installment_1_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS installment_2_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS installment_3_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS third_installment_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS third_installment_deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS third_installment_deleted_by UUID;

-- Add comments for documentation
COMMENT ON COLUMN membership_requests.installment_1_locked IS 'Indicates if the first installment is locked and cannot be modified';
COMMENT ON COLUMN membership_requests.installment_2_locked IS 'Indicates if the second installment is locked and cannot be modified';
COMMENT ON COLUMN membership_requests.installment_3_locked IS 'Indicates if the third installment is locked and cannot be modified';
COMMENT ON COLUMN membership_requests.third_installment_deleted IS 'Indicates if the third installment has been permanently deleted';
COMMENT ON COLUMN membership_requests.third_installment_deleted_at IS 'Timestamp when the third installment was deleted';
COMMENT ON COLUMN membership_requests.third_installment_deleted_by IS 'User ID who deleted the third installment';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_membership_requests_installment_1_locked ON membership_requests(installment_1_locked);
CREATE INDEX IF NOT EXISTS idx_membership_requests_installment_2_locked ON membership_requests(installment_2_locked);
CREATE INDEX IF NOT EXISTS idx_membership_requests_installment_3_locked ON membership_requests(installment_3_locked);
CREATE INDEX IF NOT EXISTS idx_membership_requests_third_installment_deleted ON membership_requests(third_installment_deleted);
