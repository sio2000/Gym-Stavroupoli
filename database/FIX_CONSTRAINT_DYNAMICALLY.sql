-- FIX CONSTRAINT DYNAMICALLY
-- This script dynamically fetches all existing duration types, adds 'ultimate_medium_1year',
-- and then drops and recreates the constraint with the complete list.

DO $$
DECLARE
    v_current_duration_types TEXT[];
    v_new_constraint_definition TEXT;
    v_constraint_name TEXT := 'membership_package_durations_duration_type_check';
BEGIN
    -- STEP 1: Get all distinct duration_types currently in the table
    SELECT ARRAY_AGG(DISTINCT duration_type ORDER BY duration_type)
    INTO v_current_duration_types
    FROM membership_package_durations;

    RAISE NOTICE 'Existing duration types found: %', v_current_duration_types;

    -- STEP 2: Add 'ultimate_medium_1year' if not already present
    IF NOT (v_current_duration_types @> ARRAY['ultimate_medium_1year'::text]) THEN
        v_current_duration_types := ARRAY_APPEND(v_current_duration_types, 'ultimate_medium_1year'::text);
        RAISE NOTICE 'Added ultimate_medium_1year to the list.';
    END IF;

    -- Ensure 'ultimate_1year' is also present, as it's part of the original constraint
    IF NOT (v_current_duration_types @> ARRAY['ultimate_1year'::text]) THEN
        v_current_duration_types := ARRAY_APPEND(v_current_duration_types, 'ultimate_1year'::text);
        RAISE NOTICE 'Added ultimate_1year to the list.';
    END IF;

    -- Sort the array for consistency
    SELECT ARRAY_AGG(x ORDER BY x) INTO v_current_duration_types FROM UNNEST(v_current_duration_types) AS x;

    RAISE NOTICE 'Final list of duration types for constraint: %', v_current_duration_types;

    -- STEP 3: Drop the existing constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = v_constraint_name) THEN
        EXECUTE FORMAT('ALTER TABLE membership_package_durations DROP CONSTRAINT %I;', v_constraint_name);
        RAISE NOTICE 'Dropped existing constraint: %', v_constraint_name;
    ELSE
        RAISE NOTICE 'Constraint % does not exist, skipping drop.', v_constraint_name;
    END IF;

    -- STEP 4: Recreate the constraint with the updated list of duration types
    v_new_constraint_definition := FORMAT('ALTER TABLE membership_package_durations ADD CONSTRAINT %I CHECK ((duration_type = ANY (ARRAY[%s]::text[])))',
                                          v_constraint_name,
                                          ARRAY_TO_STRING(ARRAY(SELECT QUOTE_LITERAL(elem) FROM UNNEST(v_current_duration_types) AS elem), ', '));

    RAISE NOTICE 'Executing new constraint definition: %', v_new_constraint_definition;
    EXECUTE v_new_constraint_definition;

    RAISE NOTICE 'Successfully updated constraint % to include all necessary duration types.', v_constraint_name;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating constraint: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Verify the new constraint definition
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'membership_package_durations_duration_type_check';

-- Verify that 'ultimate_medium_1year' can now be inserted
-- (This part is for testing purposes, do not run if you don't want to insert data)
-- INSERT INTO membership_package_durations (id, package_id, duration_type, duration_days, price, is_active, created_at, updated_at)
-- VALUES (gen_random_uuid(), (SELECT id FROM membership_packages WHERE name = 'Ultimate Medium' LIMIT 1), 'ultimate_medium_1year', 365, 400.00, TRUE, NOW(), NOW());
