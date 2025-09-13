-- COMPLETE MEMBERSHIPS FIX - Πλήρης διόρθωση memberships table
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Έλεγχος τρέχουσας δομής
SELECT 'Checking current memberships table structure...' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'memberships' 
ORDER BY ordinal_position;

-- 2. Προσθήκη missing columns
SELECT 'Adding missing columns...' as step;

-- Προσθήκη approved_by column
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Προσθήκη approved_at column
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Προσθήκη duration_type column
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS duration_type TEXT;

-- 3. Δημιουργία indexes για τα νέα columns
SELECT 'Creating indexes for new columns...' as step;

CREATE INDEX IF NOT EXISTS idx_memberships_approved_by ON memberships(approved_by);
CREATE INDEX IF NOT EXISTS idx_memberships_approved_at ON memberships(approved_at);
CREATE INDEX IF NOT EXISTS idx_memberships_duration_type ON memberships(duration_type);

-- 4. Έλεγχος τελικής δομής
SELECT 'Verifying final table structure...' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'memberships' 
ORDER BY ordinal_position;

-- 5. Έλεγχος RLS policies
SELECT 'Checking RLS policies...' as step;

SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'memberships';

SELECT 'SUCCESS: Memberships table fixed completely!' as final_status;
