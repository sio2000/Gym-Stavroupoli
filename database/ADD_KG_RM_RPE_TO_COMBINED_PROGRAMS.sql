-- Add weight_kg, rm_percentage, and rpe columns to combined_program_exercises table
-- These fields allow admins to specify weight in kg, RM percentage, and RPE for exercises in combined programs

-- Add weight_kg column (for weight in kilograms, e.g., 20.5 kg)
ALTER TABLE combined_program_exercises 
ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(10, 2);

-- Add rm_percentage column (for RM percentage, e.g., 60% of 1RM)
ALTER TABLE combined_program_exercises 
ADD COLUMN IF NOT EXISTS rm_percentage NUMERIC(5, 2);

-- Add rpe column (for Rate of Perceived Exertion, e.g., 8.5)
ALTER TABLE combined_program_exercises 
ADD COLUMN IF NOT EXISTS rpe NUMERIC(3, 1);

-- Add time_seconds column (for exercises measured by time, e.g., cardio/running - in seconds)
ALTER TABLE combined_program_exercises 
ADD COLUMN IF NOT EXISTS time_seconds INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN combined_program_exercises.weight_kg IS 'Weight in kilograms for the exercise (e.g., 20.5 kg)';
COMMENT ON COLUMN combined_program_exercises.rm_percentage IS 'Percentage of 1RM (Repetition Maximum), e.g., 60.00 for 60%';
COMMENT ON COLUMN combined_program_exercises.rpe IS 'Rate of Perceived Exertion (RPE) value, e.g., 8.5';
COMMENT ON COLUMN combined_program_exercises.time_seconds IS 'Time duration for the exercise in seconds (e.g., 1800 for 30 minutes) - used for cardio/time-based exercises';

