/* ADD MISSING PROFILE COLUMNS - ΠΡΟΣΘΗΚΗ ΣΤΗΛΩΝ PROFILES
   Εκτέλεση στο Supabase SQL Editor */

/* Add missing columns if they don't exist */
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS dob DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS profile_photo TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dob_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'el',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

/* Update existing records to have updated_at */
UPDATE public.user_profiles 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

/* Check the updated structure */
SELECT 
    'Updated Profile Structure' as test_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

/* Success message */
SELECT 'Missing profile columns added!' as message;
