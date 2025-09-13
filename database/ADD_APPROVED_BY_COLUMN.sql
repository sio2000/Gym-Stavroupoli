-- ADD APPROVED_BY COLUMN - Προσθήκη approved_by column στο memberships table
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Έλεγχος αν υπάρχει το approved_by column
SELECT 'Checking if approved_by column exists...' as step;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'memberships' 
AND column_name = 'approved_by';

-- 2. Προσθήκη approved_by column αν δεν υπάρχει
SELECT 'Adding approved_by column...' as step;

ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- 3. Έλεγχος αποτελεσμάτων
SELECT 'Verifying column addition...' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'memberships' 
ORDER BY ordinal_position;

SELECT 'SUCCESS: approved_by column added successfully!' as final_status;
