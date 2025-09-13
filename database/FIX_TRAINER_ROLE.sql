-- FIX TRAINER ROLE - Run this to fix trainer1@freegym.gr role and name
-- This will update the trainer's role from 'user' to 'trainer' and add a name

-- Step 1: Check current state
SELECT 'BEFORE - Trainer Role:' as step, user_id, email, first_name, last_name, role 
FROM user_profiles 
WHERE email = 'trainer1@freegym.gr';

-- Step 2: Update trainer role and add name
UPDATE user_profiles 
SET 
  role = 'trainer',
  first_name = 'Trainer',
  last_name = 'One',
  updated_at = NOW()
WHERE email = 'trainer1@freegym.gr';

-- Step 3: Verify the update
SELECT 'AFTER - Trainer Role:' as step, user_id, email, first_name, last_name, role 
FROM user_profiles 
WHERE email = 'trainer1@freegym.gr';

-- Step 4: Check if there are other trainer emails that need fixing
SELECT 'Other trainers to check:' as step, user_id, email, first_name, last_name, role 
FROM user_profiles 
WHERE email LIKE '%trainer%' OR email LIKE '%@freegym.gr';

-- Step 5: Test trainer access
SELECT 'Trainer Access Test:' as step, COUNT(*) as accessible_schedules
FROM personal_training_schedules;
