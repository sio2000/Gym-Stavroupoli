-- =====================================================================
-- Live QR Scanner — Scan History table
-- Feature: Secretary "Live QR Scanner" (continuous camera scanning)
-- =====================================================================
-- Design notes:
--  * This table is INDEPENDENT from scan_audit_logs (which stays untouched
--    and keeps powering gym-occupancy logic).
--  * Unlike scan_audit_logs (qr_code_id/user_id NOT NULL), this table allows
--    NULL user_id / qr_code so it can also record INVALID scans.
--  * No hard FK on user_id ON PURPOSE: history is an audit trail and must NEVER
--    fail to insert (e.g. if a user is later deleted). We keep a denormalized
--    user_name snapshot instead. scanned_by has a soft FK (ON DELETE SET NULL).
--  * Fully idempotent: safe to run multiple times.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.qr_scan_history (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NULL,                 -- NULL for INVALID scans
    qr_code             text NULL,                 -- raw scanned token value
    user_name           text NULL,                 -- snapshot for history display
    scan_result         varchar(10) NOT NULL
                        CHECK (scan_result IN ('PASS', 'DENIED', 'INVALID')),
    subscription_status varchar(40) NULL,          -- active / expired / none / personal_training / ...
    category            varchar(20) NULL,          -- free_gym / pilates / personal
    reason              text NULL,                 -- human-readable detail
    scanned_by          uuid NULL,                 -- secretary who scanned
    scan_time           timestamptz NOT NULL DEFAULT now(),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Soft FK only for scanned_by (the operator); keep history if operator removed.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_qr_scan_history_scanned_by'
          AND table_name = 'qr_scan_history'
    ) THEN
        ALTER TABLE public.qr_scan_history
            ADD CONSTRAINT fk_qr_scan_history_scanned_by
            FOREIGN KEY (scanned_by)
            REFERENCES public.user_profiles(user_id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- Indexes for filters / search / sorting / pagination
CREATE INDEX IF NOT EXISTS idx_qr_scan_history_scan_time   ON public.qr_scan_history (scan_time DESC);
CREATE INDEX IF NOT EXISTS idx_qr_scan_history_user_id     ON public.qr_scan_history (user_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_history_result      ON public.qr_scan_history (scan_result);
CREATE INDEX IF NOT EXISTS idx_qr_scan_history_created_at  ON public.qr_scan_history (created_at DESC);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.qr_scan_history_set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_qr_scan_history_updated_at ON public.qr_scan_history;
CREATE TRIGGER trg_qr_scan_history_updated_at
    BEFORE UPDATE ON public.qr_scan_history
    FOR EACH ROW EXECUTE FUNCTION public.qr_scan_history_set_updated_at();

-- =====================================================================
-- Row Level Security
-- =====================================================================
ALTER TABLE public.qr_scan_history ENABLE ROW LEVEL SECURITY;

-- SELECT: secretaries + admins
DROP POLICY IF EXISTS "qr_scan_history_select" ON public.qr_scan_history;
CREATE POLICY "qr_scan_history_select" ON public.qr_scan_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.user_id = auth.uid()
              AND up.role IN ('secretary', 'admin')
        )
    );

-- INSERT: secretaries + admins
DROP POLICY IF EXISTS "qr_scan_history_insert" ON public.qr_scan_history;
CREATE POLICY "qr_scan_history_insert" ON public.qr_scan_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.user_id = auth.uid()
              AND up.role IN ('secretary', 'admin')
        )
    );

-- =====================================================================
-- Verify
-- =====================================================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'qr_scan_history'
ORDER BY ordinal_position;
