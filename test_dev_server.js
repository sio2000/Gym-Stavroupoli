// Test 10: Ελέγχω για development server issues
console.log('=== TEST 10: DEVELOPMENT SERVER CHECK ===');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for Vite configuration
const viteConfigFiles = ['vite.config.js', 'vite.config.ts', 'vite.config.mjs'];
viteConfigFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    console.log(`Found ${file}:`, content.length, 'characters');
    
    // Check for any caching configuration
    const cacheConfig = content.match(/cache|Cache|persist|Persist/g);
    if (cacheConfig) {
      console.log('Found cache configuration:', cacheConfig);
    }
    
    // Check for any build configuration
    const buildConfig = content.match(/build|Build|output|Output/g);
    if (buildConfig) {
      console.log('Found build configuration:', buildConfig);
    }
    
    // Check for any development configuration
    const devConfig = content.match(/dev|Dev|development|Development/g);
    if (devConfig) {
      console.log('Found development configuration:', devConfig);
    }
    
  } catch (error) {
    // File doesn't exist
  }
});

// Check for package.json scripts
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  console.log('\n=== PACKAGE.JSON SCRIPTS ===');
  console.log('Scripts:', packageJson.scripts);
  
  // Check for any development-specific scripts
  const devScripts = Object.keys(packageJson.scripts).filter(script => 
    script.includes('dev') || script.includes('start') || script.includes('serve')
  );
  if (devScripts.length > 0) {
    console.log('Development scripts:', devScripts);
  }
  
  // Check for any build scripts
  const buildScripts = Object.keys(packageJson.scripts).filter(script => 
    script.includes('build') || script.includes('compile') || script.includes('bundle')
  );
  if (buildScripts.length > 0) {
    console.log('Build scripts:', buildScripts);
  }
  
} catch (error) {
  console.log('Error reading package.json:', error.message);
}

// Check for any environment-specific files
const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
envFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    console.log(`\n=== ${file} ===`);
    console.log('Content:', content);
  } catch (error) {
    // File doesn't exist
  }
});

// Check for any development-specific configuration
const devConfigFiles = [
  'tsconfig.json',
  'tsconfig.dev.json',
  'jsconfig.json',
  'babel.config.js',
  'babel.config.json',
  'webpack.config.js',
  'rollup.config.js'
];

devConfigFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    console.log(`\n=== ${file} ===`);
    console.log('Content:', content.substring(0, 500) + '...');
  } catch (error) {
    // File doesn't exist
  }
});

// Check for any development-specific directories
const devDirs = ['.vite', 'node_modules/.vite', 'dist', 'build', '.next', 'out'];
devDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  
  try {
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      console.log(`\n=== ${dir} ===`);
      
      // Check for any admin-related files
      const files = fs.readdirSync(fullPath, { recursive: true });
      const adminFiles = files.filter(file => 
        typeof file === 'string' && 
        (file.includes('admin') || file.includes('Admin') || file.includes('PilatesSchedule'))
      );
      
      if (adminFiles.length > 0) {
        console.log('Admin files:', adminFiles);
      }
      
      // Check for any date-related files
      const dateFiles = files.filter(file => 
        typeof file === 'string' && 
        (file.includes('date') || file.includes('Date') || file.includes('time') || file.includes('Time'))
      );
      
      if (dateFiles.length > 0) {
        console.log('Date files:', dateFiles);
      }
      
    }
  } catch (error) {
    // Directory doesn't exist
  }
});

console.log('\n=== DEVELOPMENT SERVER CONCLUSION ===');
console.log('If development server is the issue, then:');
console.log('1. The server might be caching old code');
console.log('2. The server might be using old build files');
console.log('3. The server might be running in a different mode');
console.log('4. The server might be using different environment variables');
console.log('5. The server might be using different configuration');
console.log('6. The server might be using different dependencies');
console.log('7. The server might be using different TypeScript configuration');
