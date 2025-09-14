-- Check the current structure of membership_requests table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'membership_requests' 
ORDER BY ordinal_position;
