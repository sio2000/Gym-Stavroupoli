#!/usr/bin/env node
/*
  Script: create-1000-real-scenarios.cjs
  Purpose: Create 1000 real subscription scenarios across 30 confirmed bot accounts.
  - Uses Supabase service role key to insert directly into `memberships`.
  - Respects PILATES rule: no calendar bookings are created for pilates packages.
  - Produces artifact JSON with created/failed counts and sample entries.

  Run:
    node scripts\create-1000-real-scenarios.cjs
*/

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const workspaceRoot = process.cwd();
const credsPath = path.join(workspaceRoot, '.testbots_credentials.json');
if (!fs.existsSync(credsPath)) {
  console.error('Missing .testbots_credentials.json in workspace root');
  process.exit(1);
}
const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
const testBots = creds.bots || [];
if (testBots.length < 1) {
  console.error('No bots found in .testbots_credentials.json');
  process.exit(1);
}

const SUPABASE_URL = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const logsDir = path.join(workspaceRoot, 'artifacts', '1000-real-scenarios');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// Package UUID map discovered earlier
const PACKAGE_MAP = {
  pilates: 'c16de111-3687-41ce-a446-5af61a3c6eff',
  packA:  'feefb0d8-edc5-4eb1-befa-0b69a43ca75d',
  packB:  '728cc455-f122-4aca-8319-5cb0f44ec590',
  ultimate: '95bdb862-6cb4-4f57-a20e-3c6422f055dd',
  special: 'd0fc85f2-73d6-4a75-ae56-36c756030ddd'
};

// Duration types observed in DB
const DURATION_TYPES = [
  'pilates_trial','pilates_1month','pilates_2months','pilates_6months','pilates_1year',
  'month','3 Μήνες','year','ultimate_1year','lesson'
];

function isoDateDaysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0,0,0,0);
  return d.toISOString().split('T')[0];
}

function pickRandom(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

async function createBatch(batch) {
  // Insert batch into memberships, return array of {success, error, row}
  try {
    const { data, error } = await supabase
      .from('memberships')
      .insert(batch)
      .select();

    if (error) {
      // On batch failure, return individual errors
      return { success: false, error: error.message, data: null };
    }
    return { success: true, data };
  } catch (ex) {
    return { success: false, error: ex.message };
  }
}

(async function main() {
  console.log('\n=== Creating 1000 real subscription scenarios ===\n');
  const target = 1000;
  const createdEntries = [];
  const failedEntries = [];

  let attempts = 0;
  const maxAttempts = target * 2; // safety

  // We'll create subscriptions in small batches to avoid throttling
  const BATCH_SIZE = 10;

  while (createdEntries.length < target && attempts < maxAttempts) {
    const batch = [];
    for (let i = 0; i < BATCH_SIZE && createdEntries.length + batch.length < target; i++) {
      // pick a bot randomly among the 30
      const bot = pickRandom(testBots);

      // Choose whether this is a pilates scenario (weight to ensure many pilates tests)
      const isPilates = Math.random() < 0.35; // 35% pilates
      const package_id = isPilates ? PACKAGE_MAP.pilates : pickRandom([PACKAGE_MAP.packA, PACKAGE_MAP.packB, PACKAGE_MAP.ultimate, PACKAGE_MAP.special]);

      // Duration types -- pick appropriate pilates duration if pilates
      let durationType = isPilates ? pickRandom(['pilates_trial','pilates_1month','pilates_2months','pilates_6months','pilates_1year']) : pickRandom(['month','3 Μήνες','year','ultimate_1year','lesson']);

      // random start date in past/future to simulate expirations and upcoming
      const offsetDays = Math.floor(Math.random() * 120) - 60; // -60..+59
      const startDate = isoDateDaysFromNow(offsetDays);

      // duration days mapping
      const durationDaysMap = {
        'pilates_trial': 7,
        'pilates_1month': 30,
        'pilates_2months': 60,
        'pilates_6months': 180,
        'pilates_1year': 365,
        'month': 30,
        '3 Μήνες': 90,
        'year': 365,
        'ultimate_1year': 365,
        'lesson': 30
      };

      const durDays = durationDaysMap[durationType] || 30;
      const endDate = isoDateDaysFromNow(offsetDays + durDays);

      // status: active, cancelled, expired
      const statusRoll = Math.random();
      let status = 'active';
      if (statusRoll < 0.08) status = 'cancelled';
      else if (statusRoll < 0.20) status = 'expired';

      const row = {
        user_id: bot.userId,
        package_id: package_id,
        start_date: startDate,
        end_date: endDate,
        status: status,
        is_active: status === 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        duration_type: durationType,
        source_package_name: isPilates ? 'PILATES' : null,
        auto_renew: Math.random() < 0.12,
        // ensure no calendar booking creation here for pilates (business rule)
        source_request_id: null
      };

      batch.push(row);
    }

    attempts++;
    const res = await createBatch(batch);
    if (res.success && Array.isArray(res.data)) {
      for (const r of res.data) {
        createdEntries.push(r);
      }
      process.stdout.write(`\rCreated so far: ${createdEntries.length}/${target}`);
    } else {
      // log failed batch
      failedEntries.push({ batchError: res.error, batch });
      process.stdout.write(`\rCreated so far: ${createdEntries.length}/${target} (failed batches: ${failedEntries.length})`);
      // small delay on error
      await new Promise(r => setTimeout(r, 300));
    }

    // small throttle delay per batch
    await new Promise(r => setTimeout(r, 80));
  }

  console.log('\n\n=== Finished run ===');
  console.log(`Total created: ${createdEntries.length}`);
  console.log(`Failed batches: ${failedEntries.length}`);

  const out = {
    timestamp: new Date().toISOString(),
    target,
    created: createdEntries.length,
    failedBatches: failedEntries.length,
    sampleCreated: createdEntries.slice(0, 20),
    failedDetails: failedEntries.slice(0, 10)
  };

  const outFile = path.join(logsDir, `create-1000-scenarios-result-${Date.now()}.json`);
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
  console.log(`Results written to: ${outFile}`);

  if (createdEntries.length >= target) {
    console.log('\n✅ SUCCESS: Created requested scenarios');
    process.exit(0);
  } else {
    console.log('\n⚠️  Completed but did not reach target creations');
    process.exit(2);
  }
})();
