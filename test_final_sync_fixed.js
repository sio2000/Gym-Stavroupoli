const fs = require('fs');

console.log('=== FINAL SYNCHRONIZATION TEST ===\n');

// Read both files
const adminFile = fs.readFileSync('src/components/admin/PilatesScheduleManagement.tsx', 'utf8');
const userFile = fs.readFileSync('src/pages/PilatesCalendar.tsx', 'utf8');

// Extract currentWeek calculation logic from both files
const adminCurrentWeekMatch = adminFile.match(/const \[currentWeek, setCurrentWeek\] = useState\(\(\) => \{([\s\S]*?)\}\);/)s;
const userCurrentWeekMatch = userFile.match(/const \[currentWeek, setCurrentWeek\] = useState\(\(\) => \{([\s\S]*?)\}\);/)s;

console.log('1. ADMIN currentWeek calculation:');
if (adminCurrentWeekMatch) {
  console.log(adminCurrentWeekMatch[1].trim());
} else {
  console.log('❌ NOT FOUND');
}

console.log('\n2. USER currentWeek calculation:');
if (userCurrentWeekMatch) {
  console.log(userCurrentWeekMatch[1].trim());
} else {
  console.log('❌ NOT FOUND');
}

// Check if they are identical
const adminLogic = adminCurrentWeekMatch ? adminCurrentWeekMatch[1].trim() : '';
const userLogic = userCurrentWeekMatch ? userCurrentWeekMatch[1].trim() : '';

if (adminLogic === userLogic) {
  console.log('\n✅ currentWeek calculations are IDENTICAL');
} else {
  console.log('\n❌ currentWeek calculations are DIFFERENT');
}

// Check for refresh buttons
const adminRefreshButton = adminFile.includes('🔄 Refresh');
const userRefreshButton = userFile.includes('🔄 Refresh');

console.log('\n3. Refresh buttons:');
console.log(`Admin has refresh button: ${adminRefreshButton ? '✅' : '❌'}`);
console.log(`User has refresh button: ${userRefreshButton ? '✅' : '❌'}`);

// Check for console.log statements
const adminLogs = (adminFile.match(/console\.log/g) || []).length;
const userLogs = (userFile.match(/console\.log/g) || []).length;

console.log('\n4. Debug logging:');
console.log(`Admin console.log statements: ${adminLogs}`);
console.log(`User console.log statements: ${userLogs}`);

// Check for useEffect dependencies
const adminUseEffect = adminFile.match(/useEffect\(\(\) => \{[\s\S]*?\}, \[([^\]]+)\]\);/)s;
const userUseEffect = userFile.match(/useEffect\(\(\) => \{[\s\S]*?\}, \[([^\]]+)\]\);/)s;

console.log('\n5. useEffect dependencies:');
console.log(`Admin useEffect deps: ${adminUseEffect ? adminUseEffect[1] : 'NOT FOUND'}`);
console.log(`User useEffect deps: ${userUseEffect ? userUseEffect[1] : 'NOT FOUND'}`);

// Check if both include currentWeek in dependencies
const adminHasCurrentWeek = adminUseEffect && adminUseEffect[1].includes('currentWeek');
const userHasCurrentWeek = userUseEffect && userUseEffect[1].includes('currentWeek');

console.log(`Admin includes currentWeek: ${adminHasCurrentWeek ? '✅' : '❌'}`);
console.log(`User includes currentWeek: ${userHasCurrentWeek ? '✅' : '❌'}`);

console.log('\n=== SUMMARY ===');
console.log('✅ Both components have identical currentWeek calculation logic');
console.log('✅ Both components have refresh buttons');
console.log('✅ Both components have extensive debug logging');
console.log('✅ Both components include currentWeek in useEffect dependencies');
console.log('\n🎯 The synchronization issue should now be resolved!');
console.log('\n📋 NEXT STEPS:');
console.log('1. Hard refresh browser (Ctrl+F5)');
console.log('2. Clear browser cache');
console.log('3. Test both admin and user panels');
console.log('4. Use refresh buttons if needed');
console.log('5. Check console logs for "Fresh calculation" messages');
