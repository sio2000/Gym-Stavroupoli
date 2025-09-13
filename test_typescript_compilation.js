// Test 11: Ελέγχω για TypeScript compilation issues
console.log('=== TEST 11: TYPESCRIPT COMPILATION CHECK ===');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for TypeScript configuration
const tsConfigFiles = ['tsconfig.json', 'tsconfig.dev.json', 'tsconfig.build.json'];
tsConfigFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    console.log(`\n=== ${file} ===`);
    
    const config = JSON.parse(content);
    console.log('Compiler options:', config.compilerOptions);
    
    // Check for any date-related configuration
    const dateConfig = content.match(/date|Date|time|Time|timezone|Timezone/g);
    if (dateConfig) {
      console.log('Found date-related configuration:', dateConfig);
    }
    
    // Check for any build configuration
    const buildConfig = content.match(/build|Build|output|Output/g);
    if (buildConfig) {
      console.log('Found build configuration:', buildConfig);
    }
    
    // Check for any module resolution
    const moduleConfig = content.match(/module|Module|resolution|Resolution/g);
    if (moduleConfig) {
      console.log('Found module configuration:', moduleConfig);
    }
    
  } catch (error) {
    console.log(`Error reading ${file}:`, error.message);
  }
});

// Check for any TypeScript errors
console.log('\n=== TYPESCRIPT ERRORS CHECK ===');

// Check for any .tsbuildinfo files
const tsbuildinfoFiles = fs.readdirSync(__dirname, { recursive: true })
  .filter(file => typeof file === 'string' && file.endsWith('.tsbuildinfo'));

if (tsbuildinfoFiles.length > 0) {
  console.log('Found TypeScript build info files:', tsbuildinfoFiles);
  
  tsbuildinfoFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const buildInfo = JSON.parse(content);
      console.log(`Build info for ${file}:`, buildInfo);
    } catch (error) {
      console.log(`Error reading ${file}:`, error.message);
    }
  });
} else {
  console.log('No TypeScript build info files found');
}

// Check for any TypeScript declaration files
const dtsFiles = fs.readdirSync(__dirname, { recursive: true })
  .filter(file => typeof file === 'string' && file.endsWith('.d.ts'));

if (dtsFiles.length > 0) {
  console.log('Found TypeScript declaration files:', dtsFiles);
  
  dtsFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      console.log(`Declaration file ${file}:`, content.substring(0, 200) + '...');
    } catch (error) {
      console.log(`Error reading ${file}:`, error.message);
    }
  });
} else {
  console.log('No TypeScript declaration files found');
}

// Check for any TypeScript source maps
const sourceMapFiles = fs.readdirSync(__dirname, { recursive: true })
  .filter(file => typeof file === 'string' && file.endsWith('.map'));

if (sourceMapFiles.length > 0) {
  console.log('Found source map files:', sourceMapFiles);
  
  sourceMapFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const sourceMap = JSON.parse(content);
      console.log(`Source map for ${file}:`, sourceMap);
    } catch (error) {
      console.log(`Error reading ${file}:`, error.message);
    }
  });
} else {
  console.log('No source map files found');
}

// Check for any TypeScript compilation errors
console.log('\n=== TYPESCRIPT COMPILATION ERRORS ===');

// Check for any .ts files with errors
const tsFiles = fs.readdirSync(__dirname, { recursive: true })
  .filter(file => typeof file === 'string' && file.endsWith('.ts') && !file.includes('node_modules'));

tsFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check for any obvious TypeScript errors
    const tsErrors = content.match(/error|Error|ERROR/g);
    if (tsErrors) {
      console.log(`Found potential errors in ${file}:`, tsErrors.length, 'occurrences');
    }
    
    // Check for any type assertions
    const typeAssertions = content.match(/as [A-Z]\w*|as [a-z]\w*|as any|as unknown/g);
    if (typeAssertions) {
      console.log(`Found type assertions in ${file}:`, typeAssertions);
    }
    
    // Check for any any types
    const anyTypes = content.match(/: any|: any\[|: any\]/g);
    if (anyTypes) {
      console.log(`Found any types in ${file}:`, anyTypes);
    }
    
  } catch (error) {
    console.log(`Error reading ${file}:`, error.message);
  }
});

console.log('\n=== TYPESCRIPT COMPILATION CONCLUSION ===');
console.log('If TypeScript compilation is the issue, then:');
console.log('1. TypeScript might be compiling with different options');
console.log('2. TypeScript might be using different type definitions');
console.log('3. TypeScript might be using different module resolution');
console.log('4. TypeScript might be using different build configuration');
console.log('5. TypeScript might be using different source maps');
console.log('6. TypeScript might be using different declaration files');
console.log('7. TypeScript might be using different build info');
