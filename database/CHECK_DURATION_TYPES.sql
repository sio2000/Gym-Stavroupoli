-- CHECK DURATION TYPES
-- This script shows all existing duration types to understand what we need to include

-- Show all existing duration types
SELECT 
    'Existing duration types:' as info,
    duration_type, 
    COUNT(*) as count,
    STRING_AGG(DISTINCT mp.name, ', ') as packages
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
GROUP BY duration_type
ORDER BY duration_type;

-- Show the current constraint
SELECT 
    'Current constraint:' as info,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'membership_package_durations_duration_type_check';
