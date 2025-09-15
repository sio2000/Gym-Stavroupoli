-- Fix User Profile Issue
-- Διόρθωση του προβλήματος με τον user profile που λείπει

-- Check if user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE id = '4dd59117-6e73-4a2d-bd39-46d21c8c6f90';

-- Check if user profile exists
SELECT id, user_id, first_name, last_name, email 
FROM user_profiles 
WHERE user_id = '4dd59117-6e73-4a2d-bd39-46d21c8c6f90';

-- Create user profile if it doesn't exist
INSERT INTO user_profiles (
    user_id,
    first_name,
    last_name,
    email,
    role,
    created_at,
    updated_at
)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'firstName', 'User'),
    COALESCE(raw_user_meta_data->>'lastName', 'Name'),
    email,
    COALESCE(raw_user_meta_data->>'role', 'user'),
    created_at,
    NOW()
FROM auth.users 
WHERE id = '4dd59117-6e73-4a2d-bd39-46d21c8c6f90'
AND NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = '4dd59117-6e73-4a2d-bd39-46d21c8c6f90'
);

-- Verify the fix
SELECT 
    up.id,
    up.user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.role,
    up.created_at
FROM user_profiles up
WHERE up.user_id = '4dd59117-6e73-4a2d-bd39-46d21c8c6f90';
