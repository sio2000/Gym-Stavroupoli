/**
 * QUICK REGISTRATION TEST SCRIPT
 * Γρήγορη δοκιμή 10-50 registrations για να επιβεβαιώσει ότι το σύστημα λειτουργεί
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration - Hardcoded values from .env file
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nolqodpfaqdnprixaqlo.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzExMzYsImV4cCI6MjA3Mjc0NzEzNn0.VZMOwqFp0WXXX6SrY_AXWIWX-fPLZd-faay06MnzveI';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface QuickTestResult {
  testId: number;
  email: string;
  userId: string;
  success: boolean;
  profileFound: boolean;
  duration: number;
  error?: string;
}

class QuickRegistrationTester {
  private results: QuickTestResult[] = [];

  /**
   * Generate test data
   */
  private generateTestData(testId: number): any {
    return {
      email: `quicktest${testId}_${Date.now()}@test.com`,
      password: `TestPassword${testId}!`,
      firstName: `TestUser${testId}`,
      lastName: `TestLastName${testId}`,
      phone: `69${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      language: 'el'
    };
  }

  /**
   * Run single test
   */
  private async runSingleTest(testId: number): Promise<QuickTestResult> {
    const start = Date.now();
    const testData = this.generateTestData(testId);
    
    const result: QuickTestResult = {
      testId,
      email: testData.email,
      userId: '',
      success: false,
      profileFound: false,
      duration: 0
    };

    try {
      console.log(`🧪 Quick Test ${testId}: ${testData.email}`);

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

      // Wait for profile (shorter timeout for quick test)
      const profileFound = await this.waitForProfile(result.userId, 5000, 500);
      result.profileFound = profileFound;

      if (profileFound) {
        console.log(`✅ Quick Test ${testId}: SUCCESS - Profile found`);
      } else {
        console.log(`❌ Quick Test ${testId}: FAILED - Profile not found`);
      }

      // Sign out
      await supabase.auth.signOut();

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      console.error(`❌ Quick Test ${testId}: ERROR -`, result.error);
    }

    result.duration = Date.now() - start;
    return result;
  }

  /**
   * Wait for profile
   */
  private async waitForProfile(userId: string, timeoutMs: number = 5000, intervalMs: number = 500): Promise<boolean> {
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

  /**
   * Run quick test suite
   */
  async runQuickTest(testCount: number = 10): Promise<void> {
    console.log(`🚀 Quick Registration Test - ${testCount} tests`);
    console.log('');

    const start = Date.now();

    for (let i = 1; i <= testCount; i++) {
      const result = await this.runSingleTest(i);
      this.results.push(result);
      
      // Small delay between tests
      if (i < testCount) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    const totalDuration = Date.now() - start;
    this.printResults(totalDuration);
  }

  /**
   * Print results
   */
  private printResults(totalDuration: number): void {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 QUICK REGISTRATION TEST RESULTS');
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
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Quick Registration Test Script');
    console.log('Usage: npm run test:quick-registration [--count N]');
    console.log('');
    console.log('Options:');
    console.log('  --count N    Number of tests to run (default: 10)');
    console.log('  --help       Show this help message');
    return;
  }

  const testCount = parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1] || '10');

  try {
    const tester = new QuickRegistrationTester();
    await tester.runQuickTest(testCount);
  } catch (error) {
    console.error('Quick test failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { QuickRegistrationTester };
