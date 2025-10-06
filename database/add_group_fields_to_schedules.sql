-- Add Group Training Fields to Personal Training Schedules
-- This script adds the necessary columns for group training information

-- Add columns for group training information if they don't exist
ALTER TABLE personal_training_schedules 
ADD COLUMN IF NOT EXISTS training_type TEXT CHECK (training_type IN ('individual', 'group')),
ADD COLUMN IF NOT EXISTS group_room_size INTEGER CHECK (group_room_size IN (2, 3, 6, 10)),
ADD COLUMN IF NOT EXISTS weekly_frequency INTEGER CHECK (weekly_frequency BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS monthly_total INTEGER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personal_training_schedules_training_type ON personal_training_schedules(training_type);
CREATE INDEX IF NOT EXISTS idx_personal_training_schedules_group_room_size ON personal_training_schedules(group_room_size);

-- Update existing records to have individual training type by default
UPDATE personal_training_schedules 
SET training_type = 'individual'
WHERE training_type IS NULL;

-- Optional: Update any existing group schedules based on schedule_data
-- This looks for group information in the existing JSON data
UPDATE personal_training_schedules 
SET 
  training_type = 'group',
  group_room_size = (schedule_data->>'groupRoomSize')::INTEGER,
  weekly_frequency = (schedule_data->>'weeklyFrequency')::INTEGER,
  monthly_total = (schedule_data->>'monthlyTotal')::INTEGER
WHERE schedule_data->>'groupRoomSize' IS NOT NULL 
  AND schedule_data->>'groupRoomSize' != 'null'
  AND (schedule_data->>'groupRoomSize')::INTEGER IN (2, 3, 6, 10);

SELECT 'Group training fields added successfully to personal_training_schedules!' as result;
