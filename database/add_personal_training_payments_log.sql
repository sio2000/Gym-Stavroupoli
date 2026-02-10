-- ═══════════════════════════════════════════════════════════════════════════════
-- CREATE personal_training_payments_log TABLE
-- Tracks all personal training renewal payments (cash, POS, kettlebell points)
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN TRANSACTION;

-- Create the payment log table
CREATE TABLE IF NOT EXISTS public.personal_training_payments_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES public.personal_training_schedules(id) ON DELETE CASCADE,
  payment_method VARCHAR(10) CHECK (payment_method IN ('cash', 'pos')),
  cash_amount NUMERIC(10, 2) DEFAULT 0,
  pos_amount NUMERIC(10, 2) DEFAULT 0,
  total_amount NUMERIC(10, 2) DEFAULT 0,
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_personal_training_payments_log_user_id 
  ON public.personal_training_payments_log(user_id);

CREATE INDEX IF NOT EXISTS idx_personal_training_payments_log_schedule_id 
  ON public.personal_training_payments_log(schedule_id);

CREATE INDEX IF NOT EXISTS idx_personal_training_payments_log_recorded_at 
  ON public.personal_training_payments_log(recorded_at DESC);

-- Enable RLS
ALTER TABLE public.personal_training_payments_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins and secretaries can view all payment logs" 
  ON public.personal_training_payments_log FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_profiles 
      WHERE role IN ('admin', 'secretary')
    )
  );

CREATE POLICY "Admins and secretaries can insert payment logs" 
  ON public.personal_training_payments_log FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.user_profiles 
      WHERE role IN ('admin', 'secretary')
    )
  );

CREATE POLICY "Users can view their own payment logs" 
  ON public.personal_training_payments_log FOR SELECT
  USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE public.personal_training_payments_log IS 'Logs all personal training renewal payments including cash, POS, and kettlebell points';
COMMENT ON COLUMN public.personal_training_payments_log.user_id IS 'User who paid for renewal';
COMMENT ON COLUMN public.personal_training_payments_log.schedule_id IS 'Personal training schedule being renewed';
COMMENT ON COLUMN public.personal_training_payments_log.payment_method IS 'Payment method: cash or pos';
COMMENT ON COLUMN public.personal_training_payments_log.cash_amount IS 'Amount paid in cash (€)';
COMMENT ON COLUMN public.personal_training_payments_log.pos_amount IS 'Amount paid via POS (€)';
COMMENT ON COLUMN public.personal_training_payments_log.total_amount IS 'Total amount paid (cash + pos)';
COMMENT ON COLUMN public.personal_training_payments_log.notes IS 'Optional notes about the payment';
COMMENT ON COLUMN public.personal_training_payments_log.recorded_at IS 'When the payment was recorded';

SELECT '✅ personal_training_payments_log table created successfully' as result;

COMMIT TRANSACTION;
