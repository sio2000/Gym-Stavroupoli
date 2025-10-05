// Test script για να δοκιμάσουμε τη λογική φιλτραρίσματος συνδρομών
// Αυτό θα μας βοηθήσει να επιβεβαιώσουμε ότι η getUserActiveMemberships function λειτουργεί σωστά

const { createClient } = require('@supabase/supabase-js');

// Configuration - αντικατέστησε με τα σου δεδομένα
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test function που μιμείται τη getUserActiveMemberships
async function testGetUserActiveMemberships(userId) {
  try {
    console.log('===== TESTING getUserActiveMemberships =====');
    console.log('User ID:', userId);
    
    // Get current date in YYYY-MM-DD format for comparison
    const currentDate = new Date().toISOString().split('T')[0];
    console.log('Current date for filtering:', currentDate);
    
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

    console.log('Query result - data:', data, 'error:', error);
    
    if (error) throw error;
    
    // Additional client-side filtering to ensure no expired memberships slip through
    const filteredData = (data || []).filter(membership => {
      const membershipEndDate = new Date(membership.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      const isNotExpired = membershipEndDate >= today;
      
      if (!isNotExpired) {
        console.log('Filtering out expired membership:', {
          id: membership.id,
          end_date: membership.end_date,
          package_name: membership.package?.name
        });
      }
      
      return isNotExpired;
    });
    
    console.log('Returning active memberships (after filtering):', filteredData);
    return filteredData;
  } catch (error) {
    console.error('Error testing getUserActiveMemberships:', error);
    return [];
  }
}

// Test function που δείχνει όλες τις συνδρομές ενός χρήστη (χωρίς φιλτράρισμα)
async function testGetAllUserMemberships(userId) {
  try {
    console.log('===== TESTING getAllUserMemberships (NO FILTERING) =====');
    
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
    
    console.log('All memberships for user:', data);
    return data || [];
  } catch (error) {
    console.error('Error getting all memberships:', error);
    return [];
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting membership filtering tests...\n');
  
  // Βρες έναν χρήστη για τεστ (αντικατέστησε με πραγματικό user_id)
  const testUserId = 'YOUR_TEST_USER_ID_HERE';
  
  if (testUserId === 'YOUR_TEST_USER_ID_HERE') {
    console.log('❌ Παρακαλώ αντικατέστησε το testUserId με έναν πραγματικό user_id');
    return;
  }
  
  // Test 1: Δες όλες τις συνδρομές του χρήστη
  const allMemberships = await testGetAllUserMemberships(testUserId);
  console.log('\n📊 All memberships count:', allMemberships.length);
  
  // Test 2: Δες μόνο τις ενεργές συνδρομές (με φιλτράρισμα)
  const activeMemberships = await testGetUserActiveMemberships(testUserId);
  console.log('\n✅ Active memberships count:', activeMemberships.length);
  
  // Test 3: Σύγκριση
  console.log('\n🔍 Comparison:');
  console.log('All memberships:', allMemberships.map(m => ({
    package: m.package?.name,
    end_date: m.end_date,
    is_active: m.is_active,
    status: m.status
  })));
  
  console.log('\nActive memberships (filtered):', activeMemberships.map(m => ({
    package: m.package?.name,
    end_date: m.end_date,
    is_active: m.is_active,
    status: m.status
  })));
  
  // Test 4: Έλεγχος ότι δεν υπάρχουν ληγμένες συνδρομές στα αποτελέσματα
  const currentDate = new Date().toISOString().split('T')[0];
  const expiredInResults = activeMemberships.filter(m => m.end_date < currentDate);
  
  if (expiredInResults.length > 0) {
    console.log('\n❌ ERROR: Found expired memberships in active results!');
    console.log('Expired memberships:', expiredInResults);
  } else {
    console.log('\n✅ SUCCESS: No expired memberships found in active results!');
  }
  
  console.log('\n🏁 Tests completed!');
}

// Run the tests
runTests().catch(console.error);
