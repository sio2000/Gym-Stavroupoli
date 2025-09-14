-- FIX RLS POLICIES - ΔΙΟΡΘΩΣΗ RLS POLICIES
-- Εκτέλεση στο Supabase SQL Editor

-- Drop all existing policies to fix infinite recursion
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own schedules" ON personal_training_schedules;
DROP POLICY IF EXISTS "Admins can view all schedules" ON personal_training_schedules;
DROP POLICY IF EXISTS "Admins can insert schedules" ON personal_training_schedules;
DROP POLICY IF EXISTS "Admins can update schedules" ON personal_training_schedules;
DROP POLICY IF EXISTS "Users can view own absences" ON absence_records;
DROP POLICY IF EXISTS "Trainers can view their users' absences" ON absence_records;
DROP POLICY IF EXISTS "Trainers can insert absences" ON absence_records;
DROP POLICY IF EXISTS "Trainers can update absences" ON absence_records;
DROP POLICY IF EXISTS "Admins can view all absences" ON absence_records;

-- Create simple, non-recursive RLS policies for user_profiles
CREATE POLICY "Enable read access for all users" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create simple RLS policies for personal_training_schedules
CREATE POLICY "Enable read access for all users" ON personal_training_schedules
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON personal_training_schedules
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users only" ON personal_training_schedules
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create simple RLS policies for absence_records
CREATE POLICY "Enable read access for all users" ON absence_records
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON absence_records
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users only" ON absence_records
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create admin user
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'admin@freegym.gr',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Create admin profile
INSERT INTO user_profiles (
    user_id,
    first_name,
    last_name,
    email,
    role,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Admin',
    'User',
    'admin@freegym.gr',
    'admin',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Create trainer users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES 
(
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'mike@freegym.gr',
    crypt('trainer123', gen_salt('bf')),
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
),
(
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'jordan@freegym.gr',
    crypt('trainer123', gen_salt('bf')),
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Create trainer profiles
INSERT INTO user_profiles (
    user_id,
    first_name,
    last_name,
    email,
    role,
    created_at,
    updated_at
) VALUES 
(
    '00000000-0000-0000-0000-000000000002',
    'Mike',
    'Trainer',
    'mike@freegym.gr',
    'trainer',
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0000-000000000003',
    'Jordan',
    'Trainer',
    'jordan@freegym.gr',
    'trainer',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Create some test users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES 
(
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'user1@freegym.gr',
    crypt('user123', gen_salt('bf')),
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
),
(
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000005',
    'authenticated',
    'authenticated',
    'user2@freegym.gr',
    crypt('user123', gen_salt('bf')),
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Create test user profiles
INSERT INTO user_profiles (
    user_id,
    first_name,
    last_name,
    email,
    role,
    created_at,
    updated_at
) VALUES 
(
    '00000000-0000-0000-0000-000000000004',
    'User',
    'One',
    'user1@freegym.gr',
    'user',
    NOW(),
    NOW()
),
(
    '00000000-0000-0000-0000-000000000005',
    'User',
    'Two',
    'user2@freegym.gr',
    'user',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Create sample personal training schedules
INSERT INTO personal_training_schedules (
    user_id,
    trainer_name,
    schedule_data,
    status,
    created_by
) VALUES 
(
    '00000000-0000-0000-0000-000000000004',
    'Mike',
    '{"sessions": [{"date": "2025-01-07", "startTime": "10:00", "endTime": "11:00", "type": "Personal Training", "room": "Αίθουσα 3", "trainer": "Mike"}]}',
    'accepted',
    '00000000-0000-0000-0000-000000000001'
),
(
    '00000000-0000-0000-0000-000000000005',
    'Jordan',
    '{"sessions": [{"date": "2025-01-07", "startTime": "14:00", "endTime": "15:00", "type": "Personal Training", "room": "Αίθουσα 3", "trainer": "Jordan"}]}',
    'accepted',
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;

-- Success message
SELECT 'RLS policies fixed and test users created!' as message;
