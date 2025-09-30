-- Fix missing program_options column in personal_training_schedules table
-- This column is needed for storing program configuration options

-- Add the missing program_options column as JSONB
ALTER TABLE personal_training_schedules 
ADD COLUMN IF NOT EXISTS program_options JSONB DEFAULT '{}'::jsonb;

-- Add a comment to explain the column
COMMENT ON COLUMN personal_training_schedules.program_options IS 'Program configuration options like payment methods, member types, etc.';

-- Update existing records to have an empty program_options object
UPDATE personal_training_schedules 
SET program_options = '{}'::jsonb 
WHERE program_options IS NULL;

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'personal_training_schedules' 
AND column_name = 'program_options';
