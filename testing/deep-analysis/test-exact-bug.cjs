#!/usr/bin/env node

/**
 * DEEP ANALYSIS - Test Exact Bug Pattern
 * Reproduces the EXACT issue: "Deposit removed but booking NOT in system"
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
  magenta: '\x1b[35m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function deepAnalysis() {
  log('\n╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  ΒΑΘΙΑ ΑΝΑΛΥΣΗ - EXACT BUG PATTERN TEST                     ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝\n', 'cyan');

  try {
    // STEP 1: Get a real user with deposit
    log('📋 STEP 1: Επιλογή πραγματικού χρήστη με deposit...', 'cyan');
    
    const { data: deposits, error: depositsError } = await supabase
      .from('pilates_deposits')
      .select('id, user_id, deposit_remaining')
      .eq('is_active', true)
      .gt('deposit_remaining', 0)
      .limit(5);

    if (depositsError || !deposits || deposits.length === 0) {
      log('  ❌ Δεν βρέθηκαν deposits', 'red');
      return;
    }

    // Get user profile separately
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', deposits[0].user_id)
      .single();

    const testUser = {
      deposit_id: deposits[0].id,
      user_id: deposits[0].user_id,
      deposit_remaining: deposits[0].deposit_remaining,
      user_profiles: userProfile || { first_name: 'N/A', last_name: 'N/A', email: 'N/A' }
    };

    log(`  ✅ Χρήστης: ${testUser.user_profiles.first_name} ${testUser.user_profiles.last_name}`, 'green');
    log(`     User ID: ${testUser.user_id}`, 'cyan');
    log(`     Email: ${testUser.user_profiles.email}`, 'cyan');
    log(`     Deposit: ${testUser.deposit_remaining} μαθήματα\n`, 'cyan');

    // STEP 2: Get an available slot
    log('📋 STEP 2: Εύρεση διαθέσιμου slot...', 'cyan');
    
    const today = new Date().toISOString().split('T')[0];
    const { data: slots, error: slotsError } = await supabase
      .from('pilates_schedule_slots')
      .select('*')
      .gte('date', today)
      .eq('is_active', true)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(5);

    if (slotsError || !slots || slots.length === 0) {
      log('  ❌ Δεν βρέθηκαν διαθέσιμα slots', 'red');
      return;
    }

    // Find slot not booked by this user
    let testSlot = null;
    for (const slot of slots) {
      const { data: existing } = await supabase
        .from('pilates_bookings')
        .select('id')
        .eq('user_id', testUser.user_id)
        .eq('slot_id', slot.id)
        .eq('status', 'confirmed')
        .single();
      
      if (!existing) {
        testSlot = slot;
        break;
      }
    }

    if (!testSlot) {
      log('  ⚠️  Όλα τα slots είναι ήδη booked από αυτόν τον user', 'yellow');
      return;
    }

    log(`  ✅ Slot: ${testSlot.date} ${testSlot.start_time}-${testSlot.end_time}`, 'green');
    log(`     Slot ID: ${testSlot.id}`, 'cyan');
    log(`     Capacity: ${testSlot.max_capacity}\n`, 'cyan');

    // STEP 3: Check BEFORE state
    log('📋 STEP 3: Έλεγχος κατάστασης ΠΡΙΝ την κράτηση...', 'cyan');
    
    const beforeState = await captureState(testUser.user_id, testSlot.id);
    
    log(`  📊 Deposit ΠΡΙΝ: ${beforeState.deposit}`, 'cyan');
    log(`  📊 Bookings ΠΡΙΝ: ${beforeState.bookings_count}`, 'cyan');
    log(`  📊 Slot Occupancy ΠΡΙΝ: ${beforeState.slot_occupancy}/${testSlot.max_capacity}`, 'cyan');
    log('');

    // STEP 4: Make the booking (THE CRITICAL TEST)
    log('📋 STEP 4: 🎯 ΚΡΙΣΙΜΟ TEST - Κάνω κράτηση...', 'magenta');
    log('  (Αυτό είναι το σημείο που έκανε fail για τους μισούς χρήστες!)', 'yellow');
    
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('book_pilates_class', {
        p_user_id: testUser.user_id,
        p_slot_id: testSlot.id
      });

    if (rpcError) {
      log(`  ❌ RPC FAILED: ${rpcError.message}`, 'red');
      log('  ⚠️⚠️⚠️ ΑΥΤΟ ΕΙΝΑΙ ΤΟ BUG! ⚠️⚠️⚠️', 'red');
      return;
    }

    const bookingId = rpcData?.[0]?.booking_id || rpcData?.booking_id;
    const depositAfterRPC = rpcData?.[0]?.deposit_remaining || rpcData?.deposit_remaining;

    log(`  ✅ RPC SUCCESS`, 'green');
    log(`     Booking ID: ${bookingId}`, 'cyan');
    log(`     Deposit μετά RPC: ${depositAfterRPC}\n`, 'cyan');

    // STEP 5: CRITICAL VERIFICATION - Check ALL 5 points
    log('📋 STEP 5: 🔍 ΚΡΙΣΙΜΟΣ ΕΛΕΓΧΟΣ - Επαλήθευση όλων των σημείων...', 'magenta');
    
    const afterState = await captureState(testUser.user_id, testSlot.id);

    // Verification 1: Booking exists in DB
    log('\n  ✓ ΕΛΕΓΧΟΣ 1: Υπάρχει η κράτηση στον πίνακα pilates_bookings?', 'yellow');
    const { data: bookingCheck, error: bookingError } = await supabase
      .from('pilates_bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', testUser.user_id)
      .eq('slot_id', testSlot.id)
      .eq('status', 'confirmed')
      .single();

    if (bookingError || !bookingCheck) {
      log('    ❌ ΟΧΙ! Η κράτηση ΔΕΝ υπάρχει στη βάση!', 'red');
      log('    🚨🚨🚨 ΑΥΤΟ ΕΙΝΑΙ ΤΟ BUG! 🚨🚨🚨', 'red');
    } else {
      log('    ✅ ΝΑΙ! Η κράτηση υπάρχει στη βάση', 'green');
      log(`       Booking ID: ${bookingCheck.id}`, 'cyan');
      log(`       Status: ${bookingCheck.status}`, 'cyan');
      log(`       Created: ${bookingCheck.created_at}`, 'cyan');
    }

    // Verification 2: Deposit was decremented
    log('\n  ✓ ΕΛΕΓΧΟΣ 2: Αφαιρέθηκε το deposit?', 'yellow');
    log(`    Deposit ΠΡΙΝ:  ${beforeState.deposit}`, 'cyan');
    log(`    Deposit ΜΕΤΑ:  ${afterState.deposit}`, 'cyan');
    log(`    Διαφορά:       ${beforeState.deposit - afterState.deposit}`, 'cyan');
    
    if (beforeState.deposit - afterState.deposit === 1) {
      log('    ✅ ΝΑΙ! Το deposit αφαιρέθηκε σωστά (-1)', 'green');
    } else {
      log('    ❌ ΟΧΙ! Το deposit δεν αφαιρέθηκε σωστά!', 'red');
    }

    // Verification 3: Slot occupancy updated (0/4 → 1/4)
    log('\n  ✓ ΕΛΕΓΧΟΣ 3: Ενημερώθηκε το slot occupancy? (0/4 → 1/4)', 'yellow');
    log(`    Occupancy ΠΡΙΝ: ${beforeState.slot_occupancy}/${testSlot.max_capacity}`, 'cyan');
    log(`    Occupancy ΜΕΤΑ: ${afterState.slot_occupancy}/${testSlot.max_capacity}`, 'cyan');
    log(`    Διαφορά:        +${afterState.slot_occupancy - beforeState.slot_occupancy}`, 'cyan');
    
    if (afterState.slot_occupancy - beforeState.slot_occupancy === 1) {
      log('    ✅ ΝΑΙ! Το occupancy ενημερώθηκε σωστά (+1)', 'green');
    } else {
      log('    ❌ ΟΧΙ! Το occupancy ΔΕΝ ενημερώθηκε!', 'red');
      log('    🚨🚨🚨 ΑΥΤΟ ΕΙΝΑΙ ΤΟ BUG! 🚨🚨🚨', 'red');
    }

    // Verification 4: User can see their booking
    log('\n  ✓ ΕΛΕΓΧΟΣ 4: Μπορεί ο χρήστης να δει την κράτησή του?', 'yellow');
    const { data: userBookings, error: userBookingsError } = await supabase
      .from('pilates_bookings')
      .select(`
        *,
        slot:pilates_schedule_slots(*)
      `)
      .eq('user_id', testUser.user_id)
      .eq('status', 'confirmed');

    if (userBookingsError) {
      log(`    ❌ Error: ${userBookingsError.message}`, 'red');
    } else {
      const hasThisBooking = userBookings.some(b => b.id === bookingId);
      if (hasThisBooking) {
        log('    ✅ ΝΑΙ! Ο χρήστης βλέπει την κράτησή του', 'green');
        log(`       Σύνολο κρατήσεων: ${userBookings.length}`, 'cyan');
      } else {
        log('    ❌ ΟΧΙ! Ο χρήστης ΔΕΝ βλέπει την κράτησή του!', 'red');
      }
    }

    // Verification 5: System shows correct count (1/4)
    log('\n  ✓ ΕΛΕΓΧΟΣ 5: Δείχνει το σύστημα σωστά το 1/4?', 'yellow');
    const { data: slotOccupancy } = await supabase
      .from('pilates_slots_with_occupancy')
      .select('*')
      .eq('slot_id', testSlot.id)
      .single();

    if (slotOccupancy) {
      log(`    Slot ID: ${slotOccupancy.slot_id}`, 'cyan');
      log(`    Booked Count: ${slotOccupancy.booked_count}`, 'cyan');
      log(`    Max Capacity: ${slotOccupancy.max_capacity}`, 'cyan');
      log(`    Display: ${slotOccupancy.booked_count}/${slotOccupancy.max_capacity}`, 'cyan');
      
      if (slotOccupancy.booked_count === afterState.slot_occupancy) {
        log('    ✅ ΝΑΙ! Το σύστημα δείχνει σωστά!', 'green');
      } else {
        log('    ❌ ΟΧΙ! Το σύστημα δείχνει λάθος count!', 'red');
      }
    }

    // STEP 6: Verify user_profiles integration
    log('\n📋 STEP 6: 🔍 Έλεγχος user_profiles integration...', 'magenta');
    
    const { data: profileCheck } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', testUser.user_id)
      .single();

    if (profileCheck) {
      log('    ✅ User profile exists', 'green');
      log(`       Name: ${profileCheck.first_name} ${profileCheck.last_name}`, 'cyan');
      log(`       Email: ${profileCheck.email}`, 'cyan');
      log(`       Role: ${profileCheck.role}`, 'cyan');
    }

    // FINAL SUMMARY
    log('\n╔══════════════════════════════════════════════════════════════╗', 'magenta');
    log('║  ΤΕΛΙΚΗ ΑΠΟΦΑΣΗ                                              ║', 'magenta');
    log('╚══════════════════════════════════════════════════════════════╝\n', 'magenta');

    const allChecks = [
      { name: 'Booking υπάρχει στη βάση', passed: !!bookingCheck },
      { name: 'Deposit αφαιρέθηκε', passed: beforeState.deposit - afterState.deposit === 1 },
      { name: 'Slot occupancy ενημερώθηκε', passed: afterState.slot_occupancy - beforeState.slot_occupancy === 1 },
      { name: 'User βλέπει την κράτηση', passed: userBookings?.some(b => b.id === bookingId) },
      { name: 'Σύστημα δείχνει σωστά', passed: slotOccupancy?.booked_count === afterState.slot_occupancy }
    ];

    allChecks.forEach((check, i) => {
      const status = check.passed ? '✅' : '❌';
      const color = check.passed ? 'green' : 'red';
      log(`  ${i + 1}. ${check.name.padEnd(35)} ${status}`, color);
    });

    const allPassed = allChecks.every(c => c.passed);

    log('');
    if (allPassed) {
      log('  🎉🎉🎉 ΟΛΑ ΤΑ CHECKS ΠΕΡΑΣΑΝ! 🎉🎉🎉', 'green');
      log('  ΤΟ ΣΥΣΤΗΜΑ ΛΕΙΤΟΥΡΓΕΙ 100% ΣΩΣΤΑ!', 'green');
    } else {
      log('  ❌❌❌ ΥΠΑΡΧΟΥΝ ΠΡΟΒΛΗΜΑΤΑ! ❌❌❌', 'red');
      log('  ΤΟ BUG ΥΠΑΡΧΕΙ ΑΚΟΜΑ!', 'red');
    }

    // Cleanup
    log('\n📋 Cleanup - Ακύρωση test κράτησης...', 'cyan');
    await supabase.rpc('cancel_pilates_booking', {
      p_booking_id: bookingId,
      p_user_id: testUser.user_id
    });
    log('  ✅ Cleanup complete\n', 'green');

    return allPassed;

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

async function captureState(userId, slotId) {
  // Get deposit
  const { data: deposit } = await supabase
    .from('pilates_deposits')
    .select('deposit_remaining')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('credited_at', { ascending: false })
    .limit(1)
    .single();

  // Get bookings count
  const { data: bookings } = await supabase
    .from('pilates_bookings')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'confirmed');

  // Get slot occupancy
  const { data: slotBookings } = await supabase
    .from('pilates_bookings')
    .select('id')
    .eq('slot_id', slotId)
    .eq('status', 'confirmed');

  return {
    deposit: deposit?.deposit_remaining || 0,
    bookings_count: bookings?.length || 0,
    slot_occupancy: slotBookings?.length || 0
  };
}

// Run
deepAnalysis().then(success => {
  process.exit(success ? 0 : 1);
});

