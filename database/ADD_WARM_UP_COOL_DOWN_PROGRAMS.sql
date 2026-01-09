-- Add Warm up and Cool down programs to combined_workout_programs
-- These are new program types for workout programs

BEGIN;

-- Insert Warm up and Cool down programs
INSERT INTO combined_workout_programs (name, name_english, description, program_type, display_order)
VALUES
  ('Warm up program', 'Warm up program', 'Προγράμματα προθέρμανσης', 'warm-up', 6),
  ('Cool down program', 'Cool down program', 'Προγράμματα ψύξης', 'cool-down', 7)
ON CONFLICT (program_type) DO UPDATE
SET
  name = EXCLUDED.name,
  name_english = EXCLUDED.name_english,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = true,
  updated_at = NOW();

COMMIT;

-- Note: Exercises for these programs can be added through the admin panel
-- These programs will follow the same rules as other combined programs:
-- - Level selection (step 1): Αρχάριος, Προχωρημένος, Επαγγελματίας
-- - Program selection (step 2): Program number selection
