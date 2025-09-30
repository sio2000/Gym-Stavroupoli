-- Fix missing approval_status column in personal_training_schedules table
-- This column is needed for the Secretary Dashboard modal to work properly

-- Add the missing approval_status column
ALTER TABLE personal_training_schedules 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- Add a comment to explain the column
COMMENT ON COLUMN personal_training_schedules.approval_status IS 'Status of the program approval: pending, approved, rejected';

-- Update existing records to have a default approval status
UPDATE personal_training_schedules 
SET approval_status = 'approved' 
WHERE approval_status IS NULL;

-- Make sure the column is not null
ALTER TABLE personal_training_schedules 
ALTER COLUMN approval_status SET NOT NULL;

-- Add a check constraint to ensure valid values
ALTER TABLE personal_training_schedules 
ADD CONSTRAINT check_approval_status 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'personal_training_schedules' 
AND column_name = 'approval_status';
