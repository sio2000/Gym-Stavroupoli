-- Add missing installment columns to membership_requests table
-- This script adds the missing columns for installment locking and deletion

-- Add installment locking columns
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS installment_1_locked BOOLEAN DEFAULT false;
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS installment_2_locked BOOLEAN DEFAULT false;
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS installment_3_locked BOOLEAN DEFAULT false;

-- Add third installment deletion columns
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS third_installment_deleted BOOLEAN DEFAULT false;
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS third_installment_deleted_at TIMESTAMPTZ;
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS third_installment_deleted_by UUID REFERENCES user_profiles(id);

-- Add comments to explain the columns
COMMENT ON COLUMN membership_requests.installment_1_locked IS 'Whether the first installment is locked (cannot be modified)';
COMMENT ON COLUMN membership_requests.installment_2_locked IS 'Whether the second installment is locked (cannot be modified)';
COMMENT ON COLUMN membership_requests.installment_3_locked IS 'Whether the third installment is locked (cannot be modified)';
COMMENT ON COLUMN membership_requests.third_installment_deleted IS 'Whether the third installment has been permanently deleted';
COMMENT ON COLUMN membership_requests.third_installment_deleted_at IS 'When the third installment was deleted';
COMMENT ON COLUMN membership_requests.third_installment_deleted_by IS 'Who deleted the third installment';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_membership_requests_installment_locked 
ON membership_requests (installment_1_locked, installment_2_locked, installment_3_locked);

CREATE INDEX IF NOT EXISTS idx_membership_requests_third_deleted 
ON membership_requests (third_installment_deleted);
