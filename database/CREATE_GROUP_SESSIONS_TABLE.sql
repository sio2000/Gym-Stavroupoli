-- Δημιουργία πίνακα group_sessions για αποθήκευση των πραγματικών ημερομηνιών των group sessions
-- Αυτός ο πίνακας θα αντικαταστήσει τη χρήση του group_assignments για την εμφάνιση διαθέσιμων ωρών

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

-- Δημιουργία indexes για καλύτερη απόδοση
CREATE INDEX IF NOT EXISTS idx_group_sessions_user_id ON group_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_group_sessions_program_id ON group_sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_group_sessions_date ON group_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_group_sessions_user_program ON group_sessions(user_id, program_id);
CREATE INDEX IF NOT EXISTS idx_group_sessions_active ON group_sessions(is_active) WHERE is_active = true;

-- Δημιουργία trigger για updated_at
CREATE OR REPLACE FUNCTION update_group_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_sessions_updated_at
    BEFORE UPDATE ON group_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_group_sessions_updated_at();

-- Δημιουργία RLS policies
ALTER TABLE group_sessions ENABLE ROW LEVEL SECURITY;

-- Policy για admins - μπορούν να δουν όλα
CREATE POLICY "Admins can view all group sessions" ON group_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy για users - μπορούν να δουν μόνο τα δικά τους
CREATE POLICY "Users can view their own group sessions" ON group_sessions
    FOR SELECT USING (user_id = auth.uid());

-- Policy για admins - μπορούν να εισάγουν/ενημερώσουν/διαγράψουν
CREATE POLICY "Admins can manage all group sessions" ON group_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy για users - μπορούν να ενημερώσουν μόνο τα δικά τους (για κρατήσεις)
CREATE POLICY "Users can update their own group sessions" ON group_sessions
    FOR UPDATE USING (user_id = auth.uid());

-- Σχόλια για τον πίνακα
COMMENT ON TABLE group_sessions IS 'Πίνακας για αποθήκευση των πραγματικών group sessions με ημερομηνίες/ώρες που μπορούν να κρατηθούν';
COMMENT ON COLUMN group_sessions.program_id IS 'ID του προγράμματος personal training';
COMMENT ON COLUMN group_sessions.user_id IS 'ID του χρήστη που ανήκει η session';
COMMENT ON COLUMN group_sessions.session_date IS 'Ημερομηνία της session (πραγματική ημερομηνία για κράτηση)';
COMMENT ON COLUMN group_sessions.start_time IS 'Ώρα έναρξης της session';
COMMENT ON COLUMN group_sessions.end_time IS 'Ώρα λήξης της session';
COMMENT ON COLUMN group_sessions.trainer IS 'Όνομα του προπονητή';
COMMENT ON COLUMN group_sessions.room IS 'Αίθουσα προπόνησης';
COMMENT ON COLUMN group_sessions.group_type IS 'Τύπος ομάδας (χωρητικότητα)';
COMMENT ON COLUMN group_sessions.is_active IS 'Εάν η session είναι ενεργή και μπορεί να κρατηθεί';
