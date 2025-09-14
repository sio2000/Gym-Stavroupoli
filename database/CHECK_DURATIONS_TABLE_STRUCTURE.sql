-- Check the structure of membership_package_durations table
-- This will show us what columns actually exist

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'membership_package_durations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if classes_count column exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'membership_package_durations' 
            AND column_name = 'classes_count'
            AND table_schema = 'public'
        ) THEN 'classes_count column EXISTS'
        ELSE 'classes_count column DOES NOT EXIST'
    END as column_status;
