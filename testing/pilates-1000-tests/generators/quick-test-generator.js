#!/usr/bin/env node

/**
 * Quick Test Generator - Generates 100 test cases for immediate execution
 * Proves the framework works before running full 1,000+ suite
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Test user IDs (from database)
const TEST_USERS = [
  '905ff8ee-18f5-455e-9ef2-57f10b0d74ca',
  'bcb09526-5d12-49cb-ad54-cdcb340150d4',
  'c219e601-fd60-4468-8ea0-307c7cff35af'
];

// Devices
const DEVICES = ['web-chrome', 'web-firefox', 'android', 'ios', 'api'];

// Timezones
const TIMEZONES = ['Europe/Athens', 'UTC', 'America/New_York', 'Asia/Tokyo'];

// Actions
const ACTIONS = [
  'book_only',
  'book_and_cancel',
  'book_and_verify',
  'concurrent_book',
  'double_book_attempt'
];

// Network conditions
const NETWORK_CONDITIONS = ['normal', 'high-latency', 'packet-loss'];

class QuickTestGenerator {
  constructor() {
    this.testCases = [];
    this.testIdCounter = 1;
  }

  generateTestId() {
    const id = `T-${String(this.testIdCounter).padStart(6, '0')}`;
    this.testIdCounter++;
    return id;
  }

  generateTestCase(options = {}) {
    const testId = this.generateTestId();
    const traceId = uuidv4();
    
    return {
      test_id: testId,
      trace_id: traceId,
      seed: Math.floor(Math.random() * 1000000),
      timestamp_generated: new Date().toISOString(),
      
      env: 'staging',
      
      user: {
        user_id: options.user_id || TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)],
        role: 'user',
        has_deposit: true
      },
      
      device: options.device || DEVICES[Math.floor(Math.random() * DEVICES.length)],
      timezone: options.timezone || TIMEZONES[Math.floor(Math.random() * TIMEZONES.length)],
      
      action: options.action || ACTIONS[Math.floor(Math.random() * ACTIONS.length)],
      network_condition: options.network || NETWORK_CONDITIONS[Math.floor(Math.random() * NETWORK_CONDITIONS.length)],
      
      sequence: this.generateSequence(options.action || 'book_only'),
      
      concurrent_actors: options.concurrent_actors || [],
      failure_injection: options.failure_injection || null,
      
      assertions: [
        'booking_consistency',
        'deposit_consistency',
        'calendar_consistency',
        'no_dangling_references',
        'no_orphaned_bookings'
      ],
      
      expected_result: 'success',
      priority: options.priority || 'P1'
    };
  }

  generateSequence(action) {
    switch (action) {
      case 'book_only':
        return [
          { step: 1, action: 'book', expected: 'success' },
          { step: 2, action: 'verify_booking_exists', expected: 'true' },
          { step: 3, action: 'verify_deposit_decremented', expected: 'true' },
          { step: 4, action: 'cleanup', expected: 'success' }
        ];
      
      case 'book_and_cancel':
        return [
          { step: 1, action: 'book', expected: 'success' },
          { step: 2, action: 'verify_booking_exists', expected: 'true' },
          { step: 3, action: 'cancel', expected: 'success' },
          { step: 4, action: 'verify_booking_removed', expected: 'true' },
          { step: 5, action: 'verify_deposit_restored', expected: 'true' }
        ];
      
      case 'book_and_verify':
        return [
          { step: 1, action: 'snapshot_before', expected: 'success' },
          { step: 2, action: 'book', expected: 'success' },
          { step: 3, action: 'snapshot_after', expected: 'success' },
          { step: 4, action: 'compare_snapshots', expected: 'consistent' },
          { step: 5, action: 'verify_all_tables', expected: 'consistent' },
          { step: 6, action: 'cleanup', expected: 'success' }
        ];
      
      case 'concurrent_book':
        return [
          { step: 1, action: 'spawn_concurrent_actors', expected: 'success' },
          { step: 2, action: 'all_book_simultaneously', expected: 'controlled' },
          { step: 3, action: 'verify_only_one_succeeded', expected: 'true' },
          { step: 4, action: 'verify_others_got_error', expected: 'true' },
          { step: 5, action: 'cleanup', expected: 'success' }
        ];
      
      case 'double_book_attempt':
        return [
          { step: 1, action: 'book', expected: 'success' },
          { step: 2, action: 'attempt_book_again', expected: 'error' },
          { step: 3, action: 'verify_only_one_booking', expected: 'true' },
          { step: 4, action: 'cleanup', expected: 'success' }
        ];
      
      default:
        return [
          { step: 1, action: 'book', expected: 'success' },
          { step: 2, action: 'verify', expected: 'success' }
        ];
    }
  }

  generateStandardTests() {
    console.log('Generating standard test cases...');
    
    // 30 tests: Basic booking flows
    for (let i = 0; i < 30; i++) {
      this.testCases.push(this.generateTestCase({
        action: 'book_and_cancel',
        priority: 'P0'
      }));
    }
    
    // 20 tests: Verification-heavy tests
    for (let i = 0; i < 20; i++) {
      this.testCases.push(this.generateTestCase({
        action: 'book_and_verify',
        priority: 'P0'
      }));
    }
    
    // 15 tests: Double booking attempts
    for (let i = 0; i < 15; i++) {
      this.testCases.push(this.generateTestCase({
        action: 'double_book_attempt',
        priority: 'P0'
      }));
    }
    
    console.log(`Generated ${this.testCases.length} standard tests`);
  }

  generateConcurrencyTests() {
    console.log('Generating concurrency test cases...');
    
    // 15 tests: Concurrent bookings
    for (let i = 0; i < 15; i++) {
      this.testCases.push(this.generateTestCase({
        action: 'concurrent_book',
        concurrent_actors: [
          { actor: 'user1', action: 'book', delay_ms: 0 },
          { actor: 'user2', action: 'book', delay_ms: 10 }
        ],
        priority: 'P0'
      }));
    }
    
    console.log(`Generated ${this.testCases.length - 65} concurrency tests`);
  }

  generateDeviceVariants() {
    console.log('Generating device variant tests...');
    
    // 10 tests: Each device type
    DEVICES.forEach(device => {
      for (let i = 0; i < 2; i++) {
        this.testCases.push(this.generateTestCase({
          device,
          action: 'book_and_cancel',
          priority: 'P1'
        }));
      }
    });
    
    console.log(`Generated ${this.testCases.length - 80} device variant tests`);
  }

  generateTimezoneTests() {
    console.log('Generating timezone variant tests...');
    
    // 10 tests: Each timezone
    TIMEZONES.forEach(timezone => {
      for (let i = 0; i < 2; i++) {
        this.testCases.push(this.generateTestCase({
          timezone,
          action: 'book_and_cancel',
          priority: 'P1'
        }));
      }
    });
    
    console.log(`Generated ${this.testCases.length - 90} timezone tests`);
  }

  generateNetworkConditionTests() {
    console.log('Generating network condition tests...');
    
    // 10 tests: Different network conditions
    NETWORK_CONDITIONS.forEach(network => {
      for (let i = 0; i < 3; i++) {
        this.testCases.push(this.generateTestCase({
          network,
          action: 'book_and_cancel',
          priority: 'P2'
        }));
      }
    });
    
    console.log(`Generated ${this.testCases.length - 99} network condition tests`);
  }

  generate() {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  QUICK TEST GENERATOR - 100 Test Cases                      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    this.generateStandardTests();
    this.generateConcurrencyTests();
    this.generateDeviceVariants();
    this.generateTimezoneTests();
    this.generateNetworkConditionTests();
    
    console.log(`\n✅ Total test cases generated: ${this.testCases.length}`);
    
    return this.testCases;
  }

  save(outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const output = {
      meta: {
        generated_at: new Date().toISOString(),
        total_tests: this.testCases.length,
        version: '1.0.0'
      },
      test_cases: this.testCases
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n✅ Test cases saved to: ${outputPath}`);
    
    // Also save CSV for easy viewing
    const csvPath = outputPath.replace('.json', '.csv');
    const csv = this.generateCSV();
    fs.writeFileSync(csvPath, csv);
    console.log(`✅ CSV saved to: ${csvPath}\n`);
  }

  generateCSV() {
    const headers = ['test_id', 'trace_id', 'user_id', 'device', 'timezone', 'action', 'network', 'priority'];
    const rows = this.testCases.map(tc => [
      tc.test_id,
      tc.trace_id,
      tc.user.user_id,
      tc.device,
      tc.timezone,
      tc.action,
      tc.network_condition,
      tc.priority
    ]);
    
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  printSummary() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  TEST GENERATION SUMMARY                                     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    const byAction = {};
    const byDevice = {};
    const byTimezone = {};
    const byPriority = {};
    
    this.testCases.forEach(tc => {
      byAction[tc.action] = (byAction[tc.action] || 0) + 1;
      byDevice[tc.device] = (byDevice[tc.device] || 0) + 1;
      byTimezone[tc.timezone] = (byTimezone[tc.timezone] || 0) + 1;
      byPriority[tc.priority] = (byPriority[tc.priority] || 0) + 1;
    });
    
    console.log('By Action:');
    Object.entries(byAction).forEach(([action, count]) => {
      console.log(`  ${action.padEnd(25)} ${count}`);
    });
    
    console.log('\nBy Device:');
    Object.entries(byDevice).forEach(([device, count]) => {
      console.log(`  ${device.padEnd(25)} ${count}`);
    });
    
    console.log('\nBy Priority:');
    Object.entries(byPriority).forEach(([priority, count]) => {
      console.log(`  ${priority.padEnd(25)} ${count}`);
    });
    
    console.log('');
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new QuickTestGenerator();
  const tests = generator.generate();
  
  const outputDir = path.join(__dirname, '../results/test-cases');
  const outputFile = path.join(outputDir, 'quick-test-100.json');
  
  generator.save(outputFile);
  generator.printSummary();
  
  console.log('🎯 Next step: Run the tests with:');
  console.log('   npm run test:quick\n');
}

module.exports = QuickTestGenerator;

