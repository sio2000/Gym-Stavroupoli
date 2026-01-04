-- ═══════════════════════════════════════════════════════════════════════════════
-- ΔΙΟΡΘΩΣΗ: Constraints για Weekly Pilates Refill
-- ═══════════════════════════════════════════════════════════════════════════════
-- Πρόβλημα: Check constraint new_deposit_amount >= previous_deposit_amount
-- Λύση: Αφαίρεση αυτού του constraint γιατί κάνουμε RESET
-- ═══════════════════════════════════════════════════════════════════════════════

-- ΒΗΜΑ 1: Δείξε όλα τα check constraints
SELECT 'ΒΗΜΑ 1: Check constraints πριν' as step;

SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.ultimate_weekly_refills'::regclass
AND contype = 'c'
ORDER BY conname;

-- ΒΗΜΑ 2: Αφαίρεση του check constraint
SELECT 'ΒΗΜΑ 2: Αφαίρεση check constraint' as step;

-- Δοκίμασε διάφορα ονόματα constraints
DO $$
DECLARE
    v_constraint_name text;
BEGIN
    -- Προσπάθησε να βρεις το constraint με διάφορους τρόπους
    SELECT conname INTO v_constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.ultimate_weekly_refills'::regclass
    AND contype = 'c'
    AND (
        pg_get_constraintdef(oid) LIKE '%new_deposit_amount%>=%previous_deposit_amount%'
        OR pg_get_constraintdef(oid) LIKE '%previous_deposit_amount%<=%new_deposit_amount%'
        OR conname LIKE '%check%'
    )
    AND pg_get_constraintdef(oid) NOT LIKE '%refill_week_number%'
    LIMIT 1;
    
    IF v_constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.ultimate_weekly_refills DROP CONSTRAINT IF EXISTS %I', v_constraint_name);
        RAISE NOTICE '✅ Διαγράφηκε το constraint: %', v_constraint_name;
    ELSE
        RAISE NOTICE '⚠️ Δεν βρέθηκε check constraint για new_deposit_amount';
    END IF;
    
    -- Δοκίμασε να διαγράψεις με συγκεκριμένο όνομα αν υπάρχει
    BEGIN
        ALTER TABLE public.ultimate_weekly_refills DROP CONSTRAINT IF EXISTS ultimate_weekly_refills_check;
        RAISE NOTICE '✅ Διαγράφηκε το constraint: ultimate_weekly_refills_check';
    EXCEPTION
        WHEN undefined_object THEN
            RAISE NOTICE 'ℹ️ Το constraint ultimate_weekly_refills_check δεν υπάρχει';
    END;
END $$;

-- ΒΗΜΑ 3: Επαλήθευση - δείξε τα υπόλοιπα check constraints
SELECT 'ΒΗΜΑ 3: Check constraints μετά' as step;

SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.ultimate_weekly_refills'::regclass
AND contype = 'c'
ORDER BY conname;

SELECT '✅ Ολοκληρώθηκε η διόρθωση constraints!' as result;

