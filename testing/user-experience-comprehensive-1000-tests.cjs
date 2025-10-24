// Comprehensive 1000+ tests from USER PERSPECTIVE
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

async function getUserDeposits(userId) {
  const { data } = await supabase
    .from('pilates_deposits')
    .select('deposit_remaining, id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data;
}

async function getUserBookings(userId) {
  const { data } = await supabase
    .from('pilates_bookings')
    .select('id, slot_id, status, booking_date')
    .eq('user_id', userId)
    .eq('status', 'confirmed');
  return data || [];
}

async function getAvailableSlots() {
  const today = new Date();
  const { data } = await supabase
    .from('pilates_schedule_slots')
    .select('id, date, start_time, max_capacity')
    .gte('date', today.toISOString().split('T')[0])
    .eq('is_active', true)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(50);
  return data || [];
}

async function runSingleUserTest(user, slot, testNumber) {
  const results = {
    testNumber,
    userId: user.id,
    userName: `${user.first_name} ${user.last_name}`,
    slotId: slot.id,
    slotDate: slot.date,
    passed: true,
    checks: [],
    errors: []
  };

  try {
    // STEP 1: Verify user has deposit
    const depositBefore = await getUserDeposits(user.id);
    if (!depositBefore || depositBefore.deposit_remaining <= 0) {
      results.passed = false;
      results.errors.push('User has no active deposit');
      return results;
    }
    results.checks.push(`✅ User has deposit: ${depositBefore.deposit_remaining}`);

    // STEP 2: Check if user already booked this slot
    const existingBookings = await getUserBookings(user.id);
    const alreadyBooked = existingBookings.some(b => b.slot_id === slot.id);
    if (alreadyBooked) {
      results.passed = false;
      results.errors.push('User already booked this slot');
      return results;
    }
    results.checks.push(`✅ No existing booking for this slot`);

    // STEP 3: Attempt booking via RPC
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('book_pilates_class', { p_user_id: user.id, p_slot_id: slot.id });

    if (rpcError) {
      results.passed = false;
      results.errors.push(`RPC error: ${rpcError.message}`);
      return results;
    }

    const bookingId = rpcData?.[0]?.booking_id || rpcData?.booking_id;
    if (!bookingId) {
      results.passed = false;
      results.errors.push('No booking ID returned from RPC');
      return results;
    }
    results.checks.push(`✅ Booking created with ID: ${bookingId}`);

    // STEP 4: Wait a bit for consistency
    await new Promise(resolve => setTimeout(resolve, 100));

    // STEP 5: Verify user can see their booking
    const { data: userBooking, error: userBookingError } = await supabase
      .from('pilates_bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single();

    if (userBookingError || !userBooking) {
      results.passed = false;
      results.errors.push(`User cannot see booking: ${userBookingError?.message}`);
      return results;
    }
    results.checks.push(`✅ User can see their booking`);

    // STEP 6: Verify deposit was decremented
    const depositAfter = await getUserDeposits(user.id);
    if (!depositAfter) {
      results.passed = false;
      results.errors.push('Cannot fetch deposit after booking');
      return results;
    }

    const expectedDeposit = depositBefore.deposit_remaining - 1;
    if (depositAfter.deposit_remaining !== expectedDeposit) {
      results.passed = false;
      results.errors.push(`Deposit mismatch: ${depositBefore.deposit_remaining} → ${depositAfter.deposit_remaining} (expected ${expectedDeposit})`);
      return results;
    }
    results.checks.push(`✅ Deposit decremented: ${depositBefore.deposit_remaining} → ${depositAfter.deposit_remaining}`);

    // STEP 7: Verify slot occupancy updated
    const { data: slotData } = await supabase
      .from('pilates_schedule_slots')
      .select('occupancy_count, max_capacity')
      .eq('id', slot.id)
      .single();

    if (slotData) {
      const occupancyRatio = `${slotData.occupancy_count}/${slotData.max_capacity}`;
      results.checks.push(`✅ Slot occupancy: ${occupancyRatio}`);
      
      if (slotData.occupancy_count > slotData.max_capacity) {
        results.passed = false;
        results.errors.push(`Overcapacity: ${occupancyRatio}`);
      }
    }

    // STEP 8: Verify user can query all their bookings
    const allUserBookings = await getUserBookings(user.id);
    const hasThisBooking = allUserBookings.some(b => b.id === bookingId);
    if (!hasThisBooking) {
      results.passed = false;
      results.errors.push('Booking not found in user\'s booking list');
      return results;
    }
    results.checks.push(`✅ Booking appears in user's booking list`);

    // STEP 9: Verify booking status is 'confirmed'
    if (userBooking.status !== 'confirmed') {
      results.passed = false;
      results.errors.push(`Status is '${userBooking.status}', expected 'confirmed'`);
      return results;
    }
    results.checks.push(`✅ Booking status: confirmed`);

    // STEP 10: Clean up - cancel the booking
    const { error: cancelError } = await supabase
      .rpc('cancel_pilates_booking', { p_booking_id: bookingId });

    if (cancelError) {
      results.errors.push(`Cleanup warning: ${cancelError.message}`);
    } else {
      results.checks.push(`✅ Booking cancelled for cleanup`);
    }

  } catch (error) {
    results.passed = false;
    results.errors.push(`Exception: ${error.message}`);
  }

  return results;
}

async function runComprehensiveTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  USER EXPERIENCE - 1000+ COMPREHENSIVE TESTS                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Get all users WITH ACTIVE DEPOSITS
  const { data: deposits } = await supabase
    .from('pilates_deposits')
    .select('user_id')
    .eq('is_active', true)
    .gt('deposit_remaining', 0);
  
  const userIds = [...new Set(deposits?.map(d => d.user_id) || [])];
  
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, email')
    .in('id', userIds);

  if (!users || users.length === 0) {
    console.log('❌ No users found');
    return;
  }

  console.log(`📊 Found ${users.length} users\n`);

  // Get available slots
  const slots = await getAvailableSlots();
  if (!slots || slots.length === 0) {
    console.log('❌ No available slots');
    return;
  }

  console.log(`📅 Found ${slots.length} available slots\n`);

  // Run tests
  let testCounter = 0;
  const maxTests = 1000;

  for (let round = 0; round < Math.ceil(maxTests / users.length); round++) {
    for (const user of users) {
      if (testCounter >= maxTests) break;

      testCounter++;
      const slot = slots[testCounter % slots.length];

      process.stdout.write(`\r🧪 Test ${testCounter}/${maxTests}...`);
      
      const result = await runSingleUserTest(user, slot, testCounter);
      
      testResults.total++;
      if (result.passed) {
        testResults.passed++;
      } else {
        testResults.failed++;
        testResults.details.push(result);
        
        // Log failures immediately
        console.log(`\n❌ Test ${testCounter} FAILED`);
        console.log(`   User: ${result.userName}`);
        console.log(`   Errors: ${result.errors.join(', ')}`);
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (testCounter >= maxTests) break;
  }

  console.log('\n');
  console.log('═'.repeat(60));
  
  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  FINAL RESULTS - USER EXPERIENCE TESTS                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`Total Tests:      ${testResults.total}`);
  console.log(`✅ Passed:        ${testResults.passed}`);
  console.log(`❌ Failed:        ${testResults.failed}`);
  console.log(`Success Rate:     ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);

  if (testResults.failed > 0) {
    console.log(`\n⚠️  ${testResults.failed} tests failed`);
    console.log(`   First 5 failures:`);
    testResults.details.slice(0, 5).forEach(d => {
      console.log(`   - Test ${d.testNumber}: ${d.userName} - ${d.errors[0]}`);
    });
  } else {
    console.log('\n🎉 🎉 🎉 PERFECT! ALL 1000+ TESTS PASSED! 🎉 🎉 🎉');
  }

  console.log('\n' + '═'.repeat(60));
  
  // Final verdict
  if (testResults.failed === 0) {
    console.log('\n✅ ✅ ✅ USER EXPERIENCE: 100% PERFECT! ✅ ✅ ✅');
    console.log('\n🎊 The Pilates booking system works flawlessly from USER perspective!');
    console.log('🎊 Users can book successfully!');
    console.log('🎊 Users can see their bookings!');
    console.log('🎊 Deposits are managed correctly!');
    console.log('🎊 No issues detected!\n');
  } else {
    const successRate = (testResults.passed / testResults.total) * 100;
    if (successRate >= 99) {
      console.log('\n✅ EXCELLENT! Success rate > 99%');
      console.log('✅ System is production-ready for users!');
    } else if (successRate >= 95) {
      console.log('\n⚠️  GOOD but needs attention');
      console.log('⚠️  Some edge cases detected');
    } else {
      console.log('\n❌ NEEDS IMMEDIATE ATTENTION');
      console.log('❌ System has issues affecting users');
    }
  }
}

runComprehensiveTests().catch(console.error);

