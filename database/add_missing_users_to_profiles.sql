-- ΠΡΟΣΘΕΣΗ ΧΡΗΣΤΩΝ ΑΠΟ AUTH.USERS ΣΕ USER_PROFILES
-- Προσθήκη χρηστών που υπάρχουν στον πίνακα authentication αλλά όχι στον user_profiles
-- Εκτέλεση στο Supabase SQL Editor

-- ========================================
-- ΒΗΜΑ 1: ΕΛΕΓΧΟΣ ΤΗΣ ΚΑΤΑΣΤΑΣΗΣ
-- ========================================

-- Έλεγχος συνολικού αριθμού χρηστών
SELECT 
    'Συνολικοί χρήστες auth.users' as description,
    COUNT(*) as count
FROM auth.users;

SELECT 
    'Συνολικοί χρήστες user_profiles' as description,
    COUNT(*) as count
FROM user_profiles;

-- Έλεγχος χρηστών που λείπουν από user_profiles
SELECT 
    'Χρήστες που λείπουν από user_profiles' as description,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL;

-- ========================================
-- ΒΗΜΑ 2: ΕΜΦΑΝΙΣΗ ΧΡΗΣΤΩΝ ΠΟΥ ΘΑ ΠΡΟΣΤΕΘΟΥΝ
-- ========================================

-- Εμφάνιση όλων των χρηστών που υπάρχουν στον auth.users αλλά όχι στον user_profiles
SELECT 
    'Χρήστες που θα προστεθούν:' as info,
    u.id,
    u.email,
    u.created_at,
    u.raw_user_meta_data
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL
ORDER BY u.created_at DESC;

-- ========================================
-- ΒΗΜΑ 3: ΠΡΟΣΘΕΣΗ ΧΡΗΣΤΩΝ ΣΤΟ USER_PROFILES
-- ========================================

-- Προσθήκη όλων των χρηστών που λείπουν από user_profiles
INSERT INTO user_profiles (
    user_id,
    first_name,
    last_name,
    email,
    phone,
    role,
    language,
    notification_preferences,
    created_at,
    updated_at
)
SELECT 
    u.id as user_id,
    -- Εξαγωγή ονόματος από raw_user_meta_data αν υπάρχει
    COALESCE(
        u.raw_user_meta_data->>'first_name',
        u.raw_user_meta_data->>'name',
        SPLIT_PART(u.email, '@', 1) -- fallback στο email prefix
    ) as first_name,
    -- Εξαγωγή επωνύμου από raw_user_meta_data αν υπάρχει
    COALESCE(
        u.raw_user_meta_data->>'last_name',
        u.raw_user_meta_data->>'surname',
        '' -- κενό αν δεν υπάρχει
    ) as last_name,
    u.email,
    -- Εξαγωγή τηλεφώνου από raw_user_meta_data αν υπάρχει
    COALESCE(
        u.raw_user_meta_data->>'phone',
        u.raw_user_meta_data->>'phone_number',
        NULL
    ) as phone,
    -- Προσδιορισμός ρόλου (default: 'user')
    COALESCE(
        u.raw_user_meta_data->>'role',
        'user'
    ) as role,
    -- Γλώσσα (default: 'el')
    COALESCE(
        u.raw_user_meta_data->>'language',
        'el'
    ) as language,
    -- Προτιμήσεις ειδοποιήσεων (default)
    '{"sms": false, "push": true, "email": true}'::jsonb as notification_preferences,
    u.created_at,
    u.updated_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL;

-- ========================================
-- ΒΗΜΑ 4: ΕΠΑΛΗΘΕΥΣΗ ΤΗΣ ΠΡΟΣΘΕΣΗΣ
-- ========================================

-- Έλεγχος ότι όλοι οι χρήστες προστέθηκαν επιτυχώς
SELECT 
    'Επαλήθευση: Συνολικοί χρήστες user_profiles μετά την προσθήκη' as description,
    COUNT(*) as count
FROM user_profiles;

-- Έλεγχος ότι δεν υπάρχουν πλέον χρήστες χωρίς προφίλ
SELECT 
    'Επαλήθευση: Χρήστες που εξακολουθούν να λείπουν' as description,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL;

-- Εμφάνιση των τελευταίων προστιθέμενων χρηστών
SELECT 
    'Τελευταίοι προστιθέμενοι χρήστες:' as info,
    up.user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.role,
    up.created_at
FROM user_profiles up
ORDER BY up.created_at DESC
LIMIT 10;

-- ========================================
-- ΒΗΜΑ 5: ΣΤΑΤΙΣΤΙΚΑ
-- ========================================

-- Στατιστικά ανά ρόλο
SELECT 
    'Στατιστικά ανά ρόλο:' as info,
    role,
    COUNT(*) as count
FROM user_profiles
GROUP BY role
ORDER BY count DESC;

-- Στατιστικά ανά γλώσσα
SELECT 
    'Στατιστικά ανά γλώσσα:' as info,
    language,
    COUNT(*) as count
FROM user_profiles
GROUP BY language
ORDER BY count DESC;

-- Success message
SELECT 'Η προσθήκη χρηστών ολοκληρώθηκε επιτυχώς!' as result;
