-- ═══════════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC: Find all triggers/functions that reference 'status' column
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'Checking all triggers on memberships table:' as diagnostic;

SELECT 
  trigger_name,
  event_manipulation as operation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'memberships'
  AND trigger_schema = 'public'
ORDER BY trigger_name;

SELECT '─────────────────────────────────────────────────────────────────' as separator;

SELECT 'Checking all functions that might reference status:' as diagnostic;

SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_definition LIKE '%NEW.status%' 
    OR routine_definition LIKE '%OLD.status%'
    OR routine_definition LIKE '%"status"%'
    OR routine_definition LIKE '%''status''%')
  AND routine_definition IS NOT NULL
LIMIT 20;

SELECT '─────────────────────────────────────────────────────────────────' as separator;

SELECT 'Summary: Current state' as summary;
SELECT COUNT(*) as total_triggers
FROM information_schema.triggers
WHERE trigger_schema = 'public';

SELECT COUNT(*) as total_functions
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION';
