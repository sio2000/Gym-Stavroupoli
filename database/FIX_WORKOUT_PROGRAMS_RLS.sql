-- FIX WORKOUT PROGRAMS RLS POLICIES
-- Run this script in Supabase SQL Editor to fix the RLS policies for workout programs

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can manage workout program categories" ON workout_program_categories;
DROP POLICY IF EXISTS "Admins can manage workout exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Admins can manage exercise set configs" ON exercise_set_configs;
DROP POLICY IF EXISTS "Admins can manage combined workout programs" ON combined_workout_programs;
DROP POLICY IF EXISTS "Admins can manage combined program exercises" ON combined_program_exercises;

-- Recreate admin policies with correct role check from user_profiles table
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

-- Verify policies were created
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN (
  'workout_program_categories',
  'workout_exercises',
  'exercise_set_configs',
  'combined_workout_programs',
  'combined_program_exercises'
)
ORDER BY tablename, policyname;

