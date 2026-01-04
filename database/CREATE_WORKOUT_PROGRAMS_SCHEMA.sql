-- Schema for Workout Programs Management
-- This schema supports workout programs, exercises, sets, repetitions, rest time, and combined programs

-- Workout Programs Categories (Leg & Glutes, Abdominals, Arms & Traps, etc.)
CREATE TABLE IF NOT EXISTS workout_program_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  name_english TEXT,
  icon TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual Exercises
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_english TEXT,
  description TEXT,
  youtube_url TEXT,
  category_id UUID REFERENCES workout_program_categories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise Sets Configuration (default sets, reps, rest time per exercise)
CREATE TABLE IF NOT EXISTS exercise_set_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE,
  sets INTEGER DEFAULT 3,
  reps_min INTEGER,
  reps_max INTEGER,
  reps_text TEXT, -- For cases like "10-15" or "30-60 δευτερόλεπτα"
  rest_seconds INTEGER DEFAULT 60, -- Rest time between sets in seconds
  weight_notes TEXT, -- Optional notes about weight
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exercise_id)
);

-- Combined Programs (Άνω μέρος, Κάτω μέρος, Πλήρες σώμα, Ελεύθερα βάρη)
CREATE TABLE IF NOT EXISTS combined_workout_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_english TEXT,
  description TEXT,
  program_type TEXT NOT NULL, -- 'upper-body', 'lower-body', 'full-body', 'free-weights'
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises in Combined Programs (with custom sets/reps/rest)
CREATE TABLE IF NOT EXISTS combined_program_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combined_program_id UUID REFERENCES combined_workout_programs(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  sets INTEGER DEFAULT 3,
  reps_min INTEGER,
  reps_max INTEGER,
  reps_text TEXT,
  rest_seconds INTEGER DEFAULT 60,
  weight_notes TEXT,
  notes TEXT, -- Additional notes for this exercise in this program
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(combined_program_id, exercise_id, display_order)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_exercises_category ON workout_exercises(category_id);
CREATE INDEX IF NOT EXISTS idx_exercise_set_configs_exercise ON exercise_set_configs(exercise_id);
CREATE INDEX IF NOT EXISTS idx_combined_program_exercises_program ON combined_program_exercises(combined_program_id);
CREATE INDEX IF NOT EXISTS idx_combined_program_exercises_exercise ON combined_program_exercises(exercise_id);

-- RLS Policies
ALTER TABLE workout_program_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_set_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE combined_workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE combined_program_exercises ENABLE ROW LEVEL SECURITY;

-- Allow admins to do everything (check role from user_profiles table)
CREATE POLICY "Admins can manage workout program categories"
  ON workout_program_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'secretary')
    )
  );

CREATE POLICY "Admins can manage workout exercises"
  ON workout_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'secretary')
    )
  );

CREATE POLICY "Admins can manage exercise set configs"
  ON exercise_set_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'secretary')
    )
  );

CREATE POLICY "Admins can manage combined workout programs"
  ON combined_workout_programs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'secretary')
    )
  );

CREATE POLICY "Admins can manage combined program exercises"
  ON combined_program_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'secretary')
    )
  );

-- Allow users to read (view) workout programs
CREATE POLICY "Users can view workout program categories"
  ON workout_program_categories FOR SELECT
  USING (true);

CREATE POLICY "Users can view workout exercises"
  ON workout_exercises FOR SELECT
  USING (true);

CREATE POLICY "Users can view exercise set configs"
  ON exercise_set_configs FOR SELECT
  USING (true);

CREATE POLICY "Users can view combined workout programs"
  ON combined_workout_programs FOR SELECT
  USING (true);

CREATE POLICY "Users can view combined program exercises"
  ON combined_program_exercises FOR SELECT
  USING (true);

-- Insert initial data for categories
INSERT INTO workout_program_categories (name, name_english, icon, display_order) VALUES
  ('Leg & Glutes (πόδια & γλουτός)', 'Leg & Glutes', '🦵', 1),
  ('Abdominals (ABS) (κοιλιακοί)', 'Abdominals', '💪', 2),
  ('Arms & Traps (χέρια & τραπεζοειδής)', 'Arms & Traps', '💪', 3),
  ('WARM UP', 'Warm Up', '🔥', 4),
  ('COOL DOWN', 'Cool Down', '🧘', 5),
  ('Lower Back (Ραχιαίοι)', 'Lower Back', '🦴', 6)
ON CONFLICT (name) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_workout_program_categories_updated_at
  BEFORE UPDATE ON workout_program_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_exercises_updated_at
  BEFORE UPDATE ON workout_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_set_configs_updated_at
  BEFORE UPDATE ON exercise_set_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_combined_workout_programs_updated_at
  BEFORE UPDATE ON combined_workout_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_combined_program_exercises_updated_at
  BEFORE UPDATE ON combined_program_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

