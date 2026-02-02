-- ═══════════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC: Show EXACT trigger code that's running
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '🔍 DIAGNOSTICS: What triggers exist and what do they contain?' as title;

SELECT '─────────────────────────────────────────────────────────────────' as separator;

-- List all triggers with their full code
SELECT 
  t.trigger_name,
  t.event_manipulation as operation,
  r.routine_definition as function_code
FROM information_schema.triggers t
LEFT JOIN information_schema.routines r ON (
  r.routine_schema = t.trigger_schema 
  AND r.routine_name = substring(t.action_statement FROM 'EXECUTE FUNCTION ([a-z_]+)')
)
WHERE t.event_object_table = 'memberships'
  AND t.trigger_schema = 'public'
ORDER BY t.trigger_name;

SELECT '─────────────────────────────────────────────────────────────────' as separator;

-- Check if any function references 'status' or 'NEW.status'
SELECT 'Functions that might reference status:' as check_type;

SELECT 
  routine_name,
  routine_type,
  CASE 
    WHEN routine_definition LIKE '%NEW.status%' THEN '⚠️  References NEW.status'
    WHEN routine_definition LIKE '%OLD.status%' THEN '⚠️  References OLD.status'
    WHEN routine_definition LIKE '%"status"%' THEN '⚠️  References "status"'
    WHEN routine_definition LIKE '''status''' THEN '⚠️  References ''status'''
    ELSE '✅ No status reference'
  END as contains_status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND (routine_name LIKE '%memberships%' OR routine_name LIKE '%pilates%' OR routine_name LIKE '%expire%')
ORDER BY routine_name;

SELECT '─────────────────────────────────────────────────────────────────' as separator;

-- Show memberships table structure
SELECT 'Memberships table columns:' as check_type;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'memberships'
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '═════════════════════════════════════════════════════════════════' as separator;
