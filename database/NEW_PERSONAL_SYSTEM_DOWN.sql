-- ============================================================================
-- NEW PERSONAL SYSTEM - DOWN MIGRATION (rollback)
-- ============================================================================
-- Αφαιρεί ΜΟΝΟ τα αντικείμενα του νέου συστήματος.
-- ΔΕΝ επαναφέρει τα CHECK constraints (τα extended values είναι superset,
-- ασφαλή να παραμείνουν).
-- ΠΡΟΣΟΧΗ: διαγράφει δεδομένα νέου συστήματος (slots/bookings/deposits).
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_personal_refill_status(uuid);
DROP FUNCTION IF EXISTS public.process_personal_weekly_refills();
DROP FUNCTION IF EXISTS public.cancel_personal_booking(uuid, uuid);
DROP FUNCTION IF EXISTS public.book_personal_class(uuid, uuid, uuid, text);
DROP FUNCTION IF EXISTS public.get_active_personal_subscription(uuid, text);

DROP VIEW IF EXISTS public.personal_slots_with_occupancy;

DROP TABLE IF EXISTS public.personal_weekly_refills;
DROP TABLE IF EXISTS public.personal_deposits;
DROP TABLE IF EXISTS public.personal_bookings;
DROP TABLE IF EXISTS public.personal_class_slots;
DROP TABLE IF EXISTS public.personal_subscriptions;

-- Απενεργοποίηση πακέτων (όχι διαγραφή - πιθανόν να αναφέρονται από memberships)
UPDATE public.membership_packages SET is_active = false
WHERE name IN ('Personal Ατομικό', 'Ομαδικό WOD');

SELECT 'NEW_PERSONAL_SYSTEM_DOWN applied' AS result;
