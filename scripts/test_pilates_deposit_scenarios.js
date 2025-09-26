// Pilates deposit scenarios (A–F) - ESM version
// Usage: node scripts/test_pilates_deposit_scenarios.js --env=staging

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

function logStep(title) {
  console.log(`\n===== ${title} =====`);
}

function getEnv() {
  const env = process.env;
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE || env.VITE_SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL (or VITE_SUPABASE_URL) or SERVICE key');
  }
  return { url, key };
}

async function findPilatesPackageId(supabase) {
  const { data, error } = await supabase
    .from('membership_packages')
    .select('id, name')
    .eq('name', 'Pilates')
    .single();
  if (error) throw error;
  return data.id;
}

async function approvePilatesRequestAndCreditDeposit(supabase, userId, durationType) {
  const packageId = await findPilatesPackageId(supabase);
  const { data: req, error: reqErr } = await supabase
    .from('membership_requests')
    .insert({ user_id: userId, package_id: packageId, duration_type: durationType, requested_price: 0, status: 'pending' })
    .select('*')
    .single();
  if (reqErr) throw reqErr;

  await supabase.from('membership_requests').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', req.id);

  const startDate = new Date().toISOString().split('T')[0];
  const durations = {
    pilates_trial: 1,
    pilates_1month: 30,
    pilates_2months: 60,
    pilates_3months: 90,
    pilates_6months: 180,
    pilates_1year: 365
  };
  const end = new Date();
  end.setDate(end.getDate() + (durations[durationType] || 30));
  const endDate = end.toISOString().split('T')[0];
  await supabase.from('memberships').insert({ user_id: userId, package_id: packageId, start_date: startDate, end_date: endDate, is_active: true, duration_type: durationType });

  const map = { pilates_trial: 1, pilates_1month: 4, pilates_2months: 8, pilates_3months: 16, pilates_6months: 25, pilates_1year: 50 };
  const deposit = map[durationType] || 0;
  if (deposit > 0) {
    const { error: depErr } = await supabase.from('pilates_deposits').insert({ user_id: userId, package_id: packageId, deposit_remaining: deposit, expires_at: end.toISOString(), is_active: true });
    if (depErr) throw depErr;
  }

  return { requestId: req.id, depositCredited: deposit };
}

async function bookWithTimeout(supabase, userId, slotId, timeoutMs = 5000) {
  return await Promise.race([
    supabase.rpc('book_pilates_class', { p_user_id: userId, p_slot_id: slotId }),
    new Promise((resolve) => setTimeout(() => resolve({ error: new Error('timeout') }), timeoutMs))
  ]);
}

async function ensureSlotExists(supabase) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const time = '18:00:00';
  const { data, error } = await supabase
    .from('pilates_schedule_slots')
    .select('*')
    .eq('date', dateStr)
    .eq('start_time', time)
    .single();
  if (data) return data.id;
  const { data: created, error: cErr } = await supabase
    .from('pilates_schedule_slots')
    .insert({ date: dateStr, start_time: time, end_time: '19:00:00', max_capacity: 4, is_active: true })
    .select('*')
    .single();
  if (cErr) throw cErr;
  return created.id;
}

async function ensureMultipleFutureSlots(supabase, count) {
  const ids = [];
  const base = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i + 1);
    const dateStr = d.toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('pilates_schedule_slots')
      .select('id')
      .eq('date', dateStr)
      .eq('start_time', '18:00:00')
      .single();
    if (data?.id) {
      ids.push(data.id);
      continue;
    }
    const { data: created, error: cErr } = await supabase
      .from('pilates_schedule_slots')
      .insert({ date: dateStr, start_time: '18:00:00', end_time: '19:00:00', max_capacity: 4, is_active: true })
      .select('id')
      .single();
    if (cErr) throw cErr;
    ids.push(created.id);
  }
  return ids;
}

