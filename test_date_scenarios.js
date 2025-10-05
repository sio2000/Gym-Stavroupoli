// Test script για να δοκιμάσουμε τη λογική ημερομηνιών
// Αυτό θα μας βοηθήσει να επιβεβαιώσουμε ότι η λογική φιλτραρίσματος λειτουργεί σωστά

console.log('🚀 Testing membership date filtering logic...\n');

// Simulate different membership scenarios
const testMemberships = [
  {
    id: '1',
    package_name: 'Free Gym',
    start_date: '2024-09-01',
    end_date: '2024-09-22', // Expired (past date)
    is_active: true,
    status: 'active'
  },
  {
    id: '2',
    package_name: 'Pilates',
    start_date: '2024-10-01',
    end_date: '2025-01-01', // Active (future date)
    is_active: true,
    status: 'active'
  },
  {
    id: '3',
    package_name: 'Personal Training',
    start_date: '2024-10-01',
    end_date: new Date().toISOString().split('T')[0], // Expires today
    is_active: true,
    status: 'active'
  },
  {
    id: '4',
    package_name: 'Ultimate',
    start_date: '2024-09-01',
    end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Expires tomorrow
    is_active: true,
    status: 'active'
  }
];

// Current date for comparison
const currentDate = new Date().toISOString().split('T')[0];
console.log('📅 Current date:', currentDate);
console.log('📅 Current date object:', new Date());
console.log('');

// Test the filtering logic
function filterActiveMemberships(memberships) {
  console.log('🔍 Testing filtering logic...\n');
  
  const filteredMemberships = memberships.filter(membership => {
    const membershipEndDate = new Date(membership.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const isNotExpired = membershipEndDate >= today;
    
    console.log(`Membership ${membership.id} (${membership.package_name}):`);
    console.log(`  End date: ${membership.end_date}`);
    console.log(`  End date object: ${membershipEndDate}`);
    console.log(`  Today object: ${today}`);
    console.log(`  Is not expired: ${isNotExpired}`);
    console.log(`  Days difference: ${Math.ceil((membershipEndDate - today) / (1000 * 60 * 60 * 24))}`);
    console.log('');
    
    return isNotExpired;
  });
  
  return filteredMemberships;
}

// Test 1: Show all memberships
console.log('📊 ALL MEMBERSHIPS:');
testMemberships.forEach(membership => {
  const endDate = new Date(membership.end_date);
  const today = new Date();
  const daysDiff = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  
  console.log(`  ${membership.id}. ${membership.package_name}`);
  console.log(`     End date: ${membership.end_date}`);
  console.log(`     Status: ${daysDiff > 0 ? 'Active' : daysDiff === 0 ? 'Expires today' : 'Expired'}`);
  console.log(`     Days remaining: ${daysDiff}`);
  console.log('');
});

// Test 2: Filter active memberships
console.log('✅ FILTERED ACTIVE MEMBERSHIPS:');
const activeMemberships = filterActiveMemberships(testMemberships);

activeMemberships.forEach(membership => {
  const endDate = new Date(membership.end_date);
  const today = new Date();
  const daysDiff = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  
  console.log(`  ${membership.id}. ${membership.package_name}`);
  console.log(`     End date: ${membership.end_date}`);
  console.log(`     Days remaining: ${daysDiff}`);
  console.log('');
});

// Test 3: Show filtered out memberships
console.log('❌ FILTERED OUT MEMBERSHIPS:');
const filteredOutMemberships = testMemberships.filter(membership => {
  const membershipEndDate = new Date(membership.end_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return membershipEndDate < today;
});

filteredOutMemberships.forEach(membership => {
  const endDate = new Date(membership.end_date);
  const today = new Date();
  const daysDiff = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  
  console.log(`  ${membership.id}. ${membership.package_name}`);
  console.log(`     End date: ${membership.end_date}`);
  console.log(`     Days expired: ${Math.abs(daysDiff)}`);
  console.log('');
});

// Test 4: Summary
console.log('📈 SUMMARY:');
console.log(`  Total memberships: ${testMemberships.length}`);
console.log(`  Active memberships: ${activeMemberships.length}`);
console.log(`  Filtered out memberships: ${filteredOutMemberships.length}`);
console.log('');

// Test 5: Edge cases
console.log('🧪 TESTING EDGE CASES:');
const edgeCases = [
  {
    name: 'Membership expiring at midnight today',
    end_date: new Date().toISOString().split('T')[0] + 'T23:59:59.999Z'
  },
  {
    name: 'Membership expiring at start of today',
    end_date: new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'
  },
  {
    name: 'Membership expiring tomorrow',
    end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }
];

edgeCases.forEach(edgeCase => {
  const endDate = new Date(edgeCase.end_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const isNotExpired = endDate >= today;
  
  console.log(`  ${edgeCase.name}:`);
  console.log(`    End date: ${edgeCase.end_date}`);
  console.log(`    Is not expired: ${isNotExpired}`);
  console.log('');
});

console.log('🏁 Date filtering tests completed!');
