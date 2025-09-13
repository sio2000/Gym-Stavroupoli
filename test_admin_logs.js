// Test 1: Αναλύω τα admin logs
console.log('=== TEST 1: ADMIN LOGS ANALYSIS ===');

// Από τα logs βλέπω:
console.log('Admin logs show:');
console.log('- Admin: Day 0: 2025-09-15');
console.log('- Admin: Day 1: 2025-09-16');
console.log('- Admin: Day 2: 2025-09-17');
console.log('- Admin: Day 3: 2025-09-18');
console.log('- Admin: Day 4: 2025-09-19');
console.log('- Admin: Day 5: 2025-09-20');
console.log('- Admin: Day 6: 2025-09-21');
console.log('- Admin: Day 7: 2025-09-22');
console.log('- Admin: Day 8: 2025-09-23');
console.log('- Admin: Day 9: 2025-09-24');

console.log('\nThis means admin currentWeek is: 2025-09-15 (Monday)');
console.log('Admin shows: 15-24 Sep (10 days)');

// Ας υπολογίσω τι θα έπρεπε να είναι
const today = new Date();
console.log('\nCurrent date:', today.toISOString());
console.log('Current day of week:', today.getDay());

// Calculate what Monday should be
const dayOfWeek = today.getDay();
const monday = new Date(today);
const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
monday.setDate(today.getDate() + daysToMonday);
monday.setHours(0, 0, 0, 0);

console.log('Calculated Monday:', monday.toISOString().split('T')[0]);
console.log('Admin shows Monday:', '2025-09-15');

if (monday.toISOString().split('T')[0] === '2025-09-15') {
  console.log('✅ Admin calculation is CORRECT');
} else {
  console.log('❌ Admin calculation is WRONG');
  console.log('Expected:', monday.toISOString().split('T')[0]);
  console.log('Got:', '2025-09-15');
}

// Check if there's a timezone issue
console.log('\n=== TIMEZONE CHECK ===');
console.log('Current time (UTC):', today.toISOString());
console.log('Current time (local):', today.toString());

// Test with different timezones
const utcMonday = new Date(today);
const utcDayOfWeek = utcMonday.getDay();
const utcDaysToMonday = utcDayOfWeek === 0 ? -6 : 1 - utcDayOfWeek;
utcMonday.setDate(today.getDate() + utcDaysToMonday);
utcMonday.setHours(0, 0, 0, 0);

const pacificToday = new Date(today.getTime() - 7 * 60 * 60 * 1000);
const pacificDayOfWeek = pacificToday.getDay();
const pacificMonday = new Date(pacificToday);
const pacificDaysToMonday = pacificDayOfWeek === 0 ? -6 : 1 - pacificDayOfWeek;
pacificMonday.setDate(pacificToday.getDate() + pacificDaysToMonday);
pacificMonday.setHours(0, 0, 0, 0);

console.log('UTC Monday:', utcMonday.toISOString().split('T')[0]);
console.log('Pacific Monday:', pacificMonday.toISOString().split('T')[0]);
console.log('Admin Monday:', '2025-09-15');

console.log('\n=== CONCLUSION ===');
if (utcMonday.toISOString().split('T')[0] === '2025-09-15') {
  console.log('✅ Admin is using UTC time');
} else if (pacificMonday.toISOString().split('T')[0] === '2025-09-15') {
  console.log('✅ Admin is using Pacific time');
} else {
  console.log('❌ Admin is using neither UTC nor Pacific time');
  console.log('This suggests there might be a different timezone or calculation issue');
}
