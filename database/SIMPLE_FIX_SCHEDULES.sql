/* SIMPLE FIX SCHEDULES - ΑΠΛΗ ΔΙΟΡΘΩΣΗ ΠΙΝΑΚΑ SCHEDULES
   Εκτέλεση στο Supabase SQL Editor */

/* Add missing columns to personal_training_schedules */
ALTER TABLE personal_training_schedules 
ADD COLUMN IF NOT EXISTS month INTEGER,
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS trainer_name TEXT;

/* Update existing records to have month and year */
UPDATE personal_training_schedules 
SET 
    month = EXTRACT(MONTH FROM created_at)::INTEGER,
    year = EXTRACT(YEAR FROM created_at)::INTEGER,
    trainer_name = COALESCE(trainer_name, 'Mike')
WHERE month IS NULL OR year IS NULL;

/* Create index for better performance */
CREATE INDEX IF NOT EXISTS idx_personal_training_schedules_month_year ON personal_training_schedules(month, year);
CREATE INDEX IF NOT EXISTS idx_personal_training_schedules_trainer_name ON personal_training_schedules(trainer_name);

/* Test the table structure */
SELECT 
    'Personal Training Schedules Structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'personal_training_schedules' 
AND table_schema = 'public'
ORDER BY ordinal_position;

/* Test insert a new schedule */
INSERT INTO personal_training_schedules (
    user_id,
    trainer_name,
    month,
    year,
    schedule_data,
    status,
    created_by
) VALUES (
    '00000000-0000-0000-0000-000000000004',
    'Mike',
    1,
    2025,
    '{"sessions": [{"date": "2025-01-07", "startTime": "10:00", "endTime": "11:00", "type": "Personal Training", "room": "Αίθουσα 3", "trainer": "Mike"}]}',
    'pending',
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;

/* Test query that AdminPanel uses */
SELECT 
    'AdminPanel Query Test' as test_name,
    user_id,
    trainer_name,
    month,
    year,
    status,
    created_by
FROM personal_training_schedules 
WHERE status = 'pending';

/* Success message */
SELECT 'Personal training schedules table fixed!' as message;
