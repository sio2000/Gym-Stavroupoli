// Test 3: Ελέγχω το admin panel code
console.log('=== TEST 3: ADMIN PANEL CODE CHECK ===');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const adminFile = path.join(__dirname, 'src', 'components', 'admin', 'PilatesScheduleManagement.tsx');

try {
  const content = fs.readFileSync(adminFile, 'utf8');
  
  console.log('Admin file exists:', true);
  
  // Check for the currentWeek initialization
  const currentWeekMatch = content.match(/const \[currentWeek, setCurrentWeek\] = useState\(\(\) => \{([\s\S]*?)\}\);/)s;
  
  if (currentWeekMatch) {
    console.log('✅ Found currentWeek initialization');
    console.log('CurrentWeek code:');
    console.log(currentWeekMatch[1]);
  } else {
    console.log('❌ Could not find currentWeek initialization');
  }
  
  // Check for getWeekDates function
  const getWeekDatesMatch = content.match(/const getWeekDates = \(\): string\[\] => \{([\s\S]*?)\};/)s;
  
  if (getWeekDatesMatch) {
    console.log('\n✅ Found getWeekDates function');
    console.log('GetWeekDates code:');
    console.log(getWeekDatesMatch[1]);
  } else {
    console.log('❌ Could not find getWeekDates function');
  }
  
  // Check for any hardcoded dates
  const hardcodedDates = content.match(/2025-09-\d{2}/g);
  if (hardcodedDates) {
    console.log('\n❌ Found hardcoded dates:', hardcodedDates);
  } else {
    console.log('\n✅ No hardcoded dates found');
  }
  
  // Check for any timezone-related code
  const timezoneCode = content.match(/GMT|UTC|Pacific|timezone/gi);
  if (timezoneCode) {
    console.log('\nFound timezone-related code:', timezoneCode);
  } else {
    console.log('\nNo timezone-related code found');
  }
  
  // Check for any date manipulation
  const dateManipulation = content.match(/setDate|setHours|setTime|getTime/gi);
  if (dateManipulation) {
    console.log('\nFound date manipulation methods:', dateManipulation);
  }
  
} catch (error) {
  console.error('Error reading admin file:', error.message);
}
