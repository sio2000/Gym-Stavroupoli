// Test 8: Ελέγχω για state management issues
console.log('=== TEST 8: STATE MANAGEMENT CHECK ===');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const adminFile = path.join(__dirname, 'src', 'components', 'admin', 'PilatesScheduleManagement.tsx');

try {
  const content = fs.readFileSync(adminFile, 'utf8');
  
  console.log('Admin file exists:', true);
  
  // Check for useState hooks
  const useStateHooks = content.match(/useState/g);
  console.log('useState hooks found:', useStateHooks ? useStateHooks.length : 0);
  
  // Check for useEffect hooks
  const useEffectHooks = content.match(/useEffect/g);
  console.log('useEffect hooks found:', useEffectHooks ? useEffectHooks.length : 0);
  
  // Check for currentWeek state
  const currentWeekState = content.match(/currentWeek/g);
  console.log('currentWeek references found:', currentWeekState ? currentWeekState.length : 0);
  
  // Check for setCurrentWeek calls
  const setCurrentWeekCalls = content.match(/setCurrentWeek/g);
  console.log('setCurrentWeek calls found:', setCurrentWeekCalls ? setCurrentWeekCalls.length : 0);
  
  // Check for any state initialization
  const stateInit = content.match(/useState\(\(\) => \{([\s\S]*?)\}\)/g);
  if (stateInit) {
    console.log('State initialization patterns found:', stateInit.length);
    stateInit.forEach((init, index) => {
      console.log(`State init ${index + 1}:`, init.substring(0, 100) + '...');
    });
  }
  
  // Check for any state updates
  const stateUpdates = content.match(/set[A-Z]\w*\(/g);
  if (stateUpdates) {
    console.log('State update patterns found:', stateUpdates);
  }
  
  // Check for any dependencies in useEffect
  const useEffectDeps = content.match(/useEffect\([^,]*,\s*\[([^\]]*)\]/g);
  if (useEffectDeps) {
    console.log('useEffect dependencies found:', useEffectDeps);
  }
  
  // Check for any state that might be cached
  const cachedState = content.match(/localStorage|sessionStorage|IndexedDB/g);
  if (cachedState) {
    console.log('Cached state patterns found:', cachedState);
  }
  
  // Check for any state that might be persisted
  const persistedState = content.match(/persist|save|load/g);
  if (persistedState) {
    console.log('Persisted state patterns found:', persistedState);
  }
  
  // Check for any state that might be shared between components
  const sharedState = content.match(/Context|Provider|Consumer/g);
  if (sharedState) {
    console.log('Shared state patterns found:', sharedState);
  }
  
  // Check for any state that might be global
  const globalState = content.match(/global|window|document/g);
  if (globalState) {
    console.log('Global state patterns found:', globalState);
  }
  
  // Check for any state that might be computed
  const computedState = content.match(/useMemo|useCallback/g);
  if (computedState) {
    console.log('Computed state patterns found:', computedState);
  }
  
  // Check for any state that might be derived
  const derivedState = content.match(/useDerived|useDerivedState/g);
  if (derivedState) {
    console.log('Derived state patterns found:', derivedState);
  }
  
  // Check for any state that might be synchronized
  const syncState = content.match(/sync|synchronize|update/g);
  if (syncState) {
    console.log('Sync state patterns found:', syncState);
  }
  
} catch (error) {
  console.log('Error reading admin file:', error.message);
}

// Check for any state management libraries
console.log('\n=== STATE MANAGEMENT LIBRARIES ===');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const dependencies = packageJson.dependencies || {};
const devDependencies = packageJson.devDependencies || {};

const stateLibraries = [
  'redux', 'mobx', 'zustand', 'jotai', 'recoil', 'valtio', 'xstate',
  'react-query', 'swr', 'apollo', 'relay', 'urql'
];

stateLibraries.forEach(lib => {
  if (dependencies[lib] || devDependencies[lib]) {
    console.log(`✅ Found state library: ${lib}`);
  }
});

console.log('\n=== STATE MANAGEMENT CONCLUSION ===');
console.log('If state management is the issue, then:');
console.log('1. State might not be updating properly');
console.log('2. State might be cached somewhere');
console.log('3. State might be shared between components');
console.log('4. State might be persisted in browser storage');
console.log('5. State might be computed incorrectly');
console.log('6. State might be derived from wrong data');
console.log('7. State might be synchronized incorrectly');
