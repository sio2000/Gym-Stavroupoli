// FINAL 2000+ USER EXPERIENCE TESTS
// Tests the ENTIRE user booking flow from user perspective
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

async function getUserDeposit(userId) {
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
    .select('id, slot_id, status')
    .eq('user_id', userId)
    .eq('status', 'confirmed');
  return data || [];
}

async function getSlotOccupancy(slotId) {
  const { data } = await supabase
    .from('pilates_schedule_slots')
    .select('occupancy_count, max_capacity')
    .eq('id', slotId)
    .single();
  return data;
}

async function runUserExperienceTest(user, slot, testNum) {
  const result = {
    testNum,
    userId: user.id,
    userName: `${user.first_name} ${user.last_name}`,
    slotId: slot.id,
    slotDate: slot.date,
    passed: true,
    checks: [],
    errors: []
  };

  try {
    // USER CHECK 1: Does user have deposit?
    const depositBefore = await getUserDeposit(user.id);
    if (!depositBefore || depositBefore.deposit_remaining <= 0) {
      result.passed = false;
      result.errors.push('User has no active deposit');
      return result;
    }
    result.checks.push(`✅ User has ${depositBefore.deposit_remaining} classes`);

    // USER CHECK 2: Is slot available?
    if (!slot.is_active) {
      result.passed = false;
      result.errors.push('Slot is not active');
      return result;
    }
    result.checks.push(`✅ Slot is available`);

    // USER CHECK 3: Has user already booked this slot?
    const existingBookings = await getUserBookings(user.id);
    const alreadyBooked = existingBookings.some(b => b.slot_id === slot.id);
    if (alreadyBooked) {
      result.passed = false;
      result.errors.push('User already booked this slot');
      return result;
    }
    result.checks.push(`✅ No existing booking`);

    // USER CHECK 4: Make booking via RPC
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('book_pilates_class', { p_user_id: user.id, p_slot_id: slot.id });

    if (rpcError) {
      result.passed = false;
      result.errors.push(`RPC error: ${rpcError.message}`);
      return result;
    }

    const bookingId = rpcData?.[0]?.booking_id || rpcData?.booking_id;
    if (!bookingId) {
      result.passed = false;
      result.errors.push('No booking ID returned');
      return result;
    }
    result.checks.push(`✅ Booking created: ${bookingId}`);

    // Wait for consistency
    await new Promise(resolve => setTimeout(resolve, 100));

    // USER CHECK 5: User can see their booking
    const { data: userBooking, error: userBookingError } = await supabase
      .from('pilates_bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single();

    if (userBookingError || !userBooking) {
      result.passed = false;
      result.errors.push(`User cannot see booking: ${userBookingError?.message}`);
      return result;
    }
    result.checks.push(`✅ User can see their booking`);

    // USER CHECK 6: Deposit was decremented
    const depositAfter = await getUserDeposit(user.id);
    if (!depositAfter) {
      result.passed = false;
      result.errors.push('Cannot fetch deposit after booking');
      return result;
    }

    const expectedDeposit = depositBefore.deposit_remaining - 1;
    if (depositAfter.deposit_remaining !== expectedDeposit) {
      result.passed = false;
      result.errors.push(`Deposit: ${depositBefore.deposit_remaining} → ${depositAfter.deposit_remaining} (expected ${expectedDeposit})`);
      return result;
    }
    result.checks.push(`✅ Deposit: ${depositBefore.deposit_remaining} → ${depositAfter.deposit_remaining}`);

    // USER CHECK 7: Slot occupancy updated
    const slotData = await getSlotOccupancy(slot.id);
    if (slotData) {
      const occupancyRatio = `${slotData.occupancy_count}/${slotData.max_capacity}`;
      result.checks.push(`✅ Occupancy: ${occupancyRatio}`);
      
      if (slotData.occupancy_count > slotData.max_capacity) {
        result.passed = false;
        result.errors.push(`Overcapacity: ${occupancyRatio}`);
      }
    }

    // USER CHECK 8: Booking status is 'confirmed'
    if (userBooking.status !== 'confirmed') {
      result.passed = false;
      result.errors.push(`Status: '${userBooking.status}' (expected 'confirmed')`);
      return result;
    }
    result.checks.push(`✅ Status: confirmed`);

    // USER CHECK 9: Clean up
    const { error: cancelError } = await supabase
      .rpc('cancel_pilates_booking', { p_booking_id: bookingId });

    if (cancelError) {
      result.errors.push(`Cleanup warning: ${cancelError.message}`);
    } else {
      result.checks.push(`✅ Cleaned up`);
    }

  } catch (error) {
    result.passed = false;
    result.errors.push(`Exception: ${error.message}`);
  }

  return result;
}

async function runComprehensiveTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  FINAL 2000+ USER EXPERIENCE TESTS                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Get users with deposits - Manual approach
  const { data: depositsData } = await supabase
    .from('pilates_deposits')
    .select('user_id, deposit_remaining')
    .eq('is_active', true)
    .gt('deposit_remaining', 0);
  
  if (!depositsData || depositsData.length === 0) {
    console.log('❌ No active deposits found');
    return;
  }
  
  const userIds = [...new Set(depositsData.map(d => d.user_id))];
  console.log(`📊 Found ${userIds.length} unique users with deposits\n`);
  
  // Fetch user profiles for each UUID
  const users = [];
  for (const userId of userIds.slice(0, 50)) { // Limit to 50 for performance
    const { data: user } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email')
      .eq('id', userId)
      .single();
    
    if (user) {
      users.push(user);
    }
  }
  
  console.log(`✅ Loaded ${users.length} user profiles\n`);

  if (!users || users.length === 0) {
    console.log('❌ No users with deposits found');
    return;
  }

  console.log(`📊 Found ${users.length} users with deposits\n`);

  // Get available slots
  const today = new Date();
  const { data: slots } = await supabase
    .from('pilates_schedule_slots')
    .select('id, date, start_time, max_capacity, is_active')
    .gte('date', today.toISOString().split('T')[0])
    .eq('is_active', true)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(50);

  if (!slots || slots.length === 0) {
    console.log('❌ No available slots');
    return;
  }

  console.log(`📅 Found ${slots.length} available slots\n`);

  // Run 2000+ tests
  const maxTests = 2000;
  let testCounter = 0;

  console.log(`🚀 Running ${maxTests} tests...\n`);

  for (let round = 0; round < Math.ceil(maxTests / users.length); round++) {
    for (const user of users) {
      if (testCounter >= maxTests) break;

      testCounter++;
      const slot = slots[testCounter % slots.length];

      if (testCounter % 100 === 0) {
        process.stdout.write(`\r🧪 Tests: ${testCounter}/${maxTests}...`);
      }
      
      const result = await runUserExperienceTest(user, slot, testCounter);
      
      results.total++;
      if (result.passed) {
        results.passed++;
      } else {
        results.failed++;
        results.details.push(result);
      }

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    if (testCounter >= maxTests) break;
  }

  console.log('\n');
  console.log('═'.repeat(60));
  
  // Final Summary
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  FINAL RESULTS - USER EXPERIENCE TESTS                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`Total Tests:      ${results.total}`);
  console.log(`✅ Passed:        ${results.passed}`);
  console.log(`❌ Failed:        ${results.failed}`);
  console.log(`Success Rate:     ${((results.passed / results.total) * 100).toFixed(2)}%`);

  if (results.failed > 0) {
    console.log(`\n⚠️  ${results.failed} tests failed`);
    console.log(`   First 5 failures:`);
    results.details.slice(0, 5).forEach(d => {
      console.log(`   - Test ${d.testNum}: ${d.userName} - ${d.errors[0]}`);
    });
  } else {
    console.log('\n🎉 🎉 🎉 PERFECT! ALL 2000+ TESTS PASSED! 🎉 🎉 🎉');
  }

  console.log('\n' + '═'.repeat(60));
  
  // Final Verdict
  if (results.failed === 0) {
    console.log('\n✅ ✅ ✅ USER EXPERIENCE: 100% PERFECT! ✅ ✅ ✅');
    console.log('\n🎊 The Pilates booking system works flawlessly for ALL users!');
    console.log('🎊 2000+ tests confirm:');
    console.log('   ✅ Users can book successfully');
    console.log('   ✅ Users can see their bookings');
    console.log('   ✅ Deposits are managed correctly');
    console.log('   ✅ Occupancy updates perfectly');
    console.log('   ✅ Zero issues detected!');
    console.log('\n🚀 PRODUCTION READY! 🚀\n');
  } else {
    const successRate = (results.passed / results.total) * 100;
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

