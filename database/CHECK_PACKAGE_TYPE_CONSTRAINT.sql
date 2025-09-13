-- Check the package_type constraint
-- This script will show us what values are allowed for package_type

-- Check the constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'membership_packages'::regclass 
AND conname LIKE '%package_type%';

-- Check existing package types in the table
SELECT DISTINCT package_type FROM membership_packages;

-- Check if we can add 'pilates' to the constraint
-- First, let's see the current constraint
SELECT 
    conname,
    pg_get_constraintdef(oid)
FROM pg_constraint 
WHERE conrelid = 'membership_packages'::regclass 
AND contype = 'c';
