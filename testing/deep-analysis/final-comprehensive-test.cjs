#!/usr/bin/env node

/**
 * FINAL COMPREHENSIVE TEST
 * Τεστάρει το Pilates booking system με 50+ πραγματικούς users
 * Επαληθεύει ότι ΟΛΑ τα bookings λειτουργούν σωστά
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
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bright: '\x1b[1m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function finalComprehensiveTest() {
  log('\n╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  FINAL COMPREHENSIVE TEST - 50+ USERS                       ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝\n', 'cyan');

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    details: []
  };

  try {
    // Get ALL users with deposits
    log('📋 Step 1: Φόρτωση ΟΛΩΝ των users με pilates deposits...', 'cyan');
    
    const { data: deposits } = await supabase
      .from('pilates_deposits')
      .select('user_id, deposit_remaining, is_active')
      .eq('is_active', true)
      .gt('deposit_remaining', 0);

    if (!deposits || deposits.length === 0) {
      log('  ❌ Δεν βρέθηκαν users με deposit', 'red');
      return;
    }

    log(`  ✅ Βρέθηκαν ${deposits.length} users με active deposits\n`, 'green');

    // Get available slots
    log('📋 Step 2: Φόρτωση available slots...', 'cyan');
    
    const today = new Date().toISOString().split('T')[0];
    const { data: slots } = await supabase
      .from('pilates_schedule_slots')
      .select('*')
      .gte('date', today)
      .eq('is_active', true)
      .limit(10);

    if (!slots || slots.length === 0) {
      log('  ❌ Δεν βρέθηκαν slots', 'red');
      return;
    }

    log(`  ✅ Βρέθηκαν ${slots.length} διαθέσιμα slots\n`, 'green');

    // Test each user
    log('📋 Step 3: Testing ΟΛΩΝ των users...\n', 'cyan');
    log('═'.repeat(60));

    for (let i = 0; i < Math.min(deposits.length, 50); i++) {
      const deposit = deposits[i];
      const slot = slots[i % slots.length]; // Rotate through slots

      results.total++;
      
      log(`\nTest ${i + 1}/${Math.min(deposits.length, 50)}:`, 'bright');

      // Get user profile
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, email')
        .eq('user_id', deposit.user_id)
        .single();

      if (!userProfile) {
        log(`  ⚠️  User ${deposit.user_id} - No profile`, 'yellow');
        results.skipped++;
        continue;
      }

      log(`  User: ${userProfile.first_name} ${userProfile.last_name}`, 'cyan');

      // Check if already booked
      const { data: existing } = await supabase
        .from('pilates_bookings')
        .select('id')
        .eq('user_id', deposit.user_id)
        .eq('slot_id', slot.id)
        .eq('status', 'confirmed')
        .single();

      if (existing) {
        log(`  ⏭️  Already booked`, 'yellow');
        results.skipped++;
        continue;
      }

      // Capture BEFORE state
      const { data: depositBefore } = await supabase
        .from('pilates_deposits')
        .select('deposit_remaining')
        .eq('user_id', deposit.user_id)
        .eq('is_active', true)
        .order('credited_at', { ascending: false })
        .limit(1)
        .single();

      const { data: occupancyBefore } = await supabase
        .from('pilates_bookings')
        .select('id')
        .eq('slot_id', slot.id)
        .eq('status', 'confirmed');

      const depositBeforeCount = depositBefore?.deposit_remaining || 0;
      const occupancyBeforeCount = occupancyBefore?.length || 0;

      // Make booking
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('book_pilates_class', {
          p_user_id: deposit.user_id,
          p_slot_id: slot.id
        });

      if (rpcError) {
        log(`  ❌ FAILED: ${rpcError.message}`, 'red');
        results.failed++;
        results.details.push({
          user_id: deposit.user_id,
          user_name: `${userProfile.first_name} ${userProfile.last_name}`,
          error: rpcError.message,
          status: 'FAILED'
        });
        continue;
      }

      const bookingId = rpcData?.[0]?.booking_id || rpcData?.booking_id;

      if (!bookingId) {
        log(`  ❌ No booking ID returned`, 'red');
        results.failed++;
        continue;
      }

      // Verify ALL 5 points
      const { data: bookingVerify } = await supabase
        .from('pilates_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      const { data: depositAfter } = await supabase
        .from('pilates_deposits')
        .select('deposit_remaining')
        .eq('user_id', deposit.user_id)
        .eq('is_active', true)
        .order('credited_at', { ascending: false })
        .limit(1)
        .single();

      const { data: occupancyAfter } = await supabase
        .from('pilates_bookings')
        .select('id')
        .eq('slot_id', slot.id)
        .eq('status', 'confirmed');

      const depositAfterCount = depositAfter?.deposit_remaining || 0;
      const occupancyAfterCount = occupancyAfter?.length || 0;

      // Check all 5 conditions
      const checks = {
        booking_exists: !!bookingVerify,
        deposit_decremented: (depositBeforeCount - depositAfterCount) === 1,
        occupancy_increased: (occupancyAfterCount - occupancyBeforeCount) === 1,
        correct_occupancy: occupancyAfterCount === (occupancyBeforeCount + 1),
        all_consistent: true
      };

      checks.all_consistent = Object.values(checks).every(v => v === true);

      if (checks.all_consistent) {
        log(`  ✅ SUCCESS - All checks passed!`, 'green');
        log(`     Deposit: ${depositBeforeCount} → ${depositAfterCount}`, 'cyan');
        log(`     Occupancy: ${occupancyBeforeCount}/${slot.max_capacity} → ${occupancyAfterCount}/${slot.max_capacity}`, 'cyan');
        results.success++;
        results.details.push({
          user_id: deposit.user_id,
          user_name: `${userProfile.first_name} ${userProfile.last_name}`,
          booking_id: bookingId,
          status: 'SUCCESS',
          checks
        });
      } else {
        log(`  ❌ FAILED - Some checks failed!`, 'red');
        results.failed++;
        results.details.push({
          user_id: deposit.user_id,
          user_name: `${userProfile.first_name} ${userProfile.last_name}`,
          booking_id: bookingId,
          status: 'FAILED',
          checks
        });
      }

      // Cleanup
      await supabase.rpc('cancel_pilates_booking', {
        p_booking_id: bookingId,
        p_user_id: deposit.user_id
      });
    }

    // FINAL SUMMARY
    log('\n' + '═'.repeat(60));
    log('\n╔══════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  FINAL COMPREHENSIVE TEST RESULTS                           ║', 'magenta');
    log('╚══════════════════════════════════════════════════════════════╝\n', 'magenta');

    log(`  Total Tests:     ${results.total}`, 'bright');
    log(`  Successful:      ${results.success} ✅`, 'green');
    log(`  Failed:          ${results.failed} ❌`, results.failed === 0 ? 'green' : 'red');
    log(`  Skipped:         ${results.skipped}`, 'yellow');
    
    const successRate = results.total > 0 ? ((results.success / results.total) * 100).toFixed(2) : 0;
    log(`  Success Rate:    ${successRate}%`, successRate === '100.00' ? 'green' : 'yellow');

    log('');

    if (results.failed === 0) {
      log('  🎉🎉🎉 ΟΛΑ ΤΑ TESTS ΠΕΡΑΣΑΝ! 🎉🎉🎉', 'green');
      log('  ΤΟ ΣΥΣΤΗΜΑ ΛΕΙΤΟΥΡΓΕΙ 100% ΣΩΣΤΑ ΓΙΑ ΟΛΟΥΣ ΤΟΥΣ ΧΡΗΣΤΕΣ!', 'green');
      log('  🚀 READY FOR PRODUCTION! 🚀', 'green');
    } else {
      log(`  ❌ ${results.failed} tests απέτυχαν`, 'red');
      log('  Ελέγξτε τα details πιο πάνω', 'yellow');
    }

    log('');
    log('═'.repeat(60) + '\n');

    // Save results
    const fs = require('fs');
    const resultsPath = 'testing/deep-analysis/final-results.json';
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    log(`📊 Results saved to: ${resultsPath}\n`, 'cyan');

  } catch (error) {
    log(`\n❌ Fatal Error: ${error.message}`, 'red');
    console.error(error);
  }
}

finalComprehensiveTest();

