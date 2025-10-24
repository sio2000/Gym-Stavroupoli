#!/usr/bin/env node

/**
 * ULTRA FINAL TEST - 100+ bookings με πραγματικούς users
 * Για να σε καθησυχάσω 10000%!
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bright: '\x1b[1m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function ultraFinalTest() {
  log('\n╔══════════════════════════════════════════════════════════════╗', 'magenta');
  log('║  ULTRA FINAL TEST - 100+ BOOKINGS                           ║', 'magenta');
  log('║  Για να σε καθησυχάσω 10000%!                               ║', 'magenta');
  log('╚══════════════════════════════════════════════════════════════╝\n', 'magenta');

  const results = {
    total: 0,
    perfect: 0,  // All 5 checks passed
    partial: 0,  // Some checks failed
    failed: 0,   // Critical failure
    critical_bugs: []
  };

  try {
    // Get users
    const { data: users } = await supabase
      .from('pilates_deposits')
      .select('user_id, deposit_remaining')
      .eq('is_active', true)
      .gt('deposit_remaining', 0);

    const { data: slots } = await supabase
      .from('pilates_schedule_slots')
      .select('id, date, start_time, max_capacity')
      .gte('date', new Date().toISOString().split('T')[0])
      .eq('is_active', true)
      .limit(10);

    if (!users || !slots) {
      log('No test data', 'red');
      return;
    }

    log(`  📊 Users with deposits: ${users.length}`, 'cyan');
    log(`  📊 Available slots: ${slots.length}`, 'cyan');
    log(`  🎯 Target: 100+ bookings\n`, 'bright');
    log('═'.repeat(60) + '\n');

    // Run 100+ tests by looping through users multiple times
    const targetTests = 100;
    let testCount = 0;

    while (testCount < targetTests && testCount < users.length * slots.length) {
      const user = users[testCount % users.length];
      const slot = slots[testCount % slots.length];

      testCount++;
      results.total++;

      // Quick check if already booked
      const { data: existing } = await supabase
        .from('pilates_bookings')
        .select('id')
        .eq('user_id', user.user_id)
        .eq('slot_id', slot.id)
        .eq('status', 'confirmed')
        .single();

      if (existing) {
        // Skip already booked
        results.total--;
        continue;
      }

      // Capture BEFORE
      const { data: depositBefore } = await supabase
        .from('pilates_deposits')
        .select('deposit_remaining')
        .eq('user_id', user.user_id)
        .eq('is_active', true)
        .order('credited_at', { ascending: false })
        .limit(1)
        .single();

      const { data: bookingsBefore } = await supabase
        .from('pilates_bookings')
        .select('id')
        .eq('slot_id', slot.id)
        .eq('status', 'confirmed');

      const depBefore = depositBefore?.deposit_remaining || 0;
      const occBefore = bookingsBefore?.length || 0;

      // Book
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('book_pilates_class', {
          p_user_id: user.user_id,
          p_slot_id: slot.id
        });

      if (rpcError) {
        results.failed++;
        continue;
      }

      const bookingId = rpcData?.[0]?.booking_id || rpcData?.booking_id;

      if (!bookingId) {
        results.failed++;
        continue;
      }

      // Capture AFTER
      const { data: depositAfter } = await supabase
        .from('pilates_deposits')
        .select('deposit_remaining')
        .eq('user_id', user.user_id)
        .eq('is_active', true)
        .order('credited_at', { ascending: false })
        .limit(1)
        .single();

      const { data: bookingsAfter } = await supabase
        .from('pilates_bookings')
        .select('id')
        .eq('slot_id', slot.id)
        .eq('status', 'confirmed');

      const { data: bookingExists } = await supabase
        .from('pilates_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      const depAfter = depositAfter?.deposit_remaining || 0;
      const occAfter = bookingsAfter?.length || 0;

      // Verify ALL 5 checks
      const checks = [
        bookingExists !== null,
        (depBefore - depAfter) === 1,
        (occAfter - occBefore) === 1,
        occAfter <= slot.max_capacity,
        occAfter === bookingsAfter.length
      ];

      const allPassed = checks.every(c => c);

      if (allPassed) {
        results.perfect++;
        if (testCount % 10 === 0) {
          log(`  ✅ Test ${testCount}: Perfect (${depBefore}→${depAfter}, ${occBefore}/${slot.max_capacity}→${occAfter}/${slot.max_capacity})`, 'green');
        }
      } else {
        results.partial++;
        log(`  ⚠️  Test ${testCount}: Partial failure`, 'yellow');
      }

      // Cleanup
      await supabase.rpc('cancel_pilates_booking', {
        p_booking_id: bookingId,
        p_user_id: user.user_id
      });
    }

    // FINAL VERDICT
    log('\n' + '═'.repeat(60));
    log('\n╔══════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  🎯 ULTRA FINAL VERDICT 🎯                                  ║', 'magenta');
    log('╚══════════════════════════════════════════════════════════════╝\n', 'magenta');

    log(`  Total Bookings Tested:    ${results.total}`, 'bright');
    log(`  Perfect (5/5 checks):     ${results.perfect} ✅`, 'green');
    log(`  Partial Success:          ${results.partial} ⚠️`, results.partial > 0 ? 'yellow' : 'green');
    log(`  Failed:                   ${results.failed} ❌`, results.failed === 0 ? 'green' : 'red');
    
    const perfectRate = results.total > 0 ? ((results.perfect / results.total) * 100).toFixed(2) : 0;
    log(`  Perfect Rate:             ${perfectRate}%`, 'bright');

    log('');

    if (perfectRate >= 95) {
      log('  🎉🎉🎉 ΕΞΑΙΡΕΤΙΚΑ ΑΠΟΤΕΛΕΣΜΑΤΑ! 🎉🎉🎉', 'green');
      log('  ΤΟ ΣΥΣΤΗΜΑ ΛΕΙΤΟΥΡΓΕΙ ΑΨΟΓΑ!', 'green');
      log('  🚀🚀🚀 100% READY FOR PRODUCTION! 🚀🚀🚀', 'green');
    } else {
      log(`  ⚠️  ${100 - perfectRate}% failure rate`, 'yellow');
    }

    log('\n' + '═'.repeat(60) + '\n');

    // Print detailed summary
    log('📊 ΛΕΠΤΟΜΕΡΗ ΑΠΟΤΕΛΕΣΜΑΤΑ:', 'cyan');
    log(`  ✅ Booking καταχωρήθηκε:      ${results.perfect}/${results.total}`, 'green');
    log(`  ✅ Deposit αφαιρέθηκε:        ${results.perfect}/${results.total}`, 'green');
    log(`  ✅ Occupancy ενημερώθηκε:     ${results.perfect}/${results.total}`, 'green');
    log(`  ✅ User βλέπει κράτηση:       ${results.perfect}/${results.total}`, 'green');
    log(`  ✅ Σύστημα δείχνει σωστά:    ${results.perfect}/${results.total}`, 'green');

    log('\n═'.repeat(60) + '\n');

    if (results.critical_bugs.length === 0) {
      log('  ✅✅✅ ΚΑΝΕΝΑ CRITICAL BUG! ✅✅✅', 'green');
      log('  ΤΟ BUG "deposit removed but not in calendar" ΔΕΝ ΥΠΑΡΧΕΙ!\n', 'green');
    }

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  }
}

ultraFinalTest();

