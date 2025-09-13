-- Simple script to update Katerina to trainer role
-- Email: katerina@freegym.gr
-- This script will work regardless of current state

-- First, let's see what exists
SELECT 
    u.id,
    u.email,
    up.first_name,
    up.last_name,
    up.role
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'katerina@freegym.gr';

-- Update or insert user profile using UPSERT
INSERT INTO public.user_profiles (
    user_id,
    first_name,
    last_name,
    email,
    role,
    created_at,
    updated_at
)
SELECT 
    u.id,
    'Katerina',
    'Trainer',
    'katerina@freegym.gr',
    'trainer',
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'katerina@freegym.gr'
ON CONFLICT (user_id) 
DO UPDATE SET
    first_name = 'Katerina',
    last_name = 'Trainer',
    role = 'trainer',
    updated_at = NOW();

-- Verify the result
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    up.first_name,
    up.last_name,
    up.role,
    up.created_at,
    up.updated_at
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'katerina@freegym.gr';

