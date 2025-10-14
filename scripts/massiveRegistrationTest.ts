/**
 * MASSIVE REGISTRATION TEST SCRIPT
 * Τρέχει 1000+ registration scenarios για να επιβεβαιώσει bulletproof λειτουργία
 */

import { createClient } from '@supabase/supabase-js';
import { userProfileService } from '../src/services/UserProfileService';
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

interface TestResult {
  testId: number;
  email: string;
  userId: string;
  registrationSuccess: boolean;
  profileExists: boolean;
  profileData?: any;
  error?: string;
  duration: number;
  timestamp: Date;
}

interface TestStats {
  totalTests: number;
  successfulRegistrations: number;
  successfulProfiles: number;
  failedRegistrations: number;
  missingProfiles: number;
  averageDuration: number;
  successRate: number;
  profileSuccessRate: number;
  errors: Array<{ error: string; count: number }>;
}

class MassiveRegistrationTester {
  private results: TestResult[] = [];
  private stats: TestStats = {
    totalTests: 0,
    successfulRegistrations: 0,
    successfulProfiles: 0,
    failedRegistrations: 0,
    missingProfiles: 0,
    averageDuration: 0,
    successRate: 0,
    profileSuccessRate: 0,
    errors: []
  };

  /**
   * Generate random test data
   */
  private generateTestData(testId: number): any {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'test.com'];
    const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'Alex', 'Emma', 'Chris', 'Lisa', 'David', 'Maria'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return {
      email: `test${testId}_${Date.now()}@${domain}`,
      password: `TestPassword${testId}!`,
      firstName: `${firstName}_${testId}`,
      lastName: `${lastName}_${testId}`,
      phone: `69${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      language: Math.random() > 0.5 ? 'el' : 'en'
    };
  }

  /**
   * Run single registration test
   */
  private async runSingleTest(testId: number): Promise<TestResult> {
    const start = Date.now();
    const testData = this.generateTestData(testId);
    
    const result: TestResult = {
      testId,
      email: testData.email,
      userId: '',
      registrationSuccess: false,
      profileExists: false,
      duration: 0,
      timestamp: new Date()
    };

    try {
      console.log(`🧪 Test ${testId}: Starting registration for ${testData.email}`);

      // Step 1: Registration
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
        result.error = `Registration failed: ${authError.message}`;
        result.duration = Date.now() - start;
        return result;
      }

      if (!authData.user) {
        result.error = 'No user returned from registration';
        result.duration = Date.now() - start;
        return result;
      }

      result.userId = authData.user.id;
      result.registrationSuccess = true;

      console.log(`✅ Test ${testId}: Registration successful, User ID: ${result.userId}`);

      // Step 2: Wait for profile creation (with retry)
      const profileReady = await this.waitForProfile(result.userId, 15000, 1000);
      
      if (profileReady) {
        result.profileExists = true;
        console.log(`✅ Test ${testId}: Profile found`);
      } else {
        console.log(`⚠️ Test ${testId}: Profile not found, checking manually...`);
        
        // Manual check
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', result.userId)
          .single();

        if (profileData) {
          result.profileExists = true;
          result.profileData = profileData;
          console.log(`✅ Test ${testId}: Profile found on manual check`);
        } else {
          result.error = 'Profile not found after registration';
          console.log(`❌ Test ${testId}: Profile missing`);
        }
      }

      // Step 3: Sign out
      await supabase.auth.signOut();

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      console.error(`❌ Test ${testId}: Exception occurred:`, result.error);
    }

    result.duration = Date.now() - start;
    return result;
  }

  /**
   * Wait for profile creation
   */
  private async waitForProfile(userId: string, timeoutMs: number = 10000, intervalMs: number = 1000): Promise<boolean> {
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
   * Run massive test suite
   */
  async runMassiveTest(totalTests: number = 1000, batchSize: number = 10, delayBetweenBatches: number = 1000): Promise<TestStats> {
    console.log(`🚀 Starting Massive Registration Test`);
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`📦 Batch Size: ${batchSize}`);
    console.log(`⏱️ Delay Between Batches: ${delayBetweenBatches}ms`);
    console.log('');

    const start = Date.now();

    for (let batchStart = 0; batchStart < totalTests; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, totalTests);
      const batchNumber = Math.floor(batchStart / batchSize) + 1;
      const totalBatches = Math.ceil(totalTests / batchSize);

      console.log(`\n🔄 Processing Batch ${batchNumber}/${totalBatches} (Tests ${batchStart + 1}-${batchEnd})`);

      // Run batch in parallel
      const batchPromises = [];
      for (let i = batchStart; i < batchEnd; i++) {
        batchPromises.push(this.runSingleTest(i + 1));
      }

      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process batch results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          this.results.push(result.value);
        } else {
          console.error(`❌ Test ${batchStart + index + 1} failed with exception:`, result.reason);
          this.results.push({
            testId: batchStart + index + 1,
            email: `failed_${batchStart + index + 1}@test.com`,
            userId: '',
            registrationSuccess: false,
            profileExists: false,
            error: result.reason?.message || 'Unknown error',
            duration: 0,
            timestamp: new Date()
          });
        }
      });

      // Delay between batches
      if (batchEnd < totalTests) {
        console.log(`⏳ Waiting ${delayBetweenBatches}ms before next batch...`);
        await new Promise(r => setTimeout(r, delayBetweenBatches));
      }

      // Progress update
      const completed = batchEnd;
      const progress = Math.round((completed / totalTests) * 100);
      console.log(`📈 Progress: ${completed}/${totalTests} (${progress}%)`);
    }

    const totalDuration = Date.now() - start;
    
    // Calculate statistics
    this.calculateStats(totalDuration);
    
    // Print results
    this.printResults();

    return this.stats;
  }

  /**
   * Calculate test statistics
   */
  private calculateStats(totalDuration: number): void {
    this.stats.totalTests = this.results.length;
    this.stats.successfulRegistrations = this.results.filter(r => r.registrationSuccess).length;
    this.stats.successfulProfiles = this.results.filter(r => r.profileExists).length;
    this.stats.failedRegistrations = this.stats.totalTests - this.stats.successfulRegistrations;
    this.stats.missingProfiles = this.stats.successfulRegistrations - this.stats.successfulProfiles;
    
    this.stats.averageDuration = this.results.length > 0 
      ? Math.round(this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length)
      : 0;
    
    this.stats.successRate = this.stats.totalTests > 0 
      ? Math.round((this.stats.successfulRegistrations / this.stats.totalTests) * 100)
      : 0;
    
    this.stats.profileSuccessRate = this.stats.successfulRegistrations > 0 
      ? Math.round((this.stats.successfulProfiles / this.stats.successfulRegistrations) * 100)
      : 0;

    // Count errors
    const errorCounts: Record<string, number> = {};
    this.results.forEach(r => {
      if (r.error) {
        errorCounts[r.error] = (errorCounts[r.error] || 0) + 1;
      }
    });

    this.stats.errors = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Print test results
   */
  private printResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 MASSIVE REGISTRATION TEST RESULTS');
    console.log('='.repeat(80));
    
    console.log(`📊 Total Tests: ${this.stats.totalTests}`);
    console.log(`✅ Successful Registrations: ${this.stats.successfulRegistrations}`);
    console.log(`📋 Successful Profiles: ${this.stats.successfulProfiles}`);
    console.log(`❌ Failed Registrations: ${this.stats.failedRegistrations}`);
    console.log(`⚠️ Missing Profiles: ${this.stats.missingProfiles}`);
    console.log('');
    
    console.log(`📈 Registration Success Rate: ${this.stats.successRate}%`);
    console.log(`📋 Profile Success Rate: ${this.stats.profileSuccessRate}%`);
    console.log(`⏱️ Average Duration: ${this.stats.averageDuration}ms`);
    console.log('');

    if (this.stats.errors.length > 0) {
      console.log('❌ ERRORS SUMMARY:');
      this.stats.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.error} (${error.count} times)`);
      });
      console.log('');
    }

    // Success assessment
    if (this.stats.profileSuccessRate >= 99) {
      console.log('🎉 EXCELLENT! System is bulletproof!');
    } else if (this.stats.profileSuccessRate >= 95) {
      console.log('✅ GOOD! System is very reliable!');
    } else if (this.stats.profileSuccessRate >= 90) {
      console.log('⚠️ ACCEPTABLE! Some improvements needed.');
    } else {
      console.log('❌ CRITICAL! System needs immediate attention!');
    }

    console.log('='.repeat(80));
  }

  /**
   * Generate detailed report
   */
  generateDetailedReport(): string {
    const report = `
# MASSIVE REGISTRATION TEST REPORT
Generated: ${new Date().toISOString()}

## SUMMARY
- Total Tests: ${this.stats.totalTests}
- Registration Success Rate: ${this.stats.successRate}%
- Profile Success Rate: ${this.stats.profileSuccessRate}%
- Average Duration: ${this.stats.averageDuration}ms

## DETAILED RESULTS
${this.results.map(r => `
Test ${r.testId}: ${r.email}
- Registration: ${r.registrationSuccess ? '✅' : '❌'}
- Profile: ${r.profileExists ? '✅' : '❌'}
- Duration: ${r.duration}ms
- Error: ${r.error || 'None'}
`).join('')}

## ERRORS
${this.stats.errors.map(e => `- ${e.error}: ${e.count} occurrences`).join('\n')}
`;

    return report;
  }

  /**
   * Clean up test data
   */
  async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    
    try {
      // Delete test user profiles
      const testUserIds = this.results
        .filter(r => r.userId)
        .map(r => r.userId);

      if (testUserIds.length > 0) {
        const { error } = await supabase
          .from('user_profiles')
          .delete()
          .in('user_id', testUserIds);

        if (error) {
          console.error('Error cleaning up profiles:', error);
        } else {
          console.log(`✅ Cleaned up ${testUserIds.length} test profiles`);
        }
      }

      // Note: We can't delete auth users via API, they'll need manual cleanup
      console.log('⚠️ Auth users need manual cleanup from Supabase dashboard');
      
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Massive Registration Test Script');
    console.log('Usage: npm run test:massive-registration [options]');
    console.log('');
    console.log('Options:');
    console.log('  --tests N        Number of tests to run (default: 1000)');
    console.log('  --batch N        Batch size (default: 10)');
    console.log('  --delay N        Delay between batches in ms (default: 1000)');
    console.log('  --cleanup        Clean up test data after completion');
    console.log('  --report         Generate detailed report file');
    console.log('  --help           Show this help message');
    return;
  }

  const testCount = parseInt(args.find(arg => arg.startsWith('--tests='))?.split('=')[1] || '1000');
  const batchSize = parseInt(args.find(arg => arg.startsWith('--batch='))?.split('=')[1] || '10');
  const delay = parseInt(args.find(arg => arg.startsWith('--delay='))?.split('=')[1] || '1000');
  const shouldCleanup = args.includes('--cleanup');
  const shouldReport = args.includes('--report');

  try {
    const tester = new MassiveRegistrationTester();
    
    console.log(`🚀 Starting ${testCount} registration tests...`);
    const stats = await tester.runMassiveTest(testCount, batchSize, delay);
    
    if (shouldReport) {
      const report = tester.generateDetailedReport();
      const fs = require('fs');
      const filename = `registration-test-report-${Date.now()}.md`;
      fs.writeFileSync(filename, report);
      console.log(`📄 Detailed report saved to: ${filename}`);
    }
    
    if (shouldCleanup) {
      await tester.cleanupTestData();
    }
    
    // Exit with error code if success rate is too low
    if (stats.profileSuccessRate < 95) {
      console.log('❌ Test failed: Success rate below 95%');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Test script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MassiveRegistrationTester };
