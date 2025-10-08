/**
 * COMPREHENSIVE MEMBERSHIP PACKAGE TEST SUITE
 * Tests all subscription packages, approval flows, weekly refills, and admin functions
 */

import { supabase } from '@/config/supabase';

// Test configuration
const TEST_CONFIG = {
  ADMIN_USER_ID: '00000000-0000-0000-0000-000000000001',
  TEST_EMAIL_PREFIX: 'test_user_',
  CLEANUP_AFTER_TESTS: true,
  VERBOSE_LOGGING: true
};

// Test data interfaces
interface TestUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface TestMembershipRequest {
  id: string;
  user_id: string;
  package_id: string;
  status: string;
  installment_1_amount?: number;
  installment_2_amount?: number;
  installment_3_amount?: number;
}

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: any;
}

class MembershipTestSuite {
  private testResults: TestResult[] = [];
  private testUsers: TestUser[] = [];
  private createdRequests: TestMembershipRequest[] = [];
  private createdMemberships: any[] = [];

  constructor() {
    console.log('🧪 COMPREHENSIVE MEMBERSHIP TEST SUITE INITIALIZED');
  }

  /**
   * Log with timestamp and formatting
   */
  private log(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data && TEST_CONFIG.VERBOSE_LOGGING) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  /**
   * Create test user
   */
  private async createTestUser(index: number): Promise<TestUser> {
    const testUser: TestUser = {
      id: `test-user-${index}-${Date.now()}`,
      email: `${TEST_CONFIG.TEST_EMAIL_PREFIX}${index}@test.com`,
      first_name: `TestUser${index}`,
      last_name: 'TestLastName'
    };

    // Insert into users table
    const { error: userError } = await supabase
      .from('users')
      .insert([{
        id: testUser.id,
        email: testUser.email,
        created_at: new Date().toISOString()
      }]);

    if (userError) throw new Error(`Failed to create user: ${userError.message}`);

    // Insert into user_profiles table
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        user_id: testUser.id,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        created_at: new Date().toISOString()
      }]);

    if (profileError) throw new Error(`Failed to create user profile: ${profileError.message}`);

    this.testUsers.push(testUser);
    this.log(`✅ Created test user: ${testUser.email}`);
    return testUser;
  }

  /**
   * Get available membership packages
   */
  private async getMembershipPackages() {
    const { data: packages, error } = await supabase
      .from('membership_packages')
      .select('*')
      .order('name');

    if (error) throw new Error(`Failed to fetch packages: ${error.message}`);
    return packages;
  }

  /**
   * Create membership request
   */
  private async createMembershipRequest(
    user: TestUser, 
    packageId: string, 
    installmentAmounts?: { installment_1_amount?: number; installment_2_amount?: number; installment_3_amount?: number }
  ): Promise<TestMembershipRequest> {
    const requestData = {
      user_id: user.id,
      package_id: packageId,
      status: 'pending',
      created_at: new Date().toISOString(),
      ...installmentAmounts
    };

    const { data, error } = await supabase
      .from('membership_requests')
      .insert([requestData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create membership request: ${error.message}`);

    this.createdRequests.push(data);
    this.log(`✅ Created membership request for ${user.email}`, data);
    return data;
  }

  /**
   * Approve membership request
   */
  private async approveMembershipRequest(requestId: string): Promise<boolean> {
    try {
      // Update request status to approved
      const { error: updateError } = await supabase
        .from('membership_requests')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', requestId);

      if (updateError) throw new Error(`Failed to update request status: ${updateError.message}`);

      // For Ultimate packages, call the dual activation function
      const request = this.createdRequests.find(r => r.id === requestId);
      if (request) {
        const packages = await this.getMembershipPackages();
        const packageInfo = packages.find(p => p.id === request.package_id);
        
        if (packageInfo?.name === 'Ultimate' || packageInfo?.name === 'Ultimate Medium') {
          const { error: rpcError } = await supabase.rpc('create_ultimate_dual_memberships', {
            p_user_id: request.user_id,
            p_package_id: request.package_id,
            p_request_id: requestId
          });

          if (rpcError) throw new Error(`Failed to create dual memberships: ${rpcError.message}`);
        } else {
          // For regular packages, create single membership
          const { error: membershipError } = await supabase
            .from('memberships')
            .insert([{
              user_id: request.user_id,
              package_id: request.package_id,
              start_date: new Date().toISOString().split('T')[0],
              end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
              is_active: true,
              created_at: new Date().toISOString()
            }]);

          if (membershipError) throw new Error(`Failed to create membership: ${membershipError.message}`);
        }
      }

      this.log(`✅ Approved membership request: ${requestId}`);
      return true;
    } catch (error) {
      this.log(`❌ Failed to approve membership request: ${error.message}`);
      return false;
    }
  }

  /**
   * Check Pilates deposit status
   */
  private async checkPilatesDeposit(userId: string) {
    const { data, error } = await supabase
      .rpc('get_active_pilates_deposit', { p_user_id: userId });

    if (error) {
      this.log(`❌ Failed to get Pilates deposit: ${error.message}`);
      return null;
    }

    return data;
  }

  /**
   * Test Ultimate package flow
   */
  private async testUltimatePackage(): Promise<TestResult> {
    const testName = 'Ultimate Package (500€) - Full Flow';
    this.log(`🧪 Starting test: ${testName}`);

    try {
      // Create test user
      const user = await this.createTestUser(1);
      
      // Get Ultimate package
      const packages = await this.getMembershipPackages();
      const ultimatePackage = packages.find(p => p.name === 'Ultimate');
      if (!ultimatePackage) throw new Error('Ultimate package not found');

      // Create membership request
      const request = await this.createMembershipRequest(user.id, ultimatePackage.id, {
        installment_1_amount: 250,
        installment_2_amount: 250
      });

      // Approve request
      const approvalSuccess = await this.approveMembershipRequest(request.id);
      if (!approvalSuccess) throw new Error('Failed to approve Ultimate request');

      // Check dual memberships were created
      const { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('source_request_id', request.id);

      if (membershipError) throw new Error(`Failed to fetch memberships: ${membershipError.message}`);
      if (memberships.length !== 2) throw new Error(`Expected 2 memberships, got ${memberships.length}`);

      // Check Pilates deposit was created
      const deposit = await this.checkPilatesDeposit(user.id);
      if (!deposit) throw new Error('Pilates deposit not created');

      this.log(`✅ Ultimate package test passed`, {
        memberships: memberships.length,
        deposit_amount: deposit.deposit_remaining
      });

      return {
        testName,
        passed: true,
        details: {
          user_email: user.email,
          memberships_created: memberships.length,
          pilates_deposit: deposit.deposit_remaining,
          package_price: ultimatePackage.price
        }
      };

    } catch (error) {
      this.log(`❌ Ultimate package test failed: ${error.message}`);
      return {
        testName,
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Test Ultimate Medium package flow
   */
  private async testUltimateMediumPackage(): Promise<TestResult> {
    const testName = 'Ultimate Medium Package (400€) - Full Flow';
    this.log(`🧪 Starting test: ${testName}`);

    try {
      // Create test user
      const user = await this.createTestUser(2);
      
      // Get Ultimate Medium package
      const packages = await this.getMembershipPackages();
      const ultimateMediumPackage = packages.find(p => p.name === 'Ultimate Medium');
      if (!ultimateMediumPackage) throw new Error('Ultimate Medium package not found');

      // Create membership request
      const request = await this.createMembershipRequest(user.id, ultimateMediumPackage.id, {
        installment_1_amount: 200,
        installment_2_amount: 200
      });

      // Approve request
      const approvalSuccess = await this.approveMembershipRequest(request.id);
      if (!approvalSuccess) throw new Error('Failed to approve Ultimate Medium request');

      // Check dual memberships were created
      const { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('source_request_id', request.id);

      if (membershipError) throw new Error(`Failed to fetch memberships: ${membershipError.message}`);
      if (memberships.length !== 2) throw new Error(`Expected 2 memberships, got ${memberships.length}`);

      // Check Pilates deposit was created
      const deposit = await this.checkPilatesDeposit(user.id);
      if (!deposit) throw new Error('Pilates deposit not created');

      this.log(`✅ Ultimate Medium package test passed`, {
        memberships: memberships.length,
        deposit_amount: deposit.deposit_remaining
      });

      return {
        testName,
        passed: true,
        details: {
          user_email: user.email,
          memberships_created: memberships.length,
          pilates_deposit: deposit.deposit_remaining,
          package_price: ultimateMediumPackage.price
        }
      };

    } catch (error) {
      this.log(`❌ Ultimate Medium package test failed: ${error.message}`);
      return {
        testName,
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Test weekly refill system
   */
  private async testWeeklyRefillSystem(): Promise<TestResult> {
    const testName = 'Weekly Refill System - Ultimate Packages';
    this.log(`🧪 Starting test: ${testName}`);

    try {
      // Enable weekly refill feature
      const { error: flagError } = await supabase
        .from('feature_flags')
        .update({ is_enabled: true })
        .eq('name', 'weekly_pilates_refill_enabled');

      if (flagError) throw new Error(`Failed to enable weekly refill: ${flagError.message}`);

      // Get Ultimate users
      const { data: ultimateUsers, error: usersError } = await supabase
        .from('memberships')
        .select(`
          user_id,
          user_profiles!inner(email, first_name, last_name)
        `)
        .eq('source_package_name', 'Ultimate')
        .eq('is_active', true)
        .limit(2);

      if (usersError) throw new Error(`Failed to fetch Ultimate users: ${usersError.message}`);
      if (!ultimateUsers || ultimateUsers.length === 0) throw new Error('No Ultimate users found for testing');

      const testResults = [];

      for (const user of ultimateUsers) {
        // Get weekly refill status
        const { data: refillStatus, error: statusError } = await supabase
          .rpc('get_user_weekly_refill_status', { p_user_id: user.user_id });

        if (statusError) {
          this.log(`❌ Failed to get refill status for user ${user.user_id}: ${statusError.message}`);
          continue;
        }

        if (refillStatus && refillStatus.length > 0) {
          const status = refillStatus[0];
          testResults.push({
            user_email: user.user_profiles.email,
            package_name: status.package_name,
            current_deposit: status.current_deposit_amount,
            target_deposit: status.target_deposit_amount,
            next_refill_date: status.next_refill_date,
            is_refill_due: status.is_refill_due
          });
        }
      }

      // Test manual refill trigger
      const { error: triggerError } = await supabase
        .rpc('manual_trigger_weekly_refill', { p_user_id: ultimateUsers[0].user_id });

      if (triggerError) {
        this.log(`⚠️ Manual refill trigger failed: ${triggerError.message}`);
      } else {
        this.log(`✅ Manual refill trigger successful`);
      }

      this.log(`✅ Weekly refill system test passed`, testResults);

      return {
        testName,
        passed: true,
        details: {
          users_tested: testResults.length,
          refill_statuses: testResults
        }
      };

    } catch (error) {
      this.log(`❌ Weekly refill system test failed: ${error.message}`);
      return {
        testName,
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Test regular Pilates package
   */
  private async testRegularPilatesPackage(): Promise<TestResult> {
    const testName = 'Regular Pilates Package - Flow';
    this.log(`🧪 Starting test: ${testName}`);

    try {
      // Create test user
      const user = await this.createTestUser(3);
      
      // Get regular Pilates package
      const packages = await this.getMembershipPackages();
      const pilatesPackage = packages.find(p => p.name === 'Pilates' && p.price < 300);
      if (!pilatesPackage) throw new Error('Regular Pilates package not found');

      // Create membership request
      const request = await this.createMembershipRequest(user.id, pilatesPackage.id);

      // Approve request
      const approvalSuccess = await this.approveMembershipRequest(request.id);
      if (!approvalSuccess) throw new Error('Failed to approve Pilates request');

      // Check membership was created
      const { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('package_id', pilatesPackage.id);

      if (membershipError) throw new Error(`Failed to fetch memberships: ${membershipError.message}`);
      if (memberships.length !== 1) throw new Error(`Expected 1 membership, got ${memberships.length}`);

      this.log(`✅ Regular Pilates package test passed`, {
        membership_created: memberships.length,
        package_price: pilatesPackage.price
      });

      return {
        testName,
        passed: true,
        details: {
          user_email: user.email,
          membership_created: memberships.length,
          package_price: pilatesPackage.price
        }
      };

    } catch (error) {
      this.log(`❌ Regular Pilates package test failed: ${error.message}`);
      return {
        testName,
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Test Free Gym package
   */
  private async testFreeGymPackage(): Promise<TestResult> {
    const testName = 'Free Gym Package - Flow';
    this.log(`🧪 Starting test: ${testName}`);

    try {
      // Create test user
      const user = await this.createTestUser(4);
      
      // Get Free Gym package
      const packages = await this.getMembershipPackages();
      const freeGymPackage = packages.find(p => p.name === 'Free Gym');
      if (!freeGymPackage) throw new Error('Free Gym package not found');

      // Create membership request
      const request = await this.createMembershipRequest(user.id, freeGymPackage.id);

      // Approve request
      const approvalSuccess = await this.approveMembershipRequest(request.id);
      if (!approvalSuccess) throw new Error('Failed to approve Free Gym request');

      // Check membership was created
      const { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('package_id', freeGymPackage.id);

      if (membershipError) throw new Error(`Failed to fetch memberships: ${membershipError.message}`);
      if (memberships.length !== 1) throw new Error(`Expected 1 membership, got ${memberships.length}`);

      this.log(`✅ Free Gym package test passed`, {
        membership_created: memberships.length,
        package_price: freeGymPackage.price
      });

      return {
        testName,
        passed: true,
        details: {
          user_email: user.email,
          membership_created: memberships.length,
          package_price: freeGymPackage.price
        }
      };

    } catch (error) {
      this.log(`❌ Free Gym package test failed: ${error.message}`);
      return {
        testName,
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Test installment payment system
   */
  private async testInstallmentPayments(): Promise<TestResult> {
    const testName = 'Installment Payment System';
    this.log(`🧪 Starting test: ${testName}`);

    try {
      // Create test user
      const user = await this.createTestUser(5);
      
      // Get Ultimate package
      const packages = await this.getMembershipPackages();
      const ultimatePackage = packages.find(p => p.name === 'Ultimate');
      if (!ultimatePackage) throw new Error('Ultimate package not found');

      // Create membership request with installments
      const request = await this.createMembershipRequest(user.id, ultimatePackage.id, {
        installment_1_amount: 200,
        installment_2_amount: 200,
        installment_3_amount: 100
      });

      // Check request has installments
      if (!request.installment_1_amount || !request.installment_2_amount || !request.installment_3_amount) {
        throw new Error('Installments not properly set on request');
      }

      // Approve request
      const approvalSuccess = await this.approveMembershipRequest(request.id);
      if (!approvalSuccess) throw new Error('Failed to approve installment request');

      this.log(`✅ Installment payment test passed`, {
        installments: {
          installment_1: request.installment_1_amount,
          installment_2: request.installment_2_amount,
          installment_3: request.installment_3_amount,
          total: request.installment_1_amount + request.installment_2_amount + request.installment_3_amount
        }
      });

      return {
        testName,
        passed: true,
        details: {
          user_email: user.email,
          installments: {
            installment_1: request.installment_1_amount,
            installment_2: request.installment_2_amount,
            installment_3: request.installment_3_amount
          }
        }
      };

    } catch (error) {
      this.log(`❌ Installment payment test failed: ${error.message}`);
      return {
        testName,
        passed: false,
        error: error.message
      };
    }
  }

  /**
   * Cleanup test data
   */
  private async cleanupTestData(): Promise<void> {
    if (!TEST_CONFIG.CLEANUP_AFTER_TESTS) return;

    this.log('🧹 Starting cleanup of test data...');

    try {
      // Delete membership requests
      for (const request of this.createdRequests) {
        await supabase.from('membership_requests').delete().eq('id', request.id);
      }

      // Delete memberships
      for (const user of this.testUsers) {
        await supabase.from('memberships').delete().eq('user_id', user.id);
      }

      // Delete pilates deposits
      for (const user of this.testUsers) {
        await supabase.from('pilates_deposits').delete().eq('user_id', user.id);
      }

      // Delete user profiles
      for (const user of this.testUsers) {
        await supabase.from('user_profiles').delete().eq('user_id', user.id);
      }

      // Delete users
      for (const user of this.testUsers) {
        await supabase.from('users').delete().eq('id', user.id);
      }

      this.log('✅ Test data cleanup completed');
    } catch (error) {
      this.log(`❌ Cleanup failed: ${error.message}`);
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestResult[]> {
    this.log('🚀 STARTING COMPREHENSIVE MEMBERSHIP PACKAGE TEST SUITE');
    this.log('=' .repeat(80));

    const tests = [
      () => this.testUltimatePackage(),
      () => this.testUltimateMediumPackage(),
      () => this.testRegularPilatesPackage(),
      () => this.testFreeGymPackage(),
      () => this.testInstallmentPayments(),
      () => this.testWeeklyRefillSystem()
    ];

    for (const test of tests) {
      try {
        const result = await test();
        this.testResults.push(result);
        
        if (result.passed) {
          this.log(`✅ ${result.testName} - PASSED`);
        } else {
          this.log(`❌ ${result.testName} - FAILED: ${result.error}`);
        }
      } catch (error) {
        this.log(`💥 Test execution failed: ${error.message}`);
        this.testResults.push({
          testName: 'Test Execution Error',
          passed: false,
          error: error.message
        });
      }
    }

    // Cleanup
    await this.cleanupTestData();

    // Summary
    this.log('=' .repeat(80));
    this.log('📊 TEST SUITE SUMMARY');
    this.log('=' .repeat(80));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    
    this.log(`✅ Passed: ${passed}`);
    this.log(`❌ Failed: ${failed}`);
    this.log(`📈 Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
      this.log('\n❌ FAILED TESTS:');
      this.testResults.filter(r => !r.passed).forEach(result => {
        this.log(`  - ${result.testName}: ${result.error}`);
      });
    }

    this.log('🏁 TEST SUITE COMPLETED');
    return this.testResults;
  }
}

// Export for use
export { MembershipTestSuite, TestResult, TestUser, TestMembershipRequest };
