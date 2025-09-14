-- Add classes_count column to membership_package_durations table
-- This script adds the missing column and then creates the Pilates package

-- Step 1: Check current table structure
SELECT 'Current table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'membership_package_durations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Add classes_count column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'membership_package_durations' 
        AND column_name = 'classes_count'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE membership_package_durations 
        ADD COLUMN classes_count INTEGER DEFAULT NULL;
        RAISE NOTICE 'Added classes_count column to membership_package_durations table';
    ELSE
        RAISE NOTICE 'classes_count column already exists in membership_package_durations table';
    END IF;
END $$;

-- Step 3: Verify the column was added
SELECT 'Updated table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'membership_package_durations' 
AND table_schema = 'public'
ORDER BY ordinal_position;
