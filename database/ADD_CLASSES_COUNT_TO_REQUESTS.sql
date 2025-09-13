-- Add classes_count column to membership_requests table
-- This column is needed for Pilates package requests

-- First, check if the column already exists
DO $$ 
BEGIN
    -- Check if classes_count column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'membership_requests' 
        AND column_name = 'classes_count'
    ) THEN
        -- Add the classes_count column
        ALTER TABLE membership_requests 
        ADD COLUMN classes_count INTEGER DEFAULT NULL;
        
        -- Add a comment to explain the column
        COMMENT ON COLUMN membership_requests.classes_count IS 'Number of classes for Pilates packages';
        
        RAISE NOTICE 'classes_count column added to membership_requests table';
    ELSE
        RAISE NOTICE 'classes_count column already exists in membership_requests table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'membership_requests' 
AND column_name = 'classes_count';
