-- Check existing package types in the database
-- This will help us understand what values are currently in the table

-- Check all existing package types
SELECT DISTINCT package_type, COUNT(*) as count
FROM membership_packages 
GROUP BY package_type
ORDER BY package_type;

-- Check if there's a package_type column at all
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'membership_packages' 
AND table_schema = 'public';

-- Check the current constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'membership_packages'::regclass 
AND conname LIKE '%package_type%';
