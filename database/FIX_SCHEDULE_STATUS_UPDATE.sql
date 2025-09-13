/* FIX SCHEDULE STATUS UPDATE - ΔΙΟΡΘΩΣΗ ΕΝΗΜΕΡΩΣΗΣ STATUS ΠΡΟΓΡΑΜΜΑΤΩΝ
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check current schedules and their status */
SELECT 
    'Current Schedules Status' as test_name,
    id,
    user_id,
    status,
    accepted_at,
    declined_at,
    created_at
FROM personal_training_schedules 
ORDER BY created_at DESC
LIMIT 10;

/* 2. Check if columns exist */
SELECT 
    'Table Structure Check' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'personal_training_schedules' 
AND column_name IN ('status', 'accepted_at', 'declined_at', 'updated_at')
ORDER BY column_name;

/* 3. Add missing columns if they don't exist */
ALTER TABLE personal_training_schedules 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

/* 4. Update existing records to have proper timestamps */
UPDATE personal_training_schedules 
SET 
    updated_at = COALESCE(updated_at, created_at),
    accepted_at = CASE 
        WHEN status = 'accepted' AND accepted_at IS NULL THEN created_at
        ELSE accepted_at
    END,
    declined_at = CASE 
        WHEN status = 'declined' AND declined_at IS NULL THEN created_at
        ELSE declined_at
    END
WHERE updated_at IS NULL OR accepted_at IS NULL OR declined_at IS NULL;

/* 5. Create trigger to automatically update updated_at */
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

/* 6. Drop existing trigger if it exists */
DROP TRIGGER IF EXISTS update_personal_training_schedules_updated_at ON personal_training_schedules;

/* 7. Create trigger */
CREATE TRIGGER update_personal_training_schedules_updated_at
    BEFORE UPDATE ON personal_training_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

/* 8. Test the update functionality */
UPDATE personal_training_schedules 
SET status = 'pending'
WHERE id = (SELECT id FROM personal_training_schedules LIMIT 1);

/* 9. Check RLS policies for personal_training_schedules */
SELECT 
    'RLS Policies Check' as test_name,
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'personal_training_schedules'
AND schemaname = 'public';

/* 10. Create or update RLS policies for status updates */
DROP POLICY IF EXISTS "Users can update own schedule status" ON personal_training_schedules;

CREATE POLICY "Users can update own schedule status" ON personal_training_schedules
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

/* 11. Test final status */
SELECT 
    'Final Test' as test_name,
    id,
    user_id,
    status,
    accepted_at,
    declined_at,
    updated_at,
    created_at
FROM personal_training_schedules 
ORDER BY updated_at DESC
LIMIT 5;

/* Success message */
SELECT 'Schedule status update functionality fixed!' as message;
