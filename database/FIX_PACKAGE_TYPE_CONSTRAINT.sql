-- Fix package_type constraint to allow 'pilates'
-- This script will update the constraint to include 'pilates' as a valid package type

-- First, let's see the current constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'membership_packages'::regclass 
AND conname LIKE '%package_type%';

-- Drop the existing constraint
ALTER TABLE membership_packages 
DROP CONSTRAINT IF EXISTS membership_packages_package_type_check;

-- Add the new constraint that includes 'pilates'
ALTER TABLE membership_packages 
ADD CONSTRAINT membership_packages_package_type_check 
CHECK (package_type IN ('basic', 'premium', 'vip', 'free_gym', 'pilates', 'personal'));

-- Verify the constraint was updated
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'membership_packages'::regclass 
AND conname LIKE '%package_type%';
