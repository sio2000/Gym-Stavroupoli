-- CHECK MEMBERSHIPS TABLE STRUCTURE
-- Run this to see the actual structure of the memberships table

SELECT 
    'Current memberships table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'memberships' 
ORDER BY ordinal_position;

-- Check if status column exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'memberships' AND column_name = 'status'
        ) THEN 'status column EXISTS'
        ELSE 'status column DOES NOT EXIST'
    END as status_column_check;

-- Check if is_active column exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'memberships' AND column_name = 'is_active'
        ) THEN 'is_active column EXISTS'
        ELSE 'is_active column DOES NOT EXIST'
    END as is_active_column_check;

-- Check if there are any rows in the table
SELECT 
    'Row count in memberships table:' as info,
    COUNT(*) as total_rows
FROM memberships;
