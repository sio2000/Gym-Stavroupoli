-- ═══════════════════════════════════════════════════════════════════════════════
-- ΔΙΟΡΘΩΣΗ: Constraints για Weekly Pilates Refill
-- ═══════════════════════════════════════════════════════════════════════════════
-- Πρόβλημα: 
-- 1. Check constraint: new_deposit_amount >= previous_deposit_amount
--    Αυτό ΔΕΝ ισχύει γιατί κάνουμε RESET (μπορεί να είναι μικρότερο)
-- 2. Foreign key: source_request_id (αλλά αυτό είναι ήδη nullable)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ΒΗΜΑ 1: Βρείτε τα constraints
SELECT 'ΒΗΜΑ 1: Εύρεση constraints' as step;

SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.ultimate_weekly_refills'::regclass
AND conname LIKE '%check%'
ORDER BY conname;

-- ΒΗΜΑ 2: Αφαίρεση check constraint που ελέγχει new_deposit_amount >= previous_deposit_amount
SELECT 'ΒΗΜΑ 2: Αφαίρεση check constraint' as step;

-- Βρείτε το όνομα του constraint
DO $$
DECLARE
    v_constraint_name text;
BEGIN
    -- Βρες το check constraint που ελέγχει new_deposit_amount >= previous_deposit_amount
    SELECT conname INTO v_constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.ultimate_weekly_refills'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%new_deposit_amount%previous_deposit_amount%';
    
    IF v_constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.ultimate_weekly_refills DROP CONSTRAINT IF EXISTS %I', v_constraint_name);
        RAISE NOTICE 'Διαγράφηκε το constraint: %', v_constraint_name;
    ELSE
        RAISE NOTICE 'Δεν βρέθηκε check constraint για new_deposit_amount >= previous_deposit_amount';
    END IF;
END $$;

-- ΒΗΜΑ 3: Επαλήθευση - δείξε τα υπόλοιπα constraints
SELECT 'ΒΗΜΑ 3: Επαλήθευση constraints' as step;

SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.ultimate_weekly_refills'::regclass
ORDER BY contype, conname;

-- ΒΗΜΑ 4: Βεβαιώσου ότι η function περνάει NULL για source_request_id
SELECT 'ΒΗΜΑ 4: Ελέγχος function' as step;

-- Η function θα πρέπει να έχει ήδη NULL (από το FIX_REFILL_FOR_ALL_ULTIMATE.sql)
-- Αυτό το query δείχνει την τρέχουσα function
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'process_weekly_pilates_refills'
AND pronamespace = 'public'::regnamespace
LIMIT 1;

SELECT '✅ Constraints διορθώθηκαν!' as result;

