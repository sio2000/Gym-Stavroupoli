-- Fix duplicates in combined_workout_programs by program_type
-- 1) Move combined_program_exercises from duplicate programs to the kept one
-- 2) Delete duplicate combined_workout_programs rows
-- 3) Enforce uniqueness on program_type to prevent re-occurrence
-- 4) Ensure the 5 base combined programs exist (upper/lower/full/free-weights/pyramidal)

BEGIN;

-- 1) Move exercises from duplicate program rows to the "kept" row per program_type
WITH ranked AS (
  SELECT
    id,
    program_type,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY program_type
      ORDER BY created_at NULLS LAST, id
    ) AS rn
  FROM combined_workout_programs
),
keep AS (
  SELECT program_type, id AS keep_id
  FROM ranked
  WHERE rn = 1
),
dups AS (
  SELECT r.program_type, r.id AS dup_id, k.keep_id
  FROM ranked r
  JOIN keep k ON k.program_type = r.program_type
  WHERE r.rn > 1
)
UPDATE combined_program_exercises cpe
SET combined_program_id = d.keep_id
FROM dups d
WHERE cpe.combined_program_id = d.dup_id;

-- 2) Delete duplicate program rows
WITH ranked AS (
  SELECT
    id,
    program_type,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY program_type
      ORDER BY created_at NULLS LAST, id
    ) AS rn
  FROM combined_workout_programs
)
DELETE FROM combined_workout_programs
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 3) Enforce uniqueness on program_type (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'combined_workout_programs_program_type_key'
  ) THEN
    ALTER TABLE combined_workout_programs
      ADD CONSTRAINT combined_workout_programs_program_type_key UNIQUE (program_type);
  END IF;
END $$;

-- 4) Ensure the 5 base combined programs exist (UPSERT by program_type)
INSERT INTO combined_workout_programs (name, name_english, description, program_type, display_order)
VALUES
  ('Άνω μέρος σώματος', 'Upper Body', 'Συνδυασμός ασκήσεων για άνω μέρος σώματος', 'upper-body', 1),
  ('Κάτω μέρος σώματος', 'Lower Body', 'Συνδυασμός ασκήσεων για κάτω μέρος σώματος', 'lower-body', 2),
  ('Όλο το σώμα', 'Full Body', 'Συνδυασμός ασκήσεων για όλο το σώμα', 'full-body', 3),
  ('Ελεύθερα βάρη', 'Free Weights', 'Συνδυασμός ασκήσεων με ελεύθερα βάρη', 'free-weights', 4),
  ('Pyramidal (Πυραμιδική)', 'Pyramidal', 'Πυραμιδική μεθοδολογία - συνδυασμός ασκήσεων σε “πυραμίδα”', 'pyramidal', 5)
ON CONFLICT (program_type) DO UPDATE
SET
  name = EXCLUDED.name,
  name_english = EXCLUDED.name_english,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = true,
  updated_at = NOW();

COMMIT;


