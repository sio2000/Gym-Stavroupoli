-- Fix missing sessions column in personal_training_schedules table
-- This column is needed for storing the actual training sessions

-- Add the missing sessions column as JSONB
ALTER TABLE personal_training_schedules 
ADD COLUMN IF NOT EXISTS sessions JSONB DEFAULT '[]'::jsonb;

-- Add a comment to explain the column
COMMENT ON COLUMN personal_training_schedules.sessions IS 'Array of training sessions for this program';

-- Update existing records to have an empty sessions array
UPDATE personal_training_schedules 
SET sessions = '[]'::jsonb 
WHERE sessions IS NULL;

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'personal_training_schedules' 
AND column_name = 'sessions';