async function scenarioRunner() {
  const { url, key } = getEnv();
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: anyUser } = await supabase.from('user_profiles').select('user_id').limit(1).single();
  const userId = anyUser?.user_id;
  if (!userId) throw new Error('No user found to run scenarios');

  await supabase.from('pilates_bookings').delete().eq('user_id', userId);
  await supabase.from('pilates_deposits').delete().eq('user_id', userId);

  const slotId = await ensureSlotExists(supabase);

  logStep('Scenario A: Approve 1-month package → deposit = 4');
  const a = await approvePilatesRequestAndCreditDeposit(supabase, userId, 'pilates_1month');
  console.log('Deposit credited:', a.depositCredited);
  const { data: depA } = await supabase.from('pilates_deposits').select('*').eq('user_id', userId).eq('is_active', true).single();
  console.log('DB deposit row:', depA);

  logStep('Scenario B: Book 1 class → deposit decremented to 3');
  const { data: rpcB, error: rpcErrB } = await supabase.rpc('book_pilates_class', { p_user_id: userId, p_slot_id: slotId });
  if (rpcErrB) throw rpcErrB;
  const { data: depB } = await supabase.from('pilates_deposits').select('deposit_remaining').eq('user_id', userId).eq('is_active', true).order('credited_at', { ascending: false }).limit(1);
  console.log('After booking deposit_remaining:', depB?.[0]?.deposit_remaining);

  logStep('Scenario C: Book until deposit = 0 then verify block');
  // Create enough future slots to consume remaining deposit
  const { data: depStart } = await supabase.from('pilates_deposits').select('deposit_remaining').eq('user_id', userId).eq('is_active', true).order('credited_at', { ascending: false }).limit(1);
  const startRemaining = depStart?.[0]?.deposit_remaining ?? 0;
  const moreSlotIds = await ensureMultipleFutureSlots(supabase, Math.max(0, Math.min(6, startRemaining - 1)));
  let i = 0; 
  for (const sid of moreSlotIds) {
    i++;
    console.log(`C) Booking ${i}/${moreSlotIds.length} at slot ${sid}...`);
    try {
      const { data: r, error } = await bookWithTimeout(supabase, userId, sid, 6000);
      if (error) {
        console.log('   → error:', error.message || error);
        continue;
      }
      const { data: depNow } = await supabase.from('pilates_deposits').select('deposit_remaining').eq('user_id', userId).eq('is_active', true).order('credited_at', { ascending: false }).limit(1);
      console.log('   → remaining:', depNow?.[0]?.deposit_remaining);
      if ((depNow?.[0]?.deposit_remaining ?? 0) <= 0) {
        console.log('   → deposit reached 0');
        break;
      }
    } catch (e) {
      console.log('   → exception:', e.message || e);
    }
  }
  const { error: shouldFail } = await supabase.rpc('book_pilates_class', { p_user_id: userId, p_slot_id: slotId });
  console.log('Booking with deposit=0 should fail:', !!shouldFail);

  logStep('Scenario D: Approve longer package and force expiry');
  await approvePilatesRequestAndCreditDeposit(supabase, userId, 'pilates_2months');
  await supabase.from('pilates_deposits').update({ expires_at: new Date(Date.now() - 3600_000).toISOString() }).eq('user_id', userId).eq('is_active', true);
  const { data: expiredCount } = await supabase.rpc('check_and_expire_pilates_deposits');
  console.log('Expired rows:', expiredCount);

  logStep('Scenario E: Fill class to capacity');
  const { data: slot } = await supabase.from('pilates_schedule_slots').select('max_capacity').eq('id', slotId).single();
  console.log('Slot capacity:', slot?.max_capacity);

  logStep('Scenario F: Concurrent booking attempts for last slot');
  const promises = Array.from({ length: 10 }).map(() => supabase.rpc('book_pilates_class', { p_user_id: userId, p_slot_id: slotId }));
  const results = await Promise.allSettled(promises);
  console.log('Concurrent results:', results.map(r => r.status));

  console.log('\nAll scenarios executed. Review logs above.');
}

scenarioRunner().catch(err => {
  console.error('Scenario runner error:', err);
  process.exit(1);
});


