/**
 * Test Ultimate Medium Refill (1 credit per week)
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const formatDateLocal = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

console.log('='.repeat(80));
console.log('🔮 ULTIMATE MEDIUM REFILL TEST (1 credit/week)');
console.log('='.repeat(80));

async function runTest() {
  try {
    // Find Ultimate Medium user
    console.log('📋 Finding Ultimate Medium user...');
    
    const { data: memberships } = await supabase
      .from('memberships')
      .select('id, user_id, source_package_name')
      .eq('source_package_name', 'Ultimate Medium')
      .eq('is_active', true)
      .limit(1);
    
    if (!memberships || memberships.length === 0) {
      console.log('❌ No Ultimate Medium users found!');
      return;
    }
    
    const testUser = memberships[0];
    console.log(`   User: ${testUser.user_id}`);
    console.log(`   Package: ${testUser.source_package_name}`);
    console.log('');
    
    // Get current deposit
    const { data: deposit } = await supabase
      .from('pilates_deposits')
      .select('*')
      .eq('user_id', testUser.user_id)
      .eq('is_active', true)
      .single();
    
    console.log(`   Current deposit: ${deposit?.deposit_remaining || 'NO DEPOSIT'}`);
    
    if (!deposit) {
      console.log('❌ No deposit found!');
      return;
    }
    
    // Simulate using the credit
    console.log('');
    console.log('📋 Simulating using 1 Pilates class...');
    
    await supabase
      .from('pilates_deposits')
      .update({ deposit_remaining: 0 })
      .eq('id', deposit.id);
    
    console.log('   Deposit set to 0');
    
    // Remove today's refill record
    const today = formatDateLocal(new Date());
    await supabase
      .from('ultimate_weekly_refills')
      .delete()
      .eq('user_id', testUser.user_id)
      .eq('refill_date', today);
    
    console.log('   Cleared today\'s refill record');
    
    // Trigger refill
    console.log('');
    console.log('📋 Triggering refill...');
    
    const { data: result } = await supabase.rpc('process_weekly_pilates_refills');
    
    // Check result
    const { data: afterRefill } = await supabase
      .from('pilates_deposits')
      .select('deposit_remaining')
      .eq('id', deposit.id)
      .single();
    
    console.log(`   Deposit after refill: ${afterRefill.deposit_remaining}`);
    console.log('');
    
    if (afterRefill.deposit_remaining === 1) {
      console.log('✅ SUCCESS! Ultimate Medium correctly receives 1 credit per week!');
    } else {
      console.log(`⚠️  Expected 1 credit, got ${afterRefill.deposit_remaining}`);
    }
    
    console.log('');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTest();
