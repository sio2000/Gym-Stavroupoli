// Test 9: Ελέγχω για browser storage
console.log('=== TEST 9: BROWSER STORAGE CHECK ===');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check all files for localStorage usage
const filesToCheck = [
  'src/components/admin/PilatesScheduleManagement.tsx',
  'src/pages/PilatesCalendar.tsx',
  'src/contexts/AuthContext.tsx',
  'src/utils/pilatesScheduleApi.ts'
];

filesToCheck.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    console.log(`\n=== ${filePath} ===`);
    
    // Check for localStorage usage
    const localStorageUsage = content.match(/localStorage/g);
    if (localStorageUsage) {
      console.log('❌ Found localStorage usage:', localStorageUsage.length, 'occurrences');
      
      // Check for specific localStorage keys
      const localStorageKeys = content.match(/localStorage\.(getItem|setItem|removeItem)\(['"]([^'"]+)['"]/g);
      if (localStorageKeys) {
        console.log('localStorage keys:', localStorageKeys);
      }
    } else {
      console.log('✅ No localStorage usage');
    }
    
    // Check for sessionStorage usage
    const sessionStorageUsage = content.match(/sessionStorage/g);
    if (sessionStorageUsage) {
      console.log('❌ Found sessionStorage usage:', sessionStorageUsage.length, 'occurrences');
      
      // Check for specific sessionStorage keys
      const sessionStorageKeys = content.match(/sessionStorage\.(getItem|setItem|removeItem)\(['"]([^'"]+)['"]/g);
      if (sessionStorageKeys) {
        console.log('sessionStorage keys:', sessionStorageKeys);
      }
    } else {
      console.log('✅ No sessionStorage usage');
    }
    
    // Check for IndexedDB usage
    const indexedDBUsage = content.match(/indexedDB|IndexedDB/g);
    if (indexedDBUsage) {
      console.log('❌ Found IndexedDB usage:', indexedDBUsage.length, 'occurrences');
    } else {
      console.log('✅ No IndexedDB usage');
    }
    
    // Check for any storage-related patterns
    const storagePatterns = content.match(/storage|Storage|persist|Persist/g);
    if (storagePatterns) {
      console.log('Found storage patterns:', storagePatterns);
    }
    
    // Check for any caching patterns
    const cachePatterns = content.match(/cache|Cache|memo|Memo/g);
    if (cachePatterns) {
      console.log('Found cache patterns:', cachePatterns);
    }
    
    // Check for any state persistence
    const persistencePatterns = content.match(/persist|Persist|save|Save|load|Load/g);
    if (persistencePatterns) {
      console.log('Found persistence patterns:', persistencePatterns);
    }
    
  } catch (error) {
    console.log(`Error reading ${filePath}:`, error.message);
  }
});

// Check for any global state management
console.log('\n=== GLOBAL STATE CHECK ===');

const globalStateFiles = [
  'src/contexts/AuthContext.tsx',
  'src/contexts/AppContext.tsx',
  'src/contexts/UserContext.tsx'
];

globalStateFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    console.log(`\n=== ${filePath} ===`);
    
    // Check for Context usage
    const contextUsage = content.match(/Context|Provider|Consumer/g);
    if (contextUsage) {
      console.log('Found Context usage:', contextUsage.length, 'occurrences');
    }
    
    // Check for any state that might be shared
    const sharedState = content.match(/useState|useReducer|useContext/g);
    if (sharedState) {
      console.log('Found shared state hooks:', sharedState.length, 'occurrences');
    }
    
    // Check for any state that might be persisted
    const persistedState = content.match(/localStorage|sessionStorage|persist/g);
    if (persistedState) {
      console.log('Found persisted state:', persistedState.length, 'occurrences');
    }
    
  } catch (error) {
    console.log(`Error reading ${filePath}:`, error.message);
  }
});

// Check for any service worker or PWA files
console.log('\n=== SERVICE WORKER CHECK ===');

const swFiles = ['sw.js', 'service-worker.js', 'pwa.js', 'manifest.json'];
swFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    console.log(`Found ${file}:`, content.length, 'characters');
  } catch (error) {
    // File doesn't exist
  }
});

console.log('\n=== BROWSER STORAGE CONCLUSION ===');
console.log('If browser storage is the issue, then:');
console.log('1. localStorage might be caching old data');
console.log('2. sessionStorage might be persisting state');
console.log('3. IndexedDB might be storing cached data');
console.log('4. Service Worker might be caching responses');
console.log('5. Global state might be shared between components');
console.log('6. State might be persisted across page reloads');
console.log('7. State might be synchronized incorrectly');
