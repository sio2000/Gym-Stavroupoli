-- INSERT FREE GYM PACKAGE - Εισαγωγή Free Gym package
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Έλεγχος αν υπάρχει το Free Gym package
SELECT 'Checking if Free Gym package exists...' as step;

SELECT 
    id,
    name,
    description,
    is_active
FROM membership_packages 
WHERE name = 'Free Gym';

-- 2. Εισαγωγή Free Gym package (αν δεν υπάρχει)
SELECT 'Inserting Free Gym package...' as step;

INSERT INTO membership_packages (name, description, is_active)
SELECT 
    'Free Gym',
    'Απεριόριστη πρόσβαση στο γυμναστήριο',
    true
WHERE NOT EXISTS (SELECT 1 FROM membership_packages WHERE name = 'Free Gym');

-- 3. Εισαγωγή duration options για Free Gym
SELECT 'Inserting Free Gym duration options...' as step;

-- Βρίσκουμε το ID του Free Gym package
WITH free_gym_package AS (
    SELECT id FROM membership_packages WHERE name = 'Free Gym'
)
INSERT INTO membership_package_durations (package_id, duration_type, duration_days, price, is_active)
SELECT 
    fgp.id,
    d.duration_type,
    d.duration_days,
    d.price,
    true
FROM free_gym_package fgp
CROSS JOIN (VALUES
    ('year', 365, 240.00),
    ('semester', 180, 150.00),
    ('month', 30, 50.00),
    ('lesson', 1, 10.00)
) AS d(duration_type, duration_days, price)
WHERE NOT EXISTS (
    SELECT 1 FROM membership_package_durations mpd 
    WHERE mpd.package_id = fgp.id 
    AND mpd.duration_type = d.duration_type
);

-- 4. Έλεγχος ότι όλα εισήχθησαν σωστά
SELECT 'Verifying Free Gym package setup...' as step;

SELECT 
    mp.id,
    mp.name,
    mp.description,
    mp.is_active,
    COUNT(mpd.id) as duration_options_count
FROM membership_packages mp
LEFT JOIN membership_package_durations mpd ON mp.id = mpd.package_id AND mpd.is_active = true
WHERE mp.name = 'Free Gym'
GROUP BY mp.id, mp.name, mp.description, mp.is_active;

-- 5. Εμφάνιση όλων των duration options
SELECT 'Free Gym duration options:' as info;

SELECT 
    mpd.id,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Free Gym'
ORDER BY mpd.duration_days;

SELECT 'COMPLETION: Free Gym package setup completed successfully!' as final_status;
