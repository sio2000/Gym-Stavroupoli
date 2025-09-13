/* FIX ABSENCE RECORDS TABLE - ΔΙΟΡΘΩΣΗ ΠΙΝΑΚΑ ABSENCE_RECORDS
   Εκτέλεση στο Supabase SQL Editor */

/* 1. Check if absence_records table exists */
SELECT 
    'Table Exists Check' as test_name,
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'absence_records' 
AND table_schema = 'public';

/* 2. Check table structure if it exists */
SELECT 
    'Table Structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'absence_records' 
AND table_schema = 'public'
ORDER BY ordinal_position;

/* 3. Drop table if it exists and recreate it */
DROP TABLE IF EXISTS absence_records CASCADE;

/* 4. Create absence_records table with correct structure */
CREATE TABLE absence_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    trainer_name VARCHAR(50) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    absence_type VARCHAR(20) NOT NULL CHECK (absence_type IN ('absent', 'late', 'excused')),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* 5. Create indexes for better performance */
CREATE INDEX idx_absence_records_user_id ON absence_records(user_id);
CREATE INDEX idx_absence_records_trainer_name ON absence_records(trainer_name);
CREATE INDEX idx_absence_records_session_date ON absence_records(session_date);
CREATE INDEX idx_absence_records_session_id ON absence_records(session_id);

/* 6. Enable RLS */
ALTER TABLE absence_records ENABLE ROW LEVEL SECURITY;

/* 7. Create RLS policies */
DROP POLICY IF EXISTS "Trainers can view their own absence records" ON absence_records;
DROP POLICY IF EXISTS "Trainers can insert their own absence records" ON absence_records;
DROP POLICY IF EXISTS "Trainers can update their own absence records" ON absence_records;
DROP POLICY IF EXISTS "Trainers can delete their own absence records" ON absence_records;

CREATE POLICY "Trainers can view their own absence records" ON absence_records
    FOR SELECT USING (
        trainer_name IN (
            SELECT CASE 
                WHEN up.email LIKE '%mike%' THEN 'Mike'
                WHEN up.email LIKE '%jordan%' THEN 'Jordan'
                ELSE up.email
            END
            FROM user_profiles up 
            WHERE up.user_id = auth.uid()
        )
    );

CREATE POLICY "Trainers can insert their own absence records" ON absence_records
    FOR INSERT WITH CHECK (
        trainer_name IN (
            SELECT CASE 
                WHEN up.email LIKE '%mike%' THEN 'Mike'
                WHEN up.email LIKE '%jordan%' THEN 'Jordan'
                ELSE up.email
            END
            FROM user_profiles up 
            WHERE up.user_id = auth.uid()
        )
    );

CREATE POLICY "Trainers can update their own absence records" ON absence_records
    FOR UPDATE USING (
        trainer_name IN (
            SELECT CASE 
                WHEN up.email LIKE '%mike%' THEN 'Mike'
                WHEN up.email LIKE '%jordan%' THEN 'Jordan'
                ELSE up.email
            END
            FROM user_profiles up 
            WHERE up.user_id = auth.uid()
        )
    );

CREATE POLICY "Trainers can delete their own absence records" ON absence_records
    FOR DELETE USING (
        trainer_name IN (
            SELECT CASE 
                WHEN up.email LIKE '%mike%' THEN 'Mike'
                WHEN up.email LIKE '%jordan%' THEN 'Jordan'
                ELSE up.email
            END
            FROM user_profiles up 
            WHERE up.user_id = auth.uid()
        )
    );

/* 8. Verify table structure */
SELECT 
    'Final Table Structure' as test_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'absence_records' 
AND table_schema = 'public'
ORDER BY ordinal_position;

/* 9. Test insert a sample record */
INSERT INTO absence_records (
    user_id,
    trainer_name,
    session_id,
    session_date,
    session_time,
    absence_type,
    reason,
    notes
) VALUES (
    (SELECT user_id FROM user_profiles WHERE role = 'user' LIMIT 1),
    'Jordan',
    'test-session-123',
    CURRENT_DATE,
    '10:00:00',
    'absent',
    'Test absence',
    'Test notes'
);

/* 10. Verify the record was inserted */
SELECT 
    'Test Record' as test_name,
    id,
    user_id,
    trainer_name,
    session_id,
    session_date,
    session_time,
    absence_type,
    reason,
    notes
FROM absence_records 
WHERE session_id = 'test-session-123';

/* Success message */
SELECT 'Absence records table fixed and ready!' as message;
