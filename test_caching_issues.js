// Test 6: Ελέγχω για caching issues
console.log('=== TEST 6: CACHING ISSUES CHECK ===');

// Check if there are any build files that might be cached
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for build directories
const buildDirs = ['dist', 'build', '.next', 'out'];
buildDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  try {
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      console.log(`✅ Found build directory: ${dir}`);
      
      // Check for admin-related files in build
      const files = fs.readdirSync(fullPath, { recursive: true });
      const adminFiles = files.filter(file => 
        typeof file === 'string' && 
        (file.includes('admin') || file.includes('Admin') || file.includes('PilatesSchedule'))
      );
      
      if (adminFiles.length > 0) {
        console.log(`  Admin files in ${dir}:`, adminFiles);
      }
    }
  } catch (error) {
    // Directory doesn't exist
  }
});

// Check for cache directories
const cacheDirs = ['.cache', 'node_modules/.cache', '.vite', '.parcel-cache'];
cacheDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  try {
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      console.log(`✅ Found cache directory: ${dir}`);
    }
  } catch (error) {
    // Directory doesn't exist
  }
});

// Check for any .gitignore or similar files that might affect caching
const ignoreFiles = ['.gitignore', '.dockerignore', '.eslintignore'];
ignoreFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    console.log(`\n=== ${file} ===`);
    console.log(content);
  } catch (error) {
    // File doesn't exist
  }
});

// Check for any Vite-specific cache
const viteCacheDir = path.join(__dirname, 'node_modules', '.vite');
try {
  const stats = fs.statSync(viteCacheDir);
  if (stats.isDirectory()) {
    console.log('\n✅ Found Vite cache directory');
    
    // Check cache contents
    const cacheFiles = fs.readdirSync(viteCacheDir, { recursive: true });
    console.log('Cache files:', cacheFiles.slice(0, 10)); // Show first 10 files
  }
} catch (error) {
  console.log('No Vite cache directory found');
}

// Check for any service worker or PWA files
const pwaFiles = ['sw.js', 'service-worker.js', 'manifest.json', 'pwa.js'];
pwaFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  try {
    const stats = fs.statSync(fullPath);
    if (stats.isFile()) {
      console.log(`✅ Found PWA file: ${file}`);
    }
  } catch (error) {
    // File doesn't exist
  }
});

// Check for any browser storage simulation
console.log('\n=== BROWSER STORAGE SIMULATION ===');
console.log('In a real browser, check:');
console.log('1. localStorage.getItem("currentWeek")');
console.log('2. sessionStorage.getItem("currentWeek")');
console.log('3. IndexedDB for any cached data');
console.log('4. Service Worker cache');

// Check for any environment-specific configurations
console.log('\n=== ENVIRONMENT CONFIGURATION ===');
const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
envFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    console.log(`\n=== ${file} ===`);
    console.log(content);
  } catch (error) {
    // File doesn't exist
  }
});

console.log('\n=== CACHING SOLUTIONS ===');
console.log('If caching is the issue, try:');
console.log('1. Clear browser cache (Ctrl+Shift+Delete)');
console.log('2. Hard refresh (Ctrl+F5)');
console.log('3. Clear localStorage and sessionStorage');
console.log('4. Restart development server');
console.log('5. Delete node_modules/.vite directory');
console.log('6. Clear browser data for localhost:5173');
console.log('7. Try incognito/private browsing mode');
