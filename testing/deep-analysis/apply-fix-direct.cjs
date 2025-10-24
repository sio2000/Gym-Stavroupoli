// Direct SQL execution via Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function applyFixDirect() {
  console.log('\n🔧 Εφαρμόζω το critical fix απευθείας στη βάση...\n');

  const sqlFix = `
CREATE OR REPLACE FUNCTION public.book_pilates_class(p_user_id uuid, p_slot_id uuid)
RETURNS TABLE (booking_id uuid, deposit_remaining integer) AS $$
DECLARE
  v_deposit public.pilates_deposits;
  v_capacity integer;
  v_booked integer;
  v_existing uuid;
  v_updated_deposit integer;
BEGIN
  SELECT id INTO v_existing FROM public.pilates_bookings 
  WHERE user_id = p_user_id AND slot_id = p_slot_id AND status = 'confirmed';
  IF v_existing IS NOT NULL THEN
    SELECT * INTO v_deposit FROM public.get_active_pilates_deposit(p_user_id);
    RETURN QUERY SELECT v_existing, COALESCE(v_deposit.deposit_remaining, 0);
    RETURN;
  END IF;

  SELECT max_capacity INTO v_capacity FROM public.pilates_schedule_slots WHERE id = p_slot_id AND is_active = true;
  IF v_capacity IS NULL THEN
    RAISE EXCEPTION 'Slot not available';
  END IF;
  SELECT COUNT(*) INTO v_booked FROM public.pilates_bookings WHERE slot_id = p_slot_id AND status = 'confirmed';
  IF v_booked >= v_capacity THEN
    RAISE EXCEPTION 'Slot full';
  END IF;

  SELECT * INTO v_deposit FROM public.get_active_pilates_deposit(p_user_id);
  IF v_deposit.id IS NULL OR v_deposit.is_active = false OR v_deposit.deposit_remaining <= 0 THEN
    RAISE EXCEPTION 'No active deposit';
  END IF;

  PERFORM 1 FROM public.pilates_deposits WHERE id = v_deposit.id FOR UPDATE;

  SELECT pd.deposit_remaining INTO v_updated_deposit 
  FROM public.pilates_deposits pd 
  WHERE pd.id = v_deposit.id;
  
  IF v_updated_deposit <= 0 THEN
    RAISE EXCEPTION 'Deposit empty';
  END IF;

  UPDATE public.pilates_deposits AS pd
    SET deposit_remaining = pd.deposit_remaining - 1,
        updated_at = now(),
        is_active = CASE WHEN pd.deposit_remaining - 1 <= 0 THEN false ELSE pd.is_active END
    WHERE pd.id = v_deposit.id;

  INSERT INTO public.pilates_bookings (user_id, slot_id, status)
  VALUES (p_user_id, p_slot_id, 'confirmed')
  ON CONFLICT (user_id, slot_id) DO NOTHING
  RETURNING id INTO v_existing;

  IF v_existing IS NULL THEN
    UPDATE public.pilates_deposits AS pd
      SET deposit_remaining = pd.deposit_remaining + 1,
          is_active = true,
          updated_at = now()
      WHERE pd.id = v_deposit.id;
    SELECT * INTO v_deposit FROM public.get_active_pilates_deposit(p_user_id);
    RETURN QUERY SELECT 
      (SELECT id FROM public.pilates_bookings WHERE user_id=p_user_id AND slot_id=p_slot_id AND status='confirmed' LIMIT 1), 
      COALESCE(v_deposit.deposit_remaining, 0);
    RETURN;
  END IF;

  SELECT pd.deposit_remaining INTO v_updated_deposit 
  FROM public.pilates_deposits pd 
  WHERE pd.id = v_deposit.id;
  
  RETURN QUERY SELECT v_existing, v_updated_deposit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  console.log('Executing SQL...');
  
  // Supabase doesn't support direct SQL execution from JS client
  // We need to use the Supabase REST API or Dashboard
  
  console.log('⚠️  Supabase-js δεν υποστηρίζει direct DDL execution');
  console.log('');
  console.log('🔧 MANUAL STEPS (2 minutes):');
  console.log('');
  console.log('1. Άνοιξε: https://supabase.com/dashboard/project/nolqodpfaqdnprixaqlo/sql/new');
  console.log('');
  console.log('2. Αντίγραψε και επικόλλησε αυτό το SQL:\n');
  console.log('─'.repeat(60));
  console.log(sqlFix);
  console.log('─'.repeat(60));
  console.log('');
  console.log('3. Πάτα "Run" στο Supabase Dashboard');
  console.log('');
  console.log('4. Μετά τρέξε: node test-exact-bug.cjs');
  console.log('');
  console.log('═'.repeat(60));
  console.log('\n✅ Αυτό θα διορθώσει το ambiguous column error!');
  console.log('✅ Μετά το fix, ΟΛΑ τα bookings θα δουλεύουν!\n');
}

applyFixDirect();

