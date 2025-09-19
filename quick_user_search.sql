-- QUICK USER SEARCH: ΜΙΧΑΛΑΚΗΣ ΘΕΩΔΩΡΗΣ
-- Very simple and fast user search

-- Search for user profile
SELECT 'SEARCHING FOR USER: ΜΙΧΑΛΑΚΗΣ ΘΕΩΔΩΡΗΣ' as search_title;

-- Basic user search
SELECT 
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
ORDER BY created_at DESC;
