-- ADD TEST MEMBERSHIP DATA - Προσθήκη test δεδομένων συνδρομών
-- Εκτέλεση στο Supabase SQL Editor

-- 1. Έλεγχος αν υπάρχει το Free Gym πακέτο
DO $$ 
BEGIN
    -- Έλεγχος αν υπάρχει το Free Gym πακέτο
    IF NOT EXISTS (SELECT 1 FROM membership_packages WHERE name = 'Free Gym') THEN
        -- Προσθήκη Free Gym πακέτου
        INSERT INTO membership_packages (name, description, duration_days, price, features, is_active, package_type) 
        VALUES (
            'Free Gym',
            'Απεριόριστη πρόσβαση στο γυμναστήριο',
            365,
            0,
            ARRAY['Απεριόριστη πρόσβαση', 'Όλες οι αίθουσες', 'Εξοπλισμός γυμναστηρίου'],
            TRUE,
            'free_gym'
        );
        
        RAISE NOTICE 'Free Gym package added successfully';
    ELSE
        RAISE NOTICE 'Free Gym package already exists';
    END IF;
END $$;

-- 2. Προσθήκη duration options για Free Gym πακέτο
DO $$ 
DECLARE
    free_gym_id UUID;
BEGIN
    -- Βρίσκουμε το ID του Free Gym πακέτου
    SELECT id INTO free_gym_id FROM membership_packages WHERE name = 'Free Gym';
    
    IF free_gym_id IS NOT NULL THEN
        -- Προσθήκη duration options
        INSERT INTO membership_package_durations (package_id, duration_type, duration_days, price, is_active)
        SELECT 
            free_gym_id,
            duration_type,
            duration_days,
            price,
            TRUE
        FROM (VALUES 
            ('year', 365, 240.00),
            ('semester', 180, 150.00),
            ('month', 30, 50.00),
            ('lesson', 1, 10.00)
        ) AS durations(duration_type, duration_days, price)
        ON CONFLICT (package_id, duration_type) DO UPDATE SET
            duration_days = EXCLUDED.duration_days,
            price = EXCLUDED.price,
            updated_at = NOW();
            
        RAISE NOTICE 'Duration options added for Free Gym package';
    ELSE
        RAISE NOTICE 'Free Gym package not found, cannot add duration options';
    END IF;
END $$;

-- 3. Έλεγχος αποτελεσμάτων
SELECT 'Final check - membership_packages:' as message;
SELECT id, name, package_type, is_active FROM membership_packages WHERE name = 'Free Gym';

SELECT 'Final check - membership_package_durations:' as message;
SELECT 
    mpd.id,
    mp.name as package_name,
    mpd.duration_type,
    mpd.duration_days,
    mpd.price,
    mpd.is_active
FROM membership_package_durations mpd
JOIN membership_packages mp ON mpd.package_id = mp.id
WHERE mp.name = 'Free Gym'
ORDER BY mpd.duration_days;

SELECT 'Test data added successfully!' as message;
