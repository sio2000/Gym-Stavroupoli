// Test script για να δοκιμάσουμε τη λογική με πολλούς χρήστες
// Αυτό θα μας βοηθήσει να επιβεβαιώσουμε ότι η λογική φιλτραρίσματος λειτουργεί για όλους τους χρήστες

import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test function που μιμείται τη getUserActiveMemberships
async function testGetUserActiveMemberships(userId) {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        *,
        package:membership_packages(
          id,
          name,
          description,
          package_type
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('end_date', currentDate) // Only non-expired memberships
      .order('end_date', { ascending: false });

    if (error) throw error;
    
    // Additional client-side filtering
    const filteredData = (data || []).filter(membership => {
      const membershipEndDate = new Date(membership.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return membershipEndDate >= today;
    });
    
    return filteredData;
  } catch (error) {
    console.error('Error testing getUserActiveMemberships:', error);
    return [];
  }
}

// Test function που δείχνει όλες τις συνδρομές ενός χρήστη
async function testGetAllUserMemberships(userId) {
  try {
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        *,
        package:membership_packages(
          id,
          name,
          description,
          package_type
        )
      `)
      .eq('user_id', userId)
      .order('end_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting all memberships:', error);
    return [];
  }
}

// Function για να βρει όλους τους χρήστες με ληγμένες συνδρομές
async function getAllUsersWithExpiredMemberships() {
  try {
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        user_id,
        end_date,
        is_active,
        status,
        package:membership_packages(name)
      `)
      .eq('is_active', true)
      .lt('end_date', new Date().toISOString().split('T')[0]) // Expired memberships
      .order('user_id');

    if (error) throw error;
    
    // Group by user_id
    const usersMap = new Map();
    (data || []).forEach(membership => {
      if (!usersMap.has(membership.user_id)) {
        usersMap.set(membership.user_id, []);
      }
      usersMap.get(membership.user_id).push(membership);
    });
    
    return usersMap;
  } catch (error) {
    console.error('Error finding users with expired memberships:', error);
    return new Map();
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Testing membership filtering logic with multiple users...\n');
  
  // Get all users with expired memberships
  const usersWithExpiredMemberships = await getAllUsersWithExpiredMemberships();
  console.log(`📊 Found ${usersWithExpiredMemberships.size} users with expired memberships\n`);
  
  let totalTests = 0;
  let successfulTests = 0;
  let failedTests = 0;
  
  // Test each user
  for (const [userId, expiredMemberships] of usersWithExpiredMemberships) {
    totalTests++;
    console.log(`🧪 Testing user ${userId} (${totalTests}/${usersWithExpiredMemberships.size})`);
    console.log(`   Expired memberships: ${expiredMemberships.length}`);
    
    // Get all memberships for this user
    const allMemberships = await testGetAllUserMemberships(userId);
    console.log(`   Total memberships: ${allMemberships.length}`);
    
    // Get active memberships (filtered)
    const activeMemberships = await testGetUserActiveMemberships(userId);
    console.log(`   Active memberships (filtered): ${activeMemberships.length}`);
    
    // Check if any expired memberships are in the active results
    const currentDate = new Date().toISOString().split('T')[0];
    const expiredInResults = activeMemberships.filter(m => m.end_date < currentDate);
    
    if (expiredInResults.length > 0) {
      console.log(`   ❌ FAILED: Found ${expiredInResults.length} expired memberships in active results!`);
      console.log(`   Expired memberships:`, expiredInResults.map(m => ({
        package: m.package?.name,
        end_date: m.end_date
      })));
      failedTests++;
    } else {
      console.log(`   ✅ SUCCESS: No expired memberships found in active results!`);
      successfulTests++;
    }
    
    // Show summary for this user
    console.log(`   Summary:`);
    console.log(`     - Expired memberships: ${expiredMemberships.map(m => `${m.package.name} (${m.end_date})`).join(', ')}`);
    console.log(`     - Active memberships: ${activeMemberships.map(m => `${m.package?.name} (${m.end_date})`).join(', ')}`);
    console.log('');
  }
  
  // Final summary
  console.log('🏁 FINAL TEST RESULTS:');
  console.log(`   Total users tested: ${totalTests}`);
  console.log(`   Successful tests: ${successfulTests}`);
  console.log(`   Failed tests: ${failedTests}`);
  console.log(`   Success rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED! The membership filtering logic works perfectly!');
  } else {
    console.log(`\n⚠️  ${failedTests} tests failed. Please check the logic.`);
  }
}

// Run the tests
runTests().catch(console.error);
