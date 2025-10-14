-- Check which tables exist in the database
-- Execute this in Supabase SQL Editor to see what tables are available

-- Show all tables in public schema
SELECT 
    'EXISTING TABLES IN PUBLIC SCHEMA:' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check for cash-related tables specifically
SELECT 
    'CASH-RELATED TABLES:' as info,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE '%cash%' OR 
    table_name LIKE '%transaction%' OR 
    table_name LIKE '%payment%' OR
    table_name LIKE '%money%' OR
    table_name LIKE '%register%'
)
ORDER BY table_name;

-- Check for membership-related tables
SELECT 
    'MEMBERSHIP-RELATED TABLES:' as info,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE '%membership%' OR 
    table_name LIKE '%subscription%' OR 
    table_name LIKE '%package%' OR
    table_name LIKE '%request%' OR
    table_name LIKE '%application%'
)
ORDER BY table_name;

-- Check for user-related tables
SELECT 
    'USER-RELATED TABLES:' as info,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE '%user%' OR 
    table_name LIKE '%profile%' OR 
    table_name LIKE '%member%'
)
ORDER BY table_name;

-- Check for pilates-related tables
SELECT 
    'PILATES-RELATED TABLES:' as info,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE '%pilates%' OR 
    table_name LIKE '%schedule%' OR 
    table_name LIKE '%class%'
)
ORDER BY table_name;

-- Show all policies that exist
SELECT 
    'EXISTING POLICIES:' as info,
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
