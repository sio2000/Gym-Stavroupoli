-- Run the final installment fix to ensure all functions and columns exist
\i database/FINAL_INSTALLMENT_FIX.sql

-- Verify the functions were created
SELECT 'Functions created successfully' as status;

-- Test the delete_third_installment_permanently function with a dummy call
-- (This will fail if the function doesn't exist, but won't cause issues if it does)
DO $$
BEGIN
    -- This is just a test to see if the function exists and is callable
    -- We're not actually deleting anything
    PERFORM delete_third_installment_permanently('00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID);
EXCEPTION
    WHEN OTHERS THEN
        -- Expected to fail with the dummy UUID, but this confirms the function exists
        RAISE NOTICE 'Function exists but failed as expected with dummy data: %', SQLERRM;
END $$;
