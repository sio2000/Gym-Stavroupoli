#!/usr/bin/env node
/**
 * COMPREHENSIVE TIME-TRAVEL TEST RUNNER
 * 
 * Executes the full subscription lifecycle audit test suite
 * Run: node run-time-travel-tests.js
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTests() {
  console.log('='.repeat(70));
  console.log('RUNNING COMPREHENSIVE TIME-TRAVEL TEST SUITE');
  console.log('='.repeat(70));
  console.log();
  console.log('📋 Test Suite: Subscription Lifecycle Audit');
  console.log('🧪 Scenarios: 8 critical phases across subscription lifecycle');
  console.log('🤖 Bot Users: 20 users with varying subscription types');
  console.log('📊 Timeline: Jan 31 - Feb 10, 2026\n');
  
  return new Promise((resolve) => {
    const testProcess = spawn('npx', [
      'vitest',
      'run',
      'tests/subscription-audit/subscription-lifecycle.test.ts',
      '--reporter=verbose',
      '--reporter=junit',
      '--outputFile=test-results/time-travel-results.xml'
    ], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });
    
    testProcess.on('close', (code) => {
      console.log();
      console.log('='.repeat(70));
      
      if (code === 0) {
        console.log('✅ ALL TIME-TRAVEL TESTS PASSED');
        console.log('='.repeat(70));
        console.log();
        console.log('🎉 System is SAFE for production deployment!\n');
        resolve(true);
      } else {
        console.log('❌ SOME TESTS FAILED');
        console.log('='.repeat(70));
        console.log();
        console.log('⚠️  Please review failures and fix before deployment.\n');
        resolve(false);
      }
    });
  });
}

// Run tests
const success = await runTests();
process.exit(success ? 0 : 1);
