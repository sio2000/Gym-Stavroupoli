// Test 5: Ελέγχω για hardcoded dates
console.log('=== TEST 5: HARDCODED DATES CHECK ===');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check all relevant files for hardcoded dates
const filesToCheck = [
  'src/components/admin/PilatesScheduleManagement.tsx',
  'src/pages/PilatesCalendar.tsx',
  'src/utils/pilatesScheduleApi.ts',
  'src/contexts/AuthContext.tsx'
];

filesToCheck.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Look for hardcoded dates
    const hardcodedDates = content.match(/2025-09-\d{2}/g);
    const hardcodedTimes = content.match(/\d{2}:\d{2}:\d{2}/g);
    const hardcodedTimestamps = content.match(/\d{13}/g);
    
    console.log(`\n=== ${filePath} ===`);
    
    if (hardcodedDates) {
      console.log('❌ Found hardcoded dates:', hardcodedDates);
    } else {
      console.log('✅ No hardcoded dates found');
    }
    
    if (hardcodedTimes) {
      console.log('Found hardcoded times:', hardcodedTimes);
    }
    
    if (hardcodedTimestamps) {
      console.log('Found hardcoded timestamps:', hardcodedTimestamps);
    }
    
    // Look for specific problematic patterns
    const problematicPatterns = [
      /2025-09-15/g,
      /2025-09-16/g,
      /2025-09-17/g,
      /2025-09-18/g,
      /2025-09-19/g,
      /2025-09-20/g,
      /2025-09-21/g,
      /2025-09-22/g,
      /2025-09-23/g,
      /2025-09-24/g
    ];
    
    problematicPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`❌ Found problematic date pattern ${pattern}:`, matches);
      }
    });
    
    // Look for any date manipulation that might be causing issues
    const dateManipulation = content.match(/new Date\([^)]*\)/g);
    if (dateManipulation) {
      console.log('Found date creation patterns:', dateManipulation);
    }
    
  } catch (error) {
    console.log(`Error reading ${filePath}:`, error.message);
  }
});

// Check if there are any environment variables or config files
console.log('\n=== ENVIRONMENT CHECK ===');

const envFiles = ['.env', '.env.local', '.env.development', 'config.js', 'config.ts'];
envFiles.forEach(envFile => {
  const fullPath = path.join(__dirname, envFile);
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    console.log(`Found ${envFile}:`, content);
  } catch (error) {
    // File doesn't exist, that's fine
  }
});

// Check package.json for any date-related scripts
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  console.log('\n=== PACKAGE.JSON CHECK ===');
  console.log('Scripts:', packageJson.scripts);
  console.log('Dependencies:', Object.keys(packageJson.dependencies || {}));
} catch (error) {
  console.log('Error reading package.json:', error.message);
}

console.log('\n=== CONCLUSION ===');
console.log('If hardcoded dates are found, they need to be removed.');
console.log('If no hardcoded dates are found, the issue might be:');
console.log('1. Caching in the browser');
console.log('2. State not updating properly');
console.log('3. A different calculation logic somewhere else');
console.log('4. The admin panel is running old code');
