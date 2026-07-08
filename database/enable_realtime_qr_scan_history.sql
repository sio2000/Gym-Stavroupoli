-- =====================================================================
-- Enable Supabase Realtime (Postgres changes) for qr_scan_history
-- =====================================================================
-- The /tablet page listens to INSERTs on qr_scan_history so that EVERY scan,
-- from ANY device / ANY scanner, is guaranteed to appear on the tablet screen
-- (independently of the in-app broadcast, which can be flaky/unavailable).
--
-- Run this ONCE in the Supabase SQL editor. Safe to re-run.
-- =====================================================================

-- Add the table to the realtime publication (ignore if it's already there).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'qr_scan_history'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.qr_scan_history';
  END IF;
END
$$;

-- Ensure full row data is delivered on changes (so the payload carries all
-- columns the tablet needs: user_name, scan_result, subscription_status, etc.).
ALTER TABLE public.qr_scan_history REPLICA IDENTITY FULL;

-- Verify (optional): should return one row for qr_scan_history.
-- SELECT schemaname, tablename FROM pg_publication_tables
-- WHERE pubname = 'supabase_realtime' AND tablename = 'qr_scan_history';
