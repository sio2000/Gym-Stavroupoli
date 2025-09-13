// Test 7: Ελέγχω το build file
console.log('=== TEST 7: BUILD FILE CHECK ===');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildFile = path.join(__dirname, 'dist', 'assets', 'AdminPanel-Tm4_gXSd.js');

try {
  const content = fs.readFileSync(buildFile, 'utf8');
  
  console.log('Build file exists:', true);
  console.log('Build file size:', content.length, 'characters');
  
  // Check for hardcoded dates in build
  const hardcodedDates = content.match(/2025-09-\d{2}/g);
  if (hardcodedDates) {
    console.log('❌ Found hardcoded dates in build:', hardcodedDates);
  } else {
    console.log('✅ No hardcoded dates in build');
  }
  
  // Check for specific problematic dates
  const problematicDates = ['2025-09-15', '2025-09-16', '2025-09-17', '2025-09-18', '2025-09-19'];
  problematicDates.forEach(date => {
    if (content.includes(date)) {
      console.log(`❌ Found problematic date ${date} in build`);
    }
  });
  
  // Check for any date calculation logic
  const dateLogic = content.match(/getDay|setDate|setHours|toISOString/g);
  if (dateLogic) {
    console.log('Found date logic in build:', dateLogic);
  }
  
  // Check for any timezone-related code
  const timezoneCode = content.match(/GMT|UTC|Pacific|timezone/gi);
  if (timezoneCode) {
    console.log('Found timezone code in build:', timezoneCode);
  }
  
  // Check for any console.log statements
  const consoleLogs = content.match(/console\.log/g);
  if (consoleLogs) {
    console.log('Found console.log statements in build:', consoleLogs.length);
  }
  
  // Check for any admin-specific code
  const adminCode = content.match(/Admin|admin|PilatesSchedule/g);
  if (adminCode) {
    console.log('Found admin code in build:', adminCode.length, 'occurrences');
  }
  
  // Check for any date-related constants
  const dateConstants = content.match(/\d{4}-\d{2}-\d{2}/g);
  if (dateConstants) {
    console.log('Found date constants in build:', dateConstants.slice(0, 10)); // Show first 10
  }
  
} catch (error) {
  console.log('Error reading build file:', error.message);
}

// Check if there are other build files
const distDir = path.join(__dirname, 'dist');
try {
  const files = fs.readdirSync(distDir, { recursive: true });
  const jsFiles = files.filter(file => 
    typeof file === 'string' && file.endsWith('.js')
  );
  
  console.log('\n=== ALL BUILD FILES ===');
  console.log('JS files in dist:', jsFiles);
  
  // Check each JS file for date-related content
  jsFiles.forEach(file => {
    const fullPath = path.join(distDir, file);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const hasDates = content.match(/2025-09-\d{2}/g);
      if (hasDates) {
        console.log(`File ${file} has dates:`, hasDates);
      }
    } catch (error) {
      // File might be binary or unreadable
    }
  });
  
} catch (error) {
  console.log('Error reading dist directory:', error.message);
}

console.log('\n=== BUILD FILE CONCLUSION ===');
console.log('If the build file contains hardcoded dates, then:');
console.log('1. The build needs to be regenerated');
console.log('2. The source code might have been cached during build');
console.log('3. There might be a build-time issue');
console.log('4. The admin panel is using the old build file');
