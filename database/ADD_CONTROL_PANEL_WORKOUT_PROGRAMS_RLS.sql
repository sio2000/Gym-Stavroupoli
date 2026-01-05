-- ADD CONTROL PANEL RLS POLICIES FOR WORKOUT PROGRAMS
-- This script adds RLS policies for control_panel role to manage workout programs
-- Date: 2026-01-05
-- Run this in Supabase SQL Editor
-- 100% SAFE - Only adds policies if they don't exist

-- =============================================
-- 1. WORKOUT PROGRAM CATEGORIES
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workout_program_categories') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'workout_program_categories' 
            AND policyname = 'control_panel_manage_workout_program_categories'
        ) THEN
            CREATE POLICY "control_panel_manage_workout_program_categories"
              ON workout_program_categories
              FOR ALL
              USING (
                EXISTS (
                  SELECT 1 FROM user_profiles 
                  WHERE user_profiles.user_id = auth.uid() 
                  AND user_profiles.role = 'control_panel'
                )
              )
              WITH CHECK (
                EXISTS (
                  SELECT 1 FROM user_profiles 
                  WHERE user_profiles.user_id = auth.uid() 
                  AND user_profiles.role = 'control_panel'
                )
              );
            RAISE NOTICE 'Added control_panel_manage_workout_program_categories policy';
        ELSE
            RAISE NOTICE 'control_panel_manage_workout_program_categories policy already exists';
        END IF;
    ELSE
        RAISE NOTICE 'workout_program_categories table does not exist, skipping...';
    END IF;
END $$;

-- =============================================
-- 2. WORKOUT EXERCISES
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workout_exercises') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'workout_exercises' 
            AND policyname = 'control_panel_manage_workout_exercises'
        ) THEN
            CREATE POLICY "control_panel_manage_workout_exercises"
              ON workout_exercises
              FOR ALL
              USING (
                EXISTS (
                  SELECT 1 FROM user_profiles 
                  WHERE user_profiles.user_id = auth.uid() 
                  AND user_profiles.role = 'control_panel'
                )
              )
              WITH CHECK (
                EXISTS (
                  SELECT 1 FROM user_profiles 
                  WHERE user_profiles.user_id = auth.uid() 
                  AND user_profiles.role = 'control_panel'
                )
              );
            RAISE NOTICE 'Added control_panel_manage_workout_exercises policy';
        ELSE
            RAISE NOTICE 'control_panel_manage_workout_exercises policy already exists';
        END IF;
    ELSE
        RAISE NOTICE 'workout_exercises table does not exist, skipping...';
    END IF;
END $$;

-- =============================================
-- 3. EXERCISE SET CONFIGS
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercise_set_configs') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'exercise_set_configs' 
            AND policyname = 'control_panel_manage_exercise_set_configs'
        ) THEN
            CREATE POLICY "control_panel_manage_exercise_set_configs"
              ON exercise_set_configs
              FOR ALL
              USING (
                EXISTS (
                  SELECT 1 FROM user_profiles 
                  WHERE user_profiles.user_id = auth.uid() 
                  AND user_profiles.role = 'control_panel'
                )
              )
              WITH CHECK (
                EXISTS (
                  SELECT 1 FROM user_profiles 
                  WHERE user_profiles.user_id = auth.uid() 
                  AND user_profiles.role = 'control_panel'
                )
              );
            RAISE NOTICE 'Added control_panel_manage_exercise_set_configs policy';
        ELSE
            RAISE NOTICE 'control_panel_manage_exercise_set_configs policy already exists';
        END IF;
    ELSE
        RAISE NOTICE 'exercise_set_configs table does not exist, skipping...';
    END IF;
END $$;

-- =============================================
-- 4. COMBINED WORKOUT PROGRAMS
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'combined_workout_programs') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'combined_workout_programs' 
            AND policyname = 'control_panel_manage_combined_workout_programs'
        ) THEN
            CREATE POLICY "control_panel_manage_combined_workout_programs"
              ON combined_workout_programs
              FOR ALL
              USING (
                EXISTS (
                  SELECT 1 FROM user_profiles 
                  WHERE user_profiles.user_id = auth.uid() 
                  AND user_profiles.role = 'control_panel'
                )
              )
              WITH CHECK (
                EXISTS (
                  SELECT 1 FROM user_profiles 
                  WHERE user_profiles.user_id = auth.uid() 
                  AND user_profiles.role = 'control_panel'
                )
              );
            RAISE NOTICE 'Added control_panel_manage_combined_workout_programs policy';
        ELSE
            RAISE NOTICE 'control_panel_manage_combined_workout_programs policy already exists';
        END IF;
    ELSE
        RAISE NOTICE 'combined_workout_programs table does not exist, skipping...';
    END IF;
END $$;

-- =============================================
-- 5. COMBINED PROGRAM EXERCISES
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'combined_program_exercises') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'combined_program_exercises' 
            AND policyname = 'control_panel_manage_combined_program_exercises'
        ) THEN
            CREATE POLICY "control_panel_manage_combined_program_exercises"
              ON combined_program_exercises
              FOR ALL
              USING (
                EXISTS (
                  SELECT 1 FROM user_profiles 
                  WHERE user_profiles.user_id = auth.uid() 
                  AND user_profiles.role = 'control_panel'
                )
              )
              WITH CHECK (
                EXISTS (
                  SELECT 1 FROM user_profiles 
                  WHERE user_profiles.user_id = auth.uid() 
                  AND user_profiles.role = 'control_panel'
                )
              );
            RAISE NOTICE 'Added control_panel_manage_combined_program_exercises policy';
        ELSE
            RAISE NOTICE 'control_panel_manage_combined_program_exercises policy already exists';
        END IF;
    ELSE
        RAISE NOTICE 'combined_program_exercises table does not exist, skipping...';
    END IF;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================

-- Verify all control_panel policies were created
SELECT 
  'VERIFICATION: Control Panel Workout Programs Policies' as status,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN (
  'workout_program_categories',
  'workout_exercises',
  'exercise_set_configs',
  'combined_workout_programs',
  'combined_program_exercises'
)
AND policyname LIKE '%control_panel%'
ORDER BY tablename, policyname;

-- Success message
SELECT 'SUCCESS: Control Panel RLS policies added for workout programs tables!' as result;

