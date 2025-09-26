#!/usr/bin/env node

/**
 * Performance Test Script for Admin Panel
 * Tests the loading speed of different tabs
 */

import https from 'https';
import http from 'http';
import { performance } from 'perf_hooks';

// Configuration
const BASE_URL = 'http://localhost:5173';
const ADMIN_ENDPOINTS = [
  '/admin/users',
];

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: 'Admin Panel Load',
    endpoint: '/admin/users',
    expectedMaxTime: 2000, // 2 seconds
  }
];

// Performance measurement
async function measurePerformance(url) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        resolve({
          statusCode: res.statusCode,
          loadTime: Math.round(loadTime),
          contentLength: data.length,
          headers: res.headers
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Run performance tests
async function runPerformanceTests() {
  console.log('🚀 Starting Admin Panel Performance Tests...\n');
  
  const results = [];
  
  for (const scenario of TEST_SCENARIOS) {
    console.log(`📊 Testing: ${scenario.name}`);
    console.log(`   URL: ${BASE_URL}${scenario.endpoint}`);
    
    try {
      const result = await measurePerformance(`${BASE_URL}${scenario.endpoint}`);
      
      const passed = result.loadTime <= scenario.expectedMaxTime;
      const status = passed ? '✅ PASS' : '❌ FAIL';
      
      console.log(`   Status: ${status}`);
      console.log(`   Load Time: ${result.loadTime}ms (Expected: ≤${scenario.expectedMaxTime}ms)`);
      console.log(`   HTTP Status: ${result.statusCode}`);
      console.log(`   Content Length: ${result.contentLength} bytes`);
      
      results.push({
        scenario: scenario.name,
        passed,
        loadTime: result.loadTime,
        expectedTime: scenario.expectedMaxTime,
        statusCode: result.statusCode,
        contentLength: result.contentLength
      });
      
    } catch (error) {
      console.log(`   Status: ❌ ERROR`);
      console.log(`   Error: ${error.message}`);
      
      results.push({
        scenario: scenario.name,
        passed: false,
        error: error.message
      });
    }
    
    console.log('');
  }
  
  // Summary
  console.log('📈 Performance Test Summary:');
  console.log('============================');
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  console.log('\n📊 Detailed Results:');
  results.forEach(result => {
    if (result.error) {
      console.log(`   ${result.scenario}: ERROR - ${result.error}`);
    } else {
      const status = result.passed ? '✅' : '❌';
      console.log(`   ${result.scenario}: ${status} ${result.loadTime}ms (≤${result.expectedTime}ms)`);
    }
  });
  
  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');
  if (passedTests === totalTests) {
    console.log('   🎉 All tests passed! Admin Panel is performing well.');
    console.log('   ✅ Page load times are within acceptable limits.');
    console.log('   ✅ No immediate performance issues detected.');
  } else {
    console.log('   ⚠️  Some performance issues detected:');
    results.filter(r => !r.passed && !r.error).forEach(result => {
      console.log(`   • ${result.scenario}: ${result.loadTime}ms is slower than expected ${result.expectedTime}ms`);
    });
    console.log('   💡 Consider implementing:');
    console.log('     - Data caching for tabs');
    console.log('     - Lazy loading of components');
    console.log('     - Database query optimization');
    console.log('     - Bundle size reduction');
  }
  
  return results;
}

// Check if server is running
async function checkServerHealth() {
  try {
    await measurePerformance(BASE_URL);
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking if development server is running...');
  
  const serverRunning = await checkServerHealth();
  
  if (!serverRunning) {
    console.log('❌ Development server is not running!');
    console.log('   Please start the server with: npm run dev');
    console.log('   Then run this test again.');
    process.exit(1);
  }
  
  console.log('✅ Development server is running\n');
  
  await runPerformanceTests();
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runPerformanceTests, measurePerformance };
