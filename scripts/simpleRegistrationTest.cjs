/**
 * SIMPLE REGISTRATION TEST (CommonJS)
 * Απλό test script που δεν χρειάζεται environment variables
 */

const { createClient } = require('@supabase/supabase-js');

// Hardcoded Supabase credentials (from .env file)
const SUPABASE_URL = 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

class SimpleRegistrationTester {
  constructor() {
    this.results = [];
  }

  generateTestData(testId) {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const timestamp = Date.now();
    
    return {
      email: `testuser${testId}${timestamp}@${domain}`,
      password: `TestPassword${testId}!`,
      firstName: `TestUser${testId}`,
      lastName: `TestLastName${testId}`,
      phone: `69${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      language: 'el'
    };
  }

  async waitForProfile(userId, timeoutMs = 5000, intervalMs = 500) {
    const start = Date.now();
    
    while (Date.now() - start < timeoutMs) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          return true;
        }
        
        await new Promise(r => setTimeout(r, intervalMs));
      } catch (err) {
        await new Promise(r => setTimeout(r, intervalMs));
      }
    }
    
    return false;
  }

  async runSingleTest(testId) {
    const start = Date.now();
    const testData = this.generateTestData(testId);
    
    const result = {
      testId,
      email: testData.email,
      userId: '',
      success: false,
      profileFound: false,
      duration: 0,
      error: null
    };

    try {
      console.log(`🧪 Simple Test ${testId}: ${testData.email}`);

      // Registration
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testData.email,
        password: testData.password,
        options: {
          data: {
            first_name: testData.firstName,
            last_name: testData.lastName,
            phone: testData.phone,
            language: testData.language
          }
        }
      });

      if (authError) {
        result.error = authError.message;
        result.duration = Date.now() - start;
        return result;
      }

      if (!authData.user) {
        result.error = 'No user returned';
        result.duration = Date.now() - start;
        return result;
      }

      result.userId = authData.user.id;
      result.success = true;

      console.log(`✅ Test ${testId}: Registration successful, User ID: ${result.userId}`);

      // Wait for profile
      const profileFound = await this.waitForProfile(result.userId, 8000, 1000);
      result.profileFound = profileFound;

      if (profileFound) {
        console.log(`✅ Test ${testId}: SUCCESS - Profile found`);
      } else {
        console.log(`❌ Test ${testId}: FAILED - Profile not found`);
      }

      // Sign out
      await supabase.auth.signOut();

    } catch (error) {
      result.error = error.message;
      console.error(`❌ Test ${testId}: ERROR -`, result.error);
    }

    result.duration = Date.now() - start;
    return result;
  }

  async runTest(testCount = 10) {
    console.log(`🚀 Simple Registration Test - ${testCount} tests`);
    console.log('');

    const start = Date.now();

    for (let i = 1; i <= testCount; i++) {
      const result = await this.runSingleTest(i);
      this.results.push(result);
      
      // Small delay between tests
      if (i < testCount) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    const totalDuration = Date.now() - start;
    return this.printResults(totalDuration);
  }

  printResults(totalDuration) {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 SIMPLE REGISTRATION TEST RESULTS');
    console.log('='.repeat(60));
    
    const successful = this.results.filter(r => r.success).length;
    const profilesFound = this.results.filter(r => r.profileFound).length;
    const failed = this.results.length - successful;
    const missingProfiles = successful - profilesFound;
    
    console.log(`📊 Total Tests: ${this.results.length}`);
    console.log(`✅ Successful Registrations: ${successful}`);
    console.log(`📋 Profiles Found: ${profilesFound}`);
    console.log(`❌ Failed Registrations: ${failed}`);
    console.log(`⚠️ Missing Profiles: ${missingProfiles}`);
    console.log(`⏱️ Total Duration: ${totalDuration}ms`);
    console.log('');
    
    const successRate = Math.round((successful / this.results.length) * 100);
    const profileRate = successful > 0 ? Math.round((profilesFound / successful) * 100) : 0;
    
    console.log(`📈 Registration Success Rate: ${successRate}%`);
    console.log(`📋 Profile Success Rate: ${profileRate}%`);
    console.log('');

    // Show failed tests
    const failedTests = this.results.filter(r => !r.success || !r.profileFound);
    if (failedTests.length > 0) {
      console.log('❌ FAILED TESTS:');
      failedTests.forEach(test => {
        console.log(`  Test ${test.testId}: ${test.email} - ${test.error || 'Profile not found'}`);
      });
      console.log('');
    }

    // Assessment
    if (profileRate >= 95) {
      console.log('🎉 EXCELLENT! System is working perfectly!');
    } else if (profileRate >= 90) {
      console.log('✅ GOOD! System is reliable!');
    } else if (profileRate >= 80) {
      console.log('⚠️ ACCEPTABLE! Minor issues detected.');
    } else {
      console.log('❌ CRITICAL! System needs attention!');
    }

    console.log('='.repeat(60));
    
    // Return results for further processing
    return {
      totalTests: this.results.length,
      successfulRegistrations: successful,
      profilesFound,
      failedRegistrations: failed,
      missingProfiles,
      successRate,
      profileRate,
      totalDuration
    };
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Simple Registration Test Script');
    console.log('Usage: node scripts/simpleRegistrationTest.cjs [count]');
    console.log('');
    console.log('Options:');
    console.log('  count    Number of tests to run (default: 10)');
    console.log('  --help   Show this help message');
    return;
  }

  const testCount = parseInt(args[0]) || 10;

  try {
    const tester = new SimpleRegistrationTester();
    const results = await tester.runTest(testCount);
    
    // Exit with error code if success rate is too low
    if (results.profileRate < 90) {
      console.log('❌ Test failed: Profile success rate below 90%');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Simple test failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { SimpleRegistrationTester };
