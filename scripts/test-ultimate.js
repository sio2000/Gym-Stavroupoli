const { createClient } = require('@supabase/supabase-js');

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE envs');
  process.exit(1);
}

const supa = createClient(url, serviceKey);

const todayKey = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

function computeWeekWindow() {
  const today = new Date();
  const day = today.getDay();
  let weekStart;
  if (day === 0) {
    weekStart = new Date(today);
    weekStart.setDate(today.getDate() + 1);
  } else {
    weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (day - 1));
  }
  weekStart.setHours(0,0,0,0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 5);
  weekEnd.setHours(23,59,59,999);
  return { weekStart, weekEnd };
}

async function runScenario(label, packageName, price) {
  console.log(`\n=== Scenario: ${label} (${packageName}) ===`);
  const email = `bot+${label.toLowerCase()}_${Date.now()}@example.com`;
  const password = 'Test1234!';

  const { data: created, error: createErr } = await supa.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: 'Bot', last_name: label }
  });
  if (createErr || !created?.user) throw createErr || new Error('No user');
  const userId = created.user.id;
  console.log('User created:', email, userId);

  await supa.from('user_profiles').upsert({ user_id: userId, first_name: 'Bot', last_name: label, email });

  const { data: pkgRow, error: pkgErr } = await supa
    .from('membership_packages')
    .select('id')
    .eq('name', packageName)
    .single();
  if (pkgErr || !pkgRow) throw pkgErr || new Error('pkg missing');
  const packageId = pkgRow.id;

  const durationType = packageName === 'Ultimate' ? 'ultimate_1year' : 'ultimate_medium_1year';

  const { data: req, error: reqErr } = await supa
    .from('membership_requests')
    .insert({
      user_id: userId,
      package_id: packageId,
      duration_type: durationType,
      requested_price: price,
      status: 'pending'
    })
    .select('id')
    .single();
  if (reqErr || !req) throw reqErr || new Error('request insert failed');
  const requestId = req.id;
  console.log('Request created:', requestId);

  const startDate = todayKey();
  const { data: dual, error: dualErr } = await supa.rpc('create_ultimate_dual_memberships', {
    p_user_id: userId,
    p_ultimate_request_id: requestId,
    p_duration_days: 365,
    p_start_date: startDate
  });
  if (dualErr) throw dualErr;
  console.log('Dual RPC result:', dual);

  await supa
    .from('membership_requests')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', requestId);

  const endDate = dual?.end_date || (() => { const d = new Date(startDate); d.setDate(d.getDate()+365); return d.toISOString().split('T')[0];})();

  if (dual?.pilates_membership_id) {
    await supa
      .from('memberships')
      .update({ start_date: startDate, end_date: endDate, duration_type })
      .eq('id', dual.pilates_membership_id);
  }
  if (dual?.free_gym_membership_id) {
    await supa
      .from('memberships')
      .update({ start_date: startDate, end_date: endDate, duration_type })
      .eq('id', dual.free_gym_membership_id);
  }

  const { weekEnd } = computeWeekWindow();
  const nextRefillDate = weekEnd.toISOString().split('T')[0];
  await supa.from('ultimate_weekly_refills').delete().eq('user_id', userId);
  await supa.from('ultimate_weekly_refills').insert({
    user_id: userId,
    membership_id: dual?.pilates_membership_id || dual?.free_gym_membership_id,
    source_request_id: requestId,
    package_name: packageName,
    activation_date: startDate,
    refill_date: nextRefillDate,
    refill_week_number: 1,
    target_deposit_amount: packageName === 'Ultimate' ? 3 : 1,
    previous_deposit_amount: 0,
    new_deposit_amount: packageName === 'Ultimate' ? 3 : 1
  });

  const { data: memberships } = await supa
    .from('memberships')
    .select('id, package_id, start_date, end_date, duration_type, is_active, status, membership_packages(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const { data: refill } = await supa
    .from('ultimate_weekly_refills')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  console.log('Memberships:', memberships);
  console.log('Weekly refill latest:', refill);

  return { email, userId, memberships, refill };
}

(async () => {
  try {
    const scenarios = [
      { label: 'UltimateA', packageName: 'Ultimate', price: 500 },
      { label: 'UltimateB', packageName: 'Ultimate', price: 500 },
      { label: 'UltMedium', packageName: 'Ultimate Medium', price: 400 }
    ];
    for (const s of scenarios) {
      await runScenario(s.label, s.packageName, s.price);
    }
    console.log('\nAll scenarios completed');
  } catch (e) {
    console.error('Test failed:', e);
    process.exit(1);
  }
})();
