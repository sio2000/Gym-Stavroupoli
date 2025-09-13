-- CHECK MEMBERSHIPS TABLE - Έλεγχος δομής του memberships table
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Έλεγχος αν υπάρχει το memberships table
SELECT 'Checking if memberships table exists...' as step;

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'memberships';

-- 2. Έλεγχος δομής του memberships table
SELECT 'Checking memberships table structure...' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'memberships' 
ORDER BY ordinal_position;

-- 3. Έλεγχος δεδομένων στο memberships table
SELECT 'Checking memberships table data...' as step;

SELECT 
    id,
    user_id,
    package_id,
    start_date,
    end_date,
    is_active,
    approved_by,
    created_at
FROM memberships 
LIMIT 5;

-- 4. Έλεγχος RLS policies για memberships table
SELECT 'Checking RLS policies for memberships table...' as step;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'memberships';
