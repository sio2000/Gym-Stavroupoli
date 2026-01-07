-- Add weight_kg, rm_percentage, rpe, time_seconds, method, level, and tempo columns to combined_program_exercises table
-- These fields allow admins to specify weight in kg, RM percentage, RPE, time, method, level, and tempo for exercises in combined programs

-- Add weight_kg column (for weight in kilograms, e.g., 20.5 kg)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'combined_program_exercises' AND column_name = 'weight_kg') THEN
        ALTER TABLE combined_program_exercises ADD COLUMN weight_kg NUMERIC(10, 2);
    END IF;
END $$;

-- Add rm_percentage column (for RM percentage, e.g., 60% of 1RM)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'combined_program_exercises' AND column_name = 'rm_percentage') THEN
        ALTER TABLE combined_program_exercises ADD COLUMN rm_percentage NUMERIC(5, 2);
    END IF;
END $$;

-- Add rpe column (for Rate of Perceived Exertion, e.g., 8.5)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'combined_program_exercises' AND column_name = 'rpe') THEN
        ALTER TABLE combined_program_exercises ADD COLUMN rpe NUMERIC(3, 1);
    END IF;
END $$;

-- Add time_seconds column (for exercises measured by time, e.g., cardio/running - in seconds)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'combined_program_exercises' AND column_name = 'time_seconds') THEN
        ALTER TABLE combined_program_exercises ADD COLUMN time_seconds INTEGER;
    END IF;
END $$;

-- Add method column (text field for method description)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'combined_program_exercises' AND column_name = 'method') THEN
        ALTER TABLE combined_program_exercises ADD COLUMN method TEXT;
    END IF;
END $$;

-- Add level column (text field for level: Αρχάριο, Προχωρημένο, Επαγγελματικό)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'combined_program_exercises' AND column_name = 'level') THEN
        ALTER TABLE combined_program_exercises ADD COLUMN level TEXT;
    END IF;
END $$;

-- Add tempo column (text field for tempo description)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'combined_program_exercises' AND column_name = 'tempo') THEN
        ALTER TABLE combined_program_exercises ADD COLUMN tempo TEXT;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN combined_program_exercises.weight_kg IS 'Weight in kilograms for the exercise (e.g., 20.5 kg)';
COMMENT ON COLUMN combined_program_exercises.rm_percentage IS 'Percentage of 1RM (Repetition Maximum), e.g., 60.00 for 60%';
COMMENT ON COLUMN combined_program_exercises.rpe IS 'Rate of Perceived Exertion (RPE) value, e.g., 8.5';
COMMENT ON COLUMN combined_program_exercises.time_seconds IS 'Time duration for the exercise in seconds (e.g., 1800 for 30 minutes) - used for cardio/time-based exercises';
COMMENT ON COLUMN combined_program_exercises.method IS 'Method description for the exercise (free text input)';
COMMENT ON COLUMN combined_program_exercises.level IS 'Level of difficulty: Αρχάριο, Προχωρημένο, or Επαγγελματικό';
COMMENT ON COLUMN combined_program_exercises.tempo IS 'Tempo description for the exercise (free text input)';
