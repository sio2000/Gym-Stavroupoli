-- Remove unwanted membership packages
-- This script removes the packages that should not be displayed in the admin panel

-- Remove the unwanted packages
DELETE FROM membership_packages 
WHERE name IN (
    'Βασικό',
    'Premium', 
    'VIP',
    'Personal Training'
);

-- Also remove any package durations for these packages
DELETE FROM membership_package_durations 
WHERE package_id IN (
    SELECT id FROM membership_packages 
    WHERE name IN ('Βασικό', 'Premium', 'VIP', 'Personal Training')
);

-- Show remaining packages
SELECT 'Remaining packages:' as info;
SELECT id, name, description, price, package_type, is_active 
FROM membership_packages 
ORDER BY name;
