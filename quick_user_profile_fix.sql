-- Quick User Profile Fix
-- Γρήγορη διόρθωση του user profile που λείπει

-- Insert missing user profile
INSERT INTO user_profiles (
    user_id,
    first_name,
    last_name,
    email,
    role,
    created_at,
    updated_at
)
VALUES (
    '4dd59117-6e73-4a2d-bd39-46d21c8c6f90',
    'User',
    'Name',
    'user@example.com',
    'user',
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO NOTHING;

-- Verify the fix
SELECT 
    id,
    user_id,
    first_name,
    last_name,
    email,
    role,
    created_at
FROM user_profiles 
WHERE user_id = '4dd59117-6e73-4a2d-bd39-46d21c8c6f90';
