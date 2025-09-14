// Debug admin calculation
console.log('=== DEBUG ADMIN CALCULATION ===');

// Simulate the exact admin logic
const today = new Date();
console.log('Today:', today.toISOString());
console.log('Today (local):', today.toString());

// Find Monday of current week
const dayOfWeek = today.getDay();
console.log('Day of week:', dayOfWeek);

const monday = new Date(today);
// Adjust for Sunday (0) to get previous Monday
const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
console.log('Days to Monday:', daysToMonday);

monday.setDate(today.getDate() + daysToMonday);
monday.setHours(0, 0, 0, 0);

console.log('Calculated Monday:', monday.toISOString());
console.log('Calculated Monday (local):', monday.toString());

// Check what the admin logs show
console.log('\n=== ADMIN LOGS COMPARISON ===');
console.log('Admin logs show: 2025-09-15');
console.log('Calculated Monday:', monday.toISOString().split('T')[0]);

if (monday.toISOString().split('T')[0] === '2025-09-15') {
  console.log('✅ Admin calculation matches logs');
} else {
  console.log('❌ Admin calculation does NOT match logs');
  console.log('Expected: 2025-09-15');
  console.log('Got:', monday.toISOString().split('T')[0]);
}

// Check what the correct Monday should be
console.log('\n=== CORRECT CALCULATION ===');
const correctToday = new Date('2025-09-12T12:00:00.000Z'); // Current date from logs
console.log('Correct today:', correctToday.toISOString());
console.log('Correct day of week:', correctToday.getDay());

const correctMonday = new Date(correctToday);
const correctDaysToMonday = correctToday.getDay() === 0 ? -6 : 1 - correctToday.getDay();
console.log('Correct days to Monday:', correctDaysToMonday);

correctMonday.setDate(correctToday.getDate() + correctDaysToMonday);
correctMonday.setHours(0, 0, 0, 0);

console.log('Correct Monday:', correctMonday.toISOString().split('T')[0]);

// The issue: Admin is calculating from a different date!
console.log('\n=== THE PROBLEM ===');
console.log('Admin is calculating from:', today.toISOString());
console.log('But should calculate from:', correctToday.toISOString());
console.log('Difference in days:', Math.floor((today - correctToday) / (1000 * 60 * 60 * 24)));
