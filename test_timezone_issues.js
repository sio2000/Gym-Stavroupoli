// Test 4: Ελέγχω για timezone issues
console.log('=== TEST 4: TIMEZONE ISSUES CHECK ===');

// Simulate the exact admin logic
function getAdminCurrentWeek() {
  const today = new Date();
  // Find Monday of current week
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  // Adjust for Sunday (0) to get previous Monday
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(today.getDate() + daysToMonday);
  monday.setHours(0, 0, 0, 0);
  console.log('Admin: Initializing currentWeek with Monday of current week:', monday);
  return monday;
}

// Test with different scenarios
console.log('Current date:', new Date().toISOString());
console.log('Current date (local):', new Date().toString());

const adminWeek = getAdminCurrentWeek();
console.log('Admin week start:', adminWeek.toISOString());
console.log('Admin week start (local):', adminWeek.toString());

// Test what happens if we're in different timezones
console.log('\n=== TIMEZONE SIMULATION ===');

// Test 1: UTC time
const utcNow = new Date();
console.log('UTC now:', utcNow.toISOString());
const utcDayOfWeek = utcNow.getDay();
const utcMonday = new Date(utcNow);
const utcDaysToMonday = utcDayOfWeek === 0 ? -6 : 1 - utcDayOfWeek;
utcMonday.setDate(utcNow.getDate() + utcDaysToMonday);
utcMonday.setHours(0, 0, 0, 0);
console.log('UTC Monday:', utcMonday.toISOString().split('T')[0]);

// Test 2: Pacific time (UTC-7)
const pacificNow = new Date(utcNow.getTime() - 7 * 60 * 60 * 1000);
console.log('Pacific now:', pacificNow.toISOString());
const pacificDayOfWeek = pacificNow.getDay();
const pacificMonday = new Date(pacificNow);
const pacificDaysToMonday = pacificDayOfWeek === 0 ? -6 : 1 - pacificDayOfWeek;
pacificMonday.setDate(pacificNow.getDate() + pacificDaysToMonday);
pacificMonday.setHours(0, 0, 0, 0);
console.log('Pacific Monday:', pacificMonday.toISOString().split('T')[0]);

// Test 3: What if we're in a different timezone?
const differentTzNow = new Date(utcNow.getTime() + 3 * 60 * 60 * 1000); // UTC+3
console.log('Different TZ now:', differentTzNow.toISOString());
const differentTzDayOfWeek = differentTzNow.getDay();
const differentTzMonday = new Date(differentTzNow);
const differentTzDaysToMonday = differentTzDayOfWeek === 0 ? -6 : 1 - differentTzDayOfWeek;
differentTzMonday.setDate(differentTzNow.getDate() + differentTzDaysToMonday);
differentTzMonday.setHours(0, 0, 0, 0);
console.log('Different TZ Monday:', differentTzMonday.toISOString().split('T')[0]);

// Test 4: What if the admin is running in a different timezone?
console.log('\n=== ADMIN TIMEZONE SIMULATION ===');
console.log('What if admin is running in UTC+3?');

const adminTzNow = new Date(utcNow.getTime() + 3 * 60 * 60 * 1000);
console.log('Admin TZ now:', adminTzNow.toISOString());
const adminTzDayOfWeek = adminTzNow.getDay();
const adminTzMonday = new Date(adminTzNow);
const adminTzDaysToMonday = adminTzDayOfWeek === 0 ? -6 : 1 - adminTzDayOfWeek;
adminTzMonday.setDate(adminTzNow.getDate() + adminTzDaysToMonday);
adminTzMonday.setHours(0, 0, 0, 0);
console.log('Admin TZ Monday:', adminTzMonday.toISOString().split('T')[0]);

// Check if this matches the admin logs
console.log('\n=== COMPARISON WITH ADMIN LOGS ===');
console.log('Admin logs show: 2025-09-15');
console.log('UTC Monday:', utcMonday.toISOString().split('T')[0]);
console.log('Pacific Monday:', pacificMonday.toISOString().split('T')[0]);
console.log('Different TZ Monday:', differentTzMonday.toISOString().split('T')[0]);
console.log('Admin TZ Monday:', adminTzMonday.toISOString().split('T')[0]);

if (utcMonday.toISOString().split('T')[0] === '2025-09-15') {
  console.log('✅ Admin is using UTC time');
} else if (pacificMonday.toISOString().split('T')[0] === '2025-09-15') {
  console.log('✅ Admin is using Pacific time');
} else if (differentTzMonday.toISOString().split('T')[0] === '2025-09-15') {
  console.log('✅ Admin is using UTC+3 time');
} else if (adminTzMonday.toISOString().split('T')[0] === '2025-09-15') {
  console.log('✅ Admin is using admin TZ time');
} else {
  console.log('❌ None of the timezone calculations match admin logs');
  console.log('This suggests there might be a different issue');
}

// Test 5: What if there's a date calculation error?
console.log('\n=== DATE CALCULATION ERROR TEST ===');
const today = new Date();
console.log('Today:', today.toISOString());
console.log('Today day of week:', today.getDay());

// What if we're calculating from a different date?
const differentDate = new Date('2025-09-15T00:00:00.000Z');
console.log('Different date:', differentDate.toISOString());
console.log('Different date day of week:', differentDate.getDay());

const differentDayOfWeek = differentDate.getDay();
const differentMonday = new Date(differentDate);
const differentDaysToMonday = differentDayOfWeek === 0 ? -6 : 1 - differentDayOfWeek;
differentMonday.setDate(differentDate.getDate() + differentDaysToMonday);
differentMonday.setHours(0, 0, 0, 0);
console.log('Different Monday:', differentMonday.toISOString().split('T')[0]);

console.log('\n=== CONCLUSION ===');
console.log('If none of the timezone calculations match, then:');
console.log('1. There might be a hardcoded date somewhere');
console.log('2. There might be a different calculation logic');
console.log('3. There might be a caching issue');
console.log('4. The admin might be running in a different timezone than expected');
