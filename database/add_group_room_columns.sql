-- Add Group Room columns to program_approval_states table
-- This migration adds support for group training room information

-- Add group room columns to program_approval_states table
ALTER TABLE program_approval_states 
ADD COLUMN IF NOT EXISTS group_room_size INTEGER,
ADD COLUMN IF NOT EXISTS weekly_frequency INTEGER,
ADD COLUMN IF NOT EXISTS monthly_total INTEGER;

-- Add group room columns to personal_training_schedules table
ALTER TABLE personal_training_schedules 
ADD COLUMN IF NOT EXISTS training_type VARCHAR(20) DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS group_room_size INTEGER,
ADD COLUMN IF NOT EXISTS weekly_frequency INTEGER,
ADD COLUMN IF NOT EXISTS monthly_total INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN program_approval_states.group_room_size IS 'Number of users in the group room (2, 3, or 6)';
COMMENT ON COLUMN program_approval_states.weekly_frequency IS 'Number of times per week the user attends group training';
COMMENT ON COLUMN program_approval_states.monthly_total IS 'Total monthly sessions (weekly_frequency * 4)';

COMMENT ON COLUMN personal_training_schedules.training_type IS 'Type of training: individual or group';
COMMENT ON COLUMN personal_training_schedules.group_room_size IS 'Number of users in the group room (2, 3, or 6)';
COMMENT ON COLUMN personal_training_schedules.weekly_frequency IS 'Number of times per week the user attends group training';
COMMENT ON COLUMN personal_training_schedules.monthly_total IS 'Total monthly sessions (weekly_frequency * 4)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_program_approval_states_group_room 
ON program_approval_states(group_room_size, weekly_frequency);

CREATE INDEX IF NOT EXISTS idx_personal_training_schedules_training_type 
ON personal_training_schedules(training_type, group_room_size);
