-- Update RLS policies to include trainer_name column access
-- This ensures trainers can access schedules assigned to them

-- 1. Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own schedules" ON personal_training_schedules;
DROP POLICY IF EXISTS "Admins can manage all schedules" ON personal_training_schedules;
DROP POLICY IF EXISTS "Users can update their schedule status" ON personal_training_schedules;

-- 2. Create new policies that include trainer access
-- Users can view their own schedules
CREATE POLICY "Users can view their own schedules" ON personal_training_schedules
    FOR SELECT USING (user_id = auth.uid());

-- Trainers can view schedules assigned to them
CREATE POLICY "Trainers can view their assigned schedules" ON personal_training_schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid() 
            AND up.role = 'trainer'
            AND CONCAT(up.first_name, ' ', up.last_name) = trainer_name
        )
    );

-- Admins can manage all schedules
CREATE POLICY "Admins can manage all schedules" ON personal_training_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Users can update their schedule status
CREATE POLICY "Users can update their schedule status" ON personal_training_schedules
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 3. Verify policies are working
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'personal_training_schedules'
ORDER BY policyname;

-- Success message
SELECT 'RLS policies updated for trainer_name column!' as message;
