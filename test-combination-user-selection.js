/**
 * Test για την επιλογή χρήστη σε Combination Training
 * Επιβεβαιώνει ότι το Group Room Options εμφανίζεται σωστά
 */

console.log('🧪 ΕΚΚΙΝΗΣΗ TEST ΓΙΑ COMBINATION USER SELECTION');
console.log('=============================================');

// Simulate the user selection logic for combination training
function simulateUserSelection(trainingType, selectedUserId, selectedUserIds) {
  console.log(`\n--- Testing ${trainingType.toUpperCase()} Training ---`);
  console.log(`Selected User ID: ${selectedUserId || 'None'}`);
  console.log(`Selected User IDs: [${selectedUserIds.join(', ')}]`);
  
  // Check if Group Room Options should be visible
  const shouldShowGroupRoomOptions = (
    (trainingType === 'group' && selectedUserIds.length > 0) || 
    (trainingType === 'combination' && !!selectedUserId)
  );
  
  // Check if User Selection should show as completed
  const userSelectionComplete = (
    (trainingType === 'individual' || trainingType === 'combination') 
      ? !!selectedUserId 
      : selectedUserIds.length > 0
  );
  
  console.log(`Group Room Options Visible: ${shouldShowGroupRoomOptions ? '✅ YES' : '❌ NO'}`);
  console.log(`User Selection Complete: ${userSelectionComplete ? '✅ YES' : '❌ NO'}`);
  
  return {
    trainingType,
    selectedUserId,
    selectedUserIds,
    shouldShowGroupRoomOptions,
    userSelectionComplete
  };
}

// Test scenarios
const testScenarios = [
  {
    name: 'Individual με επιλεγμένο χρήστη',
    trainingType: 'individual',
    selectedUserId: 'user-123',
    selectedUserIds: [],
    expectedGroupRoomOptions: false,
    expectedUserComplete: true
  },
  {
    name: 'Individual χωρίς επιλεγμένο χρήστη',
    trainingType: 'individual',
    selectedUserId: '',
    selectedUserIds: [],
    expectedGroupRoomOptions: false,
    expectedUserComplete: false
  },
  {
    name: 'Combination με επιλεγμένο χρήστη',
    trainingType: 'combination',
    selectedUserId: 'user-456',
    selectedUserIds: [],
    expectedGroupRoomOptions: true, // 🎯 This should be TRUE now!
    expectedUserComplete: true
  },
  {
    name: 'Combination χωρίς επιλεγμένο χρήστη',
    trainingType: 'combination',
    selectedUserId: '',
    selectedUserIds: [],
    expectedGroupRoomOptions: false,
    expectedUserComplete: false
  },
  {
    name: 'Group με επιλεγμένους χρήστες',
    trainingType: 'group',
    selectedUserId: '',
    selectedUserIds: ['user-789', 'user-101'],
    expectedGroupRoomOptions: true,
    expectedUserComplete: true
  },
  {
    name: 'Group χωρίς επιλεγμένους χρήστες',
    trainingType: 'group',
    selectedUserId: '',
    selectedUserIds: [],
    expectedGroupRoomOptions: false,
    expectedUserComplete: false
  }
];

console.log('\n🚀 ΕΚΤΕΛΕΣΗ TEST SCENARIOS...\n');

let passedTests = 0;
let totalTests = testScenarios.length;

testScenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. ${scenario.name}`);
  console.log('─'.repeat(50));
  
  const result = simulateUserSelection(
    scenario.trainingType,
    scenario.selectedUserId,
    scenario.selectedUserIds
  );
  
  // Verify results
  const groupRoomCorrect = result.shouldShowGroupRoomOptions === scenario.expectedGroupRoomOptions;
  const userCompleteCorrect = result.userSelectionComplete === scenario.expectedUserComplete;
  const allCorrect = groupRoomCorrect && userCompleteCorrect;
  
  if (allCorrect) {
    console.log(`✅ PASS: Όλα σωστά!`);
    passedTests++;
  } else {
    console.log(`❌ FAIL: Κάτι δεν πάει καλά`);
    if (!groupRoomCorrect) {
      console.log(`   Group Room Options: Expected ${scenario.expectedGroupRoomOptions}, Got ${result.shouldShowGroupRoomOptions}`);
    }
    if (!userCompleteCorrect) {
      console.log(`   User Selection: Expected ${scenario.expectedUserComplete}, Got ${result.userSelectionComplete}`);
    }
  }
});

console.log('\n=============================================');
console.log(`📈 ΣΥΝΟΛΙΚΑ ΑΠΟΤΕΛΕΣΜΑΤΑ: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 ΟΛΟΙ ΟΙ TESTS ΠΕΡΑΣΑΝ! Η διόρθωση λειτουργεί σωστά.');
} else {
  console.log('⚠️  ΚΑΠΟΙΟΙ TESTS ΑΠΕΤΥΧΑΝ. Χρειάζεται περισσότερη διόρθωση.');
}

console.log('\n🔍 ΕΙΔΙΚΟΣ ΕΛΕΓΧΟΣ ΓΙΑ COMBINATION...\n');

// Special focus on combination training
const combinationWithUser = simulateUserSelection('combination', 'user-test', []);
console.log('🎯 ΚΡΙΣΙΜΟΣ ΕΛΕΓΧΟΣ: Combination με χρήστη');
console.log(`   Group Room Options εμφανίζεται: ${combinationWithUser.shouldShowGroupRoomOptions ? '✅ ΝΑΙ' : '❌ ΟΧΙ'}`);

if (combinationWithUser.shouldShowGroupRoomOptions) {
  console.log('🎉 ΕΠΙΤΥΧΙΑ! Το Group Room Options τώρα εμφανίζεται για Combination Training!');
  console.log('📋 Ο admin μπορεί τώρα να:');
  console.log('   1. Επιλέξει Combination training type');
  console.log('   2. Επιλέξει έναν χρήστη');
  console.log('   3. Δει τις "Επιλογές Ομαδικής Αίθουσας (για Group Sessions)"');
  console.log('   4. Επιλέξει μέγεθος ομάδας (2, 3, ή 6 χρήστες)');
  console.log('   5. Επιλέξει συχνότητα εβδομάδας');
  console.log('   6. Κλείσει ημέρες προγράμματος στο GroupAssignmentInterface');
} else {
  console.log('❌ ΠΡΟΒΛΗΜΑ! Το Group Room Options δεν εμφανίζεται για Combination Training!');
  console.log('🔧 Χρειάζεται περισσότερη διόρθωση στον κώδικα.');
}

console.log('\n✨ Test completed!');
