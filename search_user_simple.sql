-- SIMPLE USER SEARCH: ΜΙΧΑΛΑΚΗΣ ΘΕΩΔΩΡΗΣ
-- Quick search for user data

-- Basic user profile search
SELECT 'SEARCHING FOR: ΜΙΧΑΛΑΚΗΣ ΘΕΩΔΩΡΗΣ' as search_info;

-- Search user profiles
SELECT 
    'USER PROFILE:' as data_type,
    user_id,
    first_name,
    last_name,
    email,
    phone,
    role,
    created_at
FROM user_profiles 
WHERE 
    first_name ILIKE '%THEODOR%'
    OR last_name ILIKE '%THEODOR%'
    OR first_name ILIKE '%ΘΕΩΔΩΡ%'
    OR last_name ILIKE '%ΘΕΩΔΩΡ%'
    OR first_name ILIKE '%MICHALAK%'
    OR last_name ILIKE '%MICHALAK%'
    OR first_name ILIKE '%ΜΙΧΑΛΑΚ%'
    OR last_name ILIKE '%ΜΙΧΑΛΑΚ%'
    OR email ILIKE '%michalak%'
    OR email ILIKE '%theodor%'

UNION ALL

-- Search in memberships
SELECT 
    'MEMBERSHIP:' as data_type,
    m.user_id,
    up.first_name,
    up.last_name,
    up.email,
    mp.name as package_name,
    m.status,
    m.start_date::text,
    m.end_date::text
FROM memberships m
JOIN user_profiles up ON m.user_id = up.user_id
JOIN membership_packages mp ON m.package_id = mp.id
WHERE 
    up.first_name ILIKE '%THEODOR%'
    OR up.last_name ILIKE '%THEODOR%'
    OR up.first_name ILIKE '%ΘΕΩΔΩΡ%'
    OR up.last_name ILIKE '%ΘΕΩΔΩΡ%'
    OR up.first_name ILIKE '%MICHALAK%'
    OR up.last_name ILIKE '%MICHALAK%'
    OR up.first_name ILIKE '%ΜΙΧΑΛΑΚ%'
    OR up.last_name ILIKE '%ΜΙΧΑΛΑΚ%'

UNION ALL

-- Search in personal training schedules
SELECT 
    'PERSONAL TRAINING:' as data_type,
    pts.user_id,
    up.first_name,
    up.last_name,
    up.email,
    pts.training_type,
    pts.status,
    pts.month::text,
    pts.year::text
FROM personal_training_schedules pts
JOIN user_profiles up ON pts.user_id = up.user_id
WHERE 
    up.first_name ILIKE '%THEODOR%'
    OR up.last_name ILIKE '%THEODOR%'
    OR up.first_name ILIKE '%ΘΕΩΔΩΡ%'
    OR up.last_name ILIKE '%ΘΕΩΔΩΡ%'
    OR up.first_name ILIKE '%MICHALAK%'
    OR up.last_name ILIKE '%MICHALAK%'
    OR up.first_name ILIKE '%ΜΙΧΑΛΑΚ%'
    OR up.last_name ILIKE '%ΜΙΧΑΛΑΚ%'

ORDER BY data_type, created_at DESC;
