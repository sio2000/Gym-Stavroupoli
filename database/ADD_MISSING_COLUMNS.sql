/* ADD MISSING COLUMNS - ΠΡΟΣΘΗΚΗ LACKING ΣΤΗΛΩΝ
   Εκτέλεση στο Supabase SQL Editor */

/* Add missing columns to personal_training_schedules */
ALTER TABLE personal_training_schedules 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;

/* Create index for better performance */
CREATE INDEX IF NOT EXISTS idx_personal_training_schedules_accepted_at ON personal_training_schedules(accepted_at);
CREATE INDEX IF NOT EXISTS idx_personal_training_schedules_declined_at ON personal_training_schedules(declined_at);

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

/* Success message */
SELECT 'Missing columns added successfully!' as message;
