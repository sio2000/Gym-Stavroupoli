-- Fix duplicates in workout_program_categories by name (normalized)
-- 1) Move workout_exercises from duplicate categories to the kept one
-- 2) Delete duplicate workout_program_categories rows
-- 3) Ensure uniqueness on name to prevent re-occurrence

BEGIN;

-- Normalize name to avoid invisible duplicates (trailing spaces / multiple spaces)
-- normalized_name = trim + collapse whitespace
WITH ranked AS (
  SELECT
    id,
    name,
    btrim(regexp_replace(name, '\s+', ' ', 'g')) AS normalized_name,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY btrim(regexp_replace(name, '\s+', ' ', 'g'))
      ORDER BY created_at NULLS LAST, id
    ) AS rn
  FROM workout_program_categories
),
keep AS (
  SELECT normalized_name, id AS keep_id
  FROM ranked
  WHERE rn = 1
),
dups AS (
  SELECT r.normalized_name, r.id AS dup_id, k.keep_id
  FROM ranked r
  JOIN keep k ON k.normalized_name = r.normalized_name
  WHERE r.rn > 1
)
UPDATE workout_exercises we
SET category_id = d.keep_id
FROM dups d
WHERE we.category_id = d.dup_id;

-- Optional: normalize the kept row name so future inserts match exactly
WITH ranked AS (
  SELECT
    id,
    name,
    btrim(regexp_replace(name, '\s+', ' ', 'g')) AS normalized_name,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY btrim(regexp_replace(name, '\s+', ' ', 'g'))
      ORDER BY created_at NULLS LAST, id
    ) AS rn
  FROM workout_program_categories
)
UPDATE workout_program_categories c
SET name = r.normalized_name
FROM ranked r
WHERE c.id = r.id AND r.rn = 1 AND c.name <> r.normalized_name;

-- Also update exercise_set_configs if they reference categories (they don't, but just in case)
-- Actually, exercise_set_configs references exercise_id, not category_id, so no need

-- 2) Delete duplicate category rows
WITH ranked AS (
  SELECT
    id,
    name,
    btrim(regexp_replace(name, '\s+', ' ', 'g')) AS normalized_name,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY btrim(regexp_replace(name, '\s+', ' ', 'g'))
      ORDER BY created_at NULLS LAST, id
    ) AS rn
  FROM workout_program_categories
)
DELETE FROM workout_program_categories
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 3) Ensure uniqueness on name (idempotent - will fail gracefully if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'workout_program_categories_name_key'
  ) THEN
    ALTER TABLE workout_program_categories
      ADD CONSTRAINT workout_program_categories_name_key UNIQUE (name);
  END IF;
END $$;

-- Extra safety: prevent case/space-variant duplicates too (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'workout_program_categories_name_normalized_key'
  ) THEN
    CREATE UNIQUE INDEX workout_program_categories_name_normalized_key
      ON workout_program_categories (lower(btrim(regexp_replace(name, '\s+', ' ', 'g'))));
  END IF;
END $$;

COMMIT;

