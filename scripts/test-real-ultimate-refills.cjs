/**
 * Real Ultimate/Ultimate Medium Weekly Refill Test
 * 
 * This script tests the weekly Pilates refill system with REAL users
 * who have active Ultimate or Ultimate Medium subscriptions.
 * 
 * It will:
 * 1. Find all real users with active Ultimate/Ultimate Medium subscriptions
 * 2. Check their current deposit status
 * 3. Trigger the weekly refill process
 * 4. Verify deposits were refilled correctly
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration from .env
const SUPABASE_URL = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Helper to format dates
const formatDateLocal = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Get today's date in local format
const today = formatDateLocal(new Date());

console.log('='.repeat(80));
console.log('🏋️ REAL ULTIMATE/ULTIMATE MEDIUM WEEKLY REFILL TEST');
console.log('='.repeat(80));
console.log(`📅 Test Date: ${today}`);
console.log(`🕐 Test Time: ${new Date().toLocaleString('el-GR')}`);
console.log('');

async function runTest() {
  try {
    // ========================================
    // STEP 1: Check Feature Flag
    // ========================================
    console.log('📋 STEP 1: Checking feature flag...');
    
    const { data: featureFlag, error: ffError } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('name', 'weekly_pilates_refill_enabled')
      .single();
    
    if (ffError) {
      console.log('⚠️  Feature flag not found, creating it...');
      await supabase
        .from('feature_flags')
        .insert({ name: 'weekly_pilates_refill_enabled', is_enabled: true });
    } else {
      console.log(`   Feature flag status: ${featureFlag.is_enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
      if (!featureFlag.is_enabled) {
        console.log('   Enabling feature flag for test...');
        await supabase
          .from('feature_flags')
          .update({ is_enabled: true })
          .eq('name', 'weekly_pilates_refill_enabled');
      }
    }
    console.log('');
    
    // ========================================
    // STEP 2: Find ALL active Ultimate users
    // ========================================
    console.log('📋 STEP 2: Finding REAL users with active Ultimate/Ultimate Medium subscriptions...');
    
    const { data: ultimateMemberships, error: membershipError } = await supabase
      .from('memberships')
      .select(`
        id,
        user_id,
        package_id,
        source_package_name,
        start_date,
        end_date,
        is_active
      `)
      .in('source_package_name', ['Ultimate', 'Ultimate Medium'])
      .eq('is_active', true)
      .gte('end_date', today);
    
    // Fetch user profiles separately
    if (ultimateMemberships && ultimateMemberships.length > 0) {
      const userIds = ultimateMemberships.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);
      
      // Attach profiles to memberships
      const profileMap = {};
      if (profiles) {
        for (const p of profiles) {
          profileMap[p.user_id] = p;
        }
      }
      for (const m of ultimateMemberships) {
        m.user_profiles = profileMap[m.user_id] || {};
      }
    }
    
    if (membershipError) {
      console.error('❌ Error fetching memberships:', membershipError);
      return;
    }
    
    console.log(`   Found ${ultimateMemberships?.length || 0} active Ultimate/Ultimate Medium memberships`);
    console.log('');
    
    if (!ultimateMemberships || ultimateMemberships.length === 0) {
      console.log('⚠️  No active Ultimate memberships found!');
      console.log('   The test cannot proceed without real users.');
      return;
    }
    
    // Display users
    console.log('📋 REAL ULTIMATE USERS:');
    console.log('-'.repeat(80));
    for (const membership of ultimateMemberships) {
      const user = membership.user_profiles;
      const name = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown';
      const email = user?.email || 'No email';
      console.log(`   👤 ${name} (${email})`);
      console.log(`      Package: ${membership.source_package_name}`);
      console.log(`      Period: ${membership.start_date} → ${membership.end_date}`);
      console.log(`      User ID: ${membership.user_id}`);
      console.log('');
    }
    
    // ========================================
    // STEP 3: Check current deposits BEFORE refill
    // ========================================
    console.log('📋 STEP 3: Checking current Pilates deposits BEFORE refill...');
    console.log('-'.repeat(80));
    
    const userIds = ultimateMemberships.map(m => m.user_id);
    
    const { data: depositsBeforeRaw, error: depositsError } = await supabase
      .from('pilates_deposits')
      .select('*')
      .in('user_id', userIds)
      .eq('is_active', true);
    
    // Create a map for easy lookup
    const depositsBefore = {};
    if (depositsBeforeRaw) {
      for (const d of depositsBeforeRaw) {
        depositsBefore[d.user_id] = d;
      }
    }
    
    for (const membership of ultimateMemberships) {
      const deposit = depositsBefore[membership.user_id];
      const expectedTarget = membership.source_package_name === 'Ultimate' ? 3 : 1;
      const user = membership.user_profiles;
      const name = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown';
      
      if (deposit) {
        console.log(`   👤 ${name}`);
        console.log(`      Package: ${membership.source_package_name} (target: ${expectedTarget})`);
        console.log(`      Current deposit: ${deposit.deposit_remaining}`);
        console.log(`      Deposit ID: ${deposit.id}`);
      } else {
        console.log(`   👤 ${name}`);
        console.log(`      Package: ${membership.source_package_name} (target: ${expectedTarget})`);
        console.log(`      ⚠️  NO ACTIVE DEPOSIT FOUND`);
      }
      console.log('');
    }
    
    // ========================================
    // STEP 4: Check existing refill records for today
    // ========================================
    console.log('📋 STEP 4: Checking existing refill records for today...');
    
    const { data: existingRefills, error: refillCheckError } = await supabase
      .from('ultimate_weekly_refills')
      .select('*')
      .in('user_id', userIds)
      .eq('refill_date', today);
    
    if (existingRefills && existingRefills.length > 0) {
      console.log(`   ⚠️  Found ${existingRefills.length} users already refilled today:`);
      for (const r of existingRefills) {
        console.log(`      - User ${r.user_id}: ${r.previous_deposit_amount} → ${r.new_deposit_amount}`);
      }
      console.log('');
      console.log('   These users will be SKIPPED by the refill process (already processed today)');
    } else {
      console.log('   ✅ No users have been refilled today yet');
    }
    console.log('');
    
    // ========================================
    // STEP 5: Execute weekly refill process
    // ========================================
    console.log('📋 STEP 5: Executing weekly refill process...');
    console.log('-'.repeat(80));
    
    const { data: refillResult, error: refillError } = await supabase.rpc('process_weekly_pilates_refills');
    
    if (refillError) {
      console.error('❌ Error executing refill:', refillError);
      
      // Try to get more details
      console.log('');
      console.log('Trying to manually check refill status...');
    } else {
      console.log('✅ Refill process completed!');
      console.log(`   Result: ${JSON.stringify(refillResult, null, 2)}`);
    }
    console.log('');
    
    // ========================================
    // STEP 6: Check deposits AFTER refill
    // ========================================
    console.log('📋 STEP 6: Checking Pilates deposits AFTER refill...');
    console.log('-'.repeat(80));
    
    const { data: depositsAfterRaw, error: depositsAfterError } = await supabase
      .from('pilates_deposits')
      .select('*')
      .in('user_id', userIds)
      .eq('is_active', true);
    
    const depositsAfter = {};
    if (depositsAfterRaw) {
      for (const d of depositsAfterRaw) {
        depositsAfter[d.user_id] = d;
      }
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (const membership of ultimateMemberships) {
      const before = depositsBefore[membership.user_id];
      const after = depositsAfter[membership.user_id];
      const expectedTarget = membership.source_package_name === 'Ultimate' ? 3 : 1;
      const user = membership.user_profiles;
      const name = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown';
      
      console.log(`   👤 ${name} (${membership.source_package_name})`);
      console.log(`      Before: ${before?.deposit_remaining ?? 'NO DEPOSIT'}`);
      console.log(`      After:  ${after?.deposit_remaining ?? 'NO DEPOSIT'}`);
      console.log(`      Expected: ${expectedTarget}`);
      
      if (after && after.deposit_remaining === expectedTarget) {
        console.log(`      ✅ CORRECT - Deposit is at target`);
        successCount++;
      } else if (after && after.deposit_remaining >= expectedTarget) {
        console.log(`      ✅ OK - Deposit meets or exceeds target`);
        successCount++;
      } else {
        console.log(`      ⚠️  NEEDS ATTENTION - Deposit not at expected level`);
        failCount++;
      }
      console.log('');
    }
    
    // ========================================
    // STEP 7: Check refill history
    // ========================================
    console.log('📋 STEP 7: Checking refill history...');
    console.log('-'.repeat(80));
    
    const { data: refillHistory, error: historyError } = await supabase
      .from('ultimate_weekly_refills')
      .select('*')
      .in('user_id', userIds)
      .order('refill_date', { ascending: false })
      .limit(20);
    
    if (refillHistory && refillHistory.length > 0) {
      console.log(`   Found ${refillHistory.length} refill records (showing last 20):`);
      console.log('');
      for (const r of refillHistory) {
        console.log(`   📆 ${r.refill_date} - User ${r.user_id.substring(0, 8)}...`);
        console.log(`      Package: ${r.package_name}`);
        console.log(`      Week #${r.refill_week_number}: ${r.previous_deposit_amount} → ${r.new_deposit_amount}`);
      }
    } else {
      console.log('   No refill history found');
    }
    console.log('');
    
    // ========================================
    // STEP 8: Test get_user_weekly_refill_status for each user
    // ========================================
    console.log('📋 STEP 8: Testing get_user_weekly_refill_status for each user...');
    console.log('-'.repeat(80));
    
    for (const membership of ultimateMemberships) {
      const user = membership.user_profiles;
      const name = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown';
      
      const { data: status, error: statusError } = await supabase.rpc('get_user_weekly_refill_status', {
        p_user_id: membership.user_id
      });
      
      console.log(`   👤 ${name}`);
      if (statusError) {
        console.log(`      ❌ Error: ${statusError.message}`);
      } else if (status && status.length > 0) {
        const s = status[0];
        console.log(`      Package: ${s.package_name}`);
        console.log(`      Current deposit: ${s.current_deposit_amount}`);
        console.log(`      Target: ${s.target_deposit_amount}`);
        console.log(`      Next refill: ${s.next_refill_date} (week #${s.next_refill_week})`);
        console.log(`      Refill due: ${s.is_refill_due ? 'YES' : 'NO'}`);
      } else {
        console.log(`      ⚠️  No status returned (user may not have Ultimate membership)`);
      }
      console.log('');
    }
    
    // ========================================
    // SUMMARY
    // ========================================
    console.log('='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`   Total Ultimate users tested: ${ultimateMemberships.length}`);
    console.log(`   ✅ Users with correct deposits: ${successCount}`);
    console.log(`   ⚠️  Users needing attention: ${failCount}`);
    console.log('');
    
    if (refillResult) {
      console.log('   Refill Process Result:');
      console.log(`   - Processed: ${refillResult.processed_count || 0}`);
      console.log(`   - Successful: ${refillResult.success_count || 0}`);
      console.log(`   - Errors: ${refillResult.error_count || 0}`);
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('✅ TEST COMPLETED');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
runTest();
