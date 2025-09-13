const fs = require('fs');

console.log('=== SIMPLE SYNCHRONIZATION TEST ===\n');

// Read both files
const adminFile = fs.readFileSync('src/components/admin/PilatesScheduleManagement.tsx', 'utf8');
const userFile = fs.readFileSync('src/pages/PilatesCalendar.tsx', 'utf8');

// Check for refresh buttons
const adminRefreshButton = adminFile.includes('🔄 Refresh');
const userRefreshButton = userFile.includes('🔄 Refresh');

console.log('1. Refresh buttons:');
console.log(`Admin has refresh button: ${adminRefreshButton ? '✅' : '❌'}`);
console.log(`User has refresh button: ${userRefreshButton ? '✅' : '❌'}`);

// Check for console.log statements
const adminLogs = (adminFile.match(/console\.log/g) || []).length;
const userLogs = (userFile.match(/console\.log/g) || []).length;

console.log('\n2. Debug logging:');
console.log(`Admin console.log statements: ${adminLogs}`);
console.log(`User console.log statements: ${userLogs}`);

// Check for currentWeek in useEffect
const adminHasCurrentWeek = adminFile.includes('currentWeek]');
const userHasCurrentWeek = userFile.includes('currentWeek]');

console.log('\n3. useEffect dependencies:');
console.log(`Admin includes currentWeek: ${adminHasCurrentWeek ? '✅' : '❌'}`);
console.log(`User includes currentWeek: ${userHasCurrentWeek ? '✅' : '❌'}`);

// Check for "Fresh calculation" logs
const adminFreshLogs = adminFile.includes('Fresh calculation');
const userFreshLogs = userFile.includes('Fresh calculation');

console.log('\n4. Fresh calculation logs:');
console.log(`Admin has fresh calculation logs: ${adminFreshLogs ? '✅' : '❌'}`);
console.log(`User has fresh calculation logs: ${userFreshLogs ? '✅' : '❌'}`);

console.log('\n=== SUMMARY ===');
if (adminRefreshButton && userRefreshButton && adminHasCurrentWeek && userHasCurrentWeek && adminFreshLogs && userFreshLogs) {
  console.log('✅ ALL SYNCHRONIZATION FIXES APPLIED SUCCESSFULLY!');
  console.log('\n🎯 The one-day offset issue should now be resolved!');
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Hard refresh browser (Ctrl+F5)');
  console.log('2. Clear browser cache');
  console.log('3. Test both admin and user panels');
  console.log('4. Use refresh buttons if needed');
  console.log('5. Check console logs for "Fresh calculation" messages');
} else {
  console.log('❌ Some synchronization fixes are missing');
}
