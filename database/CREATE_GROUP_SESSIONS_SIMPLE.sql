-- Απλό SQL script για δημιουργία του πίνακα group_sessions
-- Τρέξτε αυτό στο Supabase SQL Editor

CREATE TABLE IF NOT EXISTS group_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID NOT NULL REFERENCES personal_training_schedules(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    trainer VARCHAR(255) NOT NULL,
    room VARCHAR(255) NOT NULL,
    group_type INTEGER NOT NULL DEFAULT 3,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(user_id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Δημιουργία indexes
CREATE INDEX IF NOT EXISTS idx_group_sessions_user_id ON group_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_group_sessions_program_id ON group_sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_group_sessions_date ON group_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_group_sessions_user_program ON group_sessions(user_id, program_id);
CREATE INDEX IF NOT EXISTS idx_group_sessions_active ON group_sessions(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE group_sessions ENABLE ROW LEVEL SECURITY;

-- Policies (με IF NOT EXISTS για να αποφύγουμε σφάλματα αν υπάρχουν)
DO $$ 
BEGIN
    -- Policy για admins - μπορούν να δουν όλα
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'group_sessions' 
        AND policyname = 'Admins can view all group sessions'
    ) THEN
        CREATE POLICY "Admins can view all group sessions" ON group_sessions
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_id = auth.uid() 
                    AND role = 'admin'
                )
            );
    END IF;

    -- Policy για users - μπορούν να δουν μόνο τα δικά τους
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'group_sessions' 
        AND policyname = 'Users can view their own group sessions'
    ) THEN
        CREATE POLICY "Users can view their own group sessions" ON group_sessions
            FOR SELECT USING (user_id = auth.uid());
    END IF;

    -- Policy για admins - μπορούν να εισάγουν/ενημερώσουν/διαγράψουν
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'group_sessions' 
        AND policyname = 'Admins can manage all group sessions'
    ) THEN
        CREATE POLICY "Admins can manage all group sessions" ON group_sessions
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_id = auth.uid() 
                    AND role = 'admin'
                )
            );
    END IF;

    -- Policy για users - μπορούν να ενημερώσουν μόνο τα δικά τους
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'group_sessions' 
        AND policyname = 'Users can update their own group sessions'
    ) THEN
        CREATE POLICY "Users can update their own group sessions" ON group_sessions
            FOR UPDATE USING (user_id = auth.uid());
    END IF;
END $$;
