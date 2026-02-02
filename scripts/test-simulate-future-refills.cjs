/**
 * Simulate Future Weekly Refills Test
 * 
 * This script simulates what happens over multiple weeks:
 * 1. Gets current state of all Ultimate users
 * 2. Simulates booking Pilates classes (consuming credits)
 * 3. Manually triggers refills for future dates
 * 4. Verifies credits are restored correctly
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const formatDateLocal = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

console.log('='.repeat(80));
console.log('🔮 SIMULATE FUTURE WEEKLY REFILLS TEST');
console.log('='.repeat(80));
console.log(`📅 Current Date: ${formatDateLocal(new Date())}`);
console.log('');

async function runSimulation() {
  try {
    // ========================================
    // STEP 1: Get one Ultimate user for testing
    // ========================================
    console.log('📋 STEP 1: Finding an Ultimate user for simulation...');
    
    const { data: memberships } = await supabase
      .from('memberships')
      .select('id, user_id, source_package_name, start_date, end_date')
      .eq('source_package_name', 'Ultimate')
      .eq('is_active', true)
      .limit(1);
    
    if (!memberships || memberships.length === 0) {
      console.log('❌ No Ultimate users found!');
      return;
    }
    
    const testUser = memberships[0];
    console.log(`   Found user: ${testUser.user_id}`);
    console.log(`   Package: ${testUser.source_package_name}`);
    console.log('');
    
    // ========================================
    // STEP 2: Get current deposit
    // ========================================
    console.log('📋 STEP 2: Checking current deposit...');
    
    const { data: currentDeposit } = await supabase
      .from('pilates_deposits')
      .select('*')
      .eq('user_id', testUser.user_id)
      .eq('is_active', true)
      .single();
    
    if (!currentDeposit) {
      console.log('❌ No deposit found for user!');
      return;
    }
    
    console.log(`   Current deposit: ${currentDeposit.deposit_remaining}`);
    console.log(`   Deposit ID: ${currentDeposit.id}`);
    console.log('');
    
    // ========================================
    // STEP 3: Simulate using credits (booking classes)
    // ========================================
    console.log('📋 STEP 3: Simulating Pilates class bookings (consuming credits)...');
    
    const newDeposit = Math.max(0, currentDeposit.deposit_remaining - 2);
    
    const { error: updateError } = await supabase
      .from('pilates_deposits')
      .update({ deposit_remaining: newDeposit })
      .eq('id', currentDeposit.id);
    
    if (updateError) {
      console.log(`❌ Error updating deposit: ${updateError.message}`);
      return;
    }
    
    console.log(`   ✅ Simulated booking 2 Pilates classes`);
    console.log(`   Deposit changed: ${currentDeposit.deposit_remaining} → ${newDeposit}`);
    console.log('');
    
    // ========================================
    // STEP 4: Verify deposit was reduced
    // ========================================
    console.log('📋 STEP 4: Verifying deposit was reduced...');
    
    const { data: afterBooking } = await supabase
      .from('pilates_deposits')
      .select('deposit_remaining')
      .eq('id', currentDeposit.id)
      .single();
    
    console.log(`   Current deposit after bookings: ${afterBooking.deposit_remaining}`);
    console.log('');
    
    // ========================================
    // STEP 5: Check refill history
    // ========================================
    console.log('📋 STEP 5: Checking refill history for user...');
    
    const { data: refillHistory } = await supabase
      .from('ultimate_weekly_refills')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('refill_date', { ascending: false })
      .limit(5);
    
    if (refillHistory && refillHistory.length > 0) {
      console.log(`   Found ${refillHistory.length} refill records:`);
      for (const r of refillHistory) {
        console.log(`   📆 ${r.refill_date} - Week #${r.refill_week_number}: ${r.previous_deposit_amount} → ${r.new_deposit_amount}`);
      }
    } else {
      console.log('   No refill history found');
    }
    console.log('');
    
    // ========================================
    // STEP 6: Simulate future Sunday by deleting today's refill record
    // ========================================
    console.log('📋 STEP 6: Preparing for next refill cycle...');
    console.log('   (Removing today\'s refill record to simulate a new week)');
    
    const today = formatDateLocal(new Date());
    
    const { error: deleteError } = await supabase
      .from('ultimate_weekly_refills')
      .delete()
      .eq('user_id', testUser.user_id)
      .eq('refill_date', today);
    
    if (deleteError) {
      console.log(`   ⚠️  Could not delete today's refill record: ${deleteError.message}`);
    } else {
      console.log(`   ✅ Removed today's refill record for user`);
    }
    console.log('');
    
    // ========================================
    // STEP 7: Trigger refill for this user
    // ========================================
    console.log('📋 STEP 7: Triggering weekly refill...');
    
    const { data: refillResult, error: refillError } = await supabase.rpc('process_weekly_pilates_refills');
    
    if (refillError) {
      console.log(`❌ Refill error: ${refillError.message}`);
    } else {
      console.log('   ✅ Refill process executed');
      if (refillResult && refillResult[0]) {
        console.log(`   Processed: ${refillResult[0].processed_count}`);
        console.log(`   Successful: ${refillResult[0].success_count}`);
      }
    }
    console.log('');
    
    // ========================================
    // STEP 8: Verify deposit was restored
    // ========================================
    console.log('📋 STEP 8: Verifying deposit was restored...');
    
    const { data: afterRefill } = await supabase
      .from('pilates_deposits')
      .select('deposit_remaining')
      .eq('id', currentDeposit.id)
      .single();
    
    console.log(`   Deposit before simulation: ${currentDeposit.deposit_remaining}`);
    console.log(`   Deposit after bookings: ${newDeposit}`);
    console.log(`   Deposit after refill: ${afterRefill.deposit_remaining}`);
    console.log('');
    
    const expectedTarget = testUser.source_package_name === 'Ultimate' ? 3 : 1;
    
    if (afterRefill.deposit_remaining === expectedTarget) {
      console.log(`   ✅ SUCCESS! Deposit restored to target: ${expectedTarget}`);
    } else if (afterRefill.deposit_remaining > newDeposit) {
      console.log(`   ✅ SUCCESS! Deposit increased from ${newDeposit} to ${afterRefill.deposit_remaining}`);
    } else {
      console.log(`   ⚠️  Deposit may not have been refilled correctly`);
      console.log(`      Expected: ${expectedTarget}, Got: ${afterRefill.deposit_remaining}`);
    }
    console.log('');
    
    // ========================================
    // STEP 9: Check updated refill history
    // ========================================
    console.log('📋 STEP 9: Checking updated refill history...');
    
    const { data: newRefillHistory } = await supabase
      .from('ultimate_weekly_refills')
      .select('*')
      .eq('user_id', testUser.user_id)
      .order('refill_date', { ascending: false })
      .limit(5);
    
    if (newRefillHistory && newRefillHistory.length > 0) {
      console.log(`   Found ${newRefillHistory.length} refill records:`);
      for (const r of newRefillHistory) {
        console.log(`   📆 ${r.refill_date} - Week #${r.refill_week_number}: ${r.previous_deposit_amount} → ${r.new_deposit_amount}`);
      }
    }
    console.log('');
    
    // ========================================
    // SUMMARY
    // ========================================
    console.log('='.repeat(80));
    console.log('📊 SIMULATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`   User: ${testUser.user_id}`);
    console.log(`   Package: ${testUser.source_package_name}`);
    console.log(`   Expected weekly credits: ${expectedTarget}`);
    console.log('');
    console.log('   Simulation flow:');
    console.log(`   1. Started with: ${currentDeposit.deposit_remaining} credits`);
    console.log(`   2. After booking 2 classes: ${newDeposit} credits`);
    console.log(`   3. After weekly refill: ${afterRefill.deposit_remaining} credits`);
    console.log('');
    
    if (afterRefill.deposit_remaining >= expectedTarget) {
      console.log('   ✅ WEEKLY REFILL SYSTEM WORKING CORRECTLY!');
    } else {
      console.log('   ⚠️  NEEDS INVESTIGATION');
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('✅ SIMULATION COMPLETED');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Simulation failed:', error);
  }
}

runSimulation();
