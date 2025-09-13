-- Fix goal_type check constraint to include new goal types
-- Drop the existing constraint
ALTER TABLE user_goals DROP CONSTRAINT IF EXISTS user_goals_goal_type_check;

-- Add the new constraint with all goal types
ALTER TABLE user_goals ADD CONSTRAINT user_goals_goal_type_check 
CHECK (goal_type IN ('weight', 'body_fat', 'water', 'steps', 'sleep', 'workout_days', 'custom'));
