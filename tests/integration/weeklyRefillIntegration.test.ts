import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Integration tests for weekly refill system
// These tests require a real Supabase connection and should be run against a test database

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test data
const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';
const TEST_ULTIMATE_REQUEST_ID = '22222222-2222-2222-2222-222222222222';
const TEST_ULTIMATE_MEDIUM_REQUEST_ID = '33333333-3333-3333-3333-333333333333';

describe('Weekly Refill Integration Tests', () => {
  beforeEach(async () => {
    // Clean up any existing test data
    await cleanupTestData();
    
    // Set up test environment
    await setupTestData();
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestData();
  });

  describe('Feature Flag Management', () => {
    it('should create and manage feature flag', async () => {
      // Enable feature flag
      const { error: updateError } = await supabase
        .from('feature_flags')
        .update({ is_enabled: true })
        .eq('name', 'weekly_pilates_refill_enabled');

      expect(updateError).toBeNull();

      // Verify feature is enabled
      const { data: flagData, error: flagError } = await supabase
        .from('feature_flags')
        .select('is_enabled')
        .eq('name', 'weekly_pilates_refill_enabled')
        .single();

      expect(flagError).toBeNull();
      expect(flagData?.is_enabled).toBe(true);
    });

    it('should disable feature flag', async () => {
      // Disable feature flag
      const { error: updateError } = await supabase
        .from('feature_flags')
        .update({ is_enabled: false })
        .eq('name', 'weekly_pilates_refill_enabled');

      expect(updateError).toBeNull();

      // Verify feature is disabled
      const { data: flagData, error: flagError } = await supabase
        .from('feature_flags')
        .select('is_enabled')
        .eq('name', 'weekly_pilates_refill_enabled')
        .single();

      expect(flagError).toBeNull();
      expect(flagData?.is_enabled).toBe(false);
    });
  });

  describe('Ultimate Package Activation', () => {
    it('should create Ultimate membership with initial Pilates deposit', async () => {
      // Call the dual activation function
      const { data: activationResult, error: activationError } = await supabase
        .rpc('create_ultimate_dual_memberships', {
          p_user_id: TEST_USER_ID,
          p_ultimate_request_id: TEST_ULTIMATE_REQUEST_ID,
          p_duration_days: 365,
          p_start_date: new Date().toISOString().split('T')[0]
        });

      expect(activationError).toBeNull();
      expect(activationResult?.success).toBe(true);
      expect(activationResult?.initial_deposit_amount).toBe(3);

      // Verify memberships were created
      const { data: memberships, error: membershipsError } = await supabase
        .from('memberships')
        .select(`
          *,
          membership_packages!inner(name)
        `)
        .eq('source_request_id', TEST_ULTIMATE_REQUEST_ID);

      expect(membershipsError).toBeNull();
      expect(memberships).toHaveLength(2);
      
      const pilatesMembership = memberships?.find(m => m.membership_packages.name === 'Pilates');
      const freeGymMembership = memberships?.find(m => m.membership_packages.name === 'Free Gym');
      
      expect(pilatesMembership).toBeDefined();
      expect(freeGymMembership).toBeDefined();

      // Verify initial Pilates deposit was created
      const { data: deposits, error: depositsError } = await supabase
        .from('pilates_deposits')
        .select('*')
        .eq('user_id', TEST_USER_ID)
        .eq('is_active', true);

      expect(depositsError).toBeNull();
      expect(deposits).toHaveLength(1);
      expect(deposits?.[0]?.deposit_remaining).toBe(3);
    });

    it('should create Ultimate Medium membership with initial Pilates deposit', async () => {
      // Call the dual activation function for Ultimate Medium
      const { data: activationResult, error: activationError } = await supabase
        .rpc('create_ultimate_dual_memberships', {
          p_user_id: TEST_USER_ID,
          p_ultimate_request_id: TEST_ULTIMATE_MEDIUM_REQUEST_ID,
          p_duration_days: 365,
          p_start_date: new Date().toISOString().split('T')[0]
        });

      expect(activationError).toBeNull();
      expect(activationResult?.success).toBe(true);
      expect(activationResult?.initial_deposit_amount).toBe(1);

      // Verify initial Pilates deposit was created with correct amount
      const { data: deposits, error: depositsError } = await supabase
        .from('pilates_deposits')
        .select('*')
        .eq('user_id', TEST_USER_ID)
        .eq('is_active', true);

      expect(depositsError).toBeNull();
      expect(deposits).toHaveLength(1);
      expect(deposits?.[0]?.deposit_remaining).toBe(1);
    });
  });

  describe('Weekly Refill Processing', () => {
    beforeEach(async () => {
      // Enable feature flag for refill tests
      await supabase
        .from('feature_flags')
        .update({ is_enabled: true })
        .eq('name', 'weekly_pilates_refill_enabled');
    });

    it('should process weekly refills for Ultimate package', async () => {
      // Create Ultimate membership with activation date 7 days ago
      const activationDate = new Date();
      activationDate.setDate(activationDate.getDate() - 7);

      const { data: activationResult } = await supabase
        .rpc('create_ultimate_dual_memberships', {
          p_user_id: TEST_USER_ID,
          p_ultimate_request_id: TEST_ULTIMATE_REQUEST_ID,
          p_duration_days: 365,
          p_start_date: activationDate.toISOString().split('T')[0]
        });

      // Manually reduce deposit to test top-up
      await supabase
        .from('pilates_deposits')
        .update({ deposit_remaining: 1 })
        .eq('user_id', TEST_USER_ID)
        .eq('is_active', true);

      // Process weekly refills
      const { data: refillResult, error: refillError } = await supabase
        .rpc('process_weekly_pilates_refills');

      expect(refillError).toBeNull();
      expect(refillResult?.[0]?.success_count).toBeGreaterThan(0);

      // Verify deposit was topped up
      const { data: deposits } = await supabase
        .from('pilates_deposits')
        .select('deposit_remaining')
        .eq('user_id', TEST_USER_ID)
        .eq('is_active', true);

      expect(deposits?.[0]?.deposit_remaining).toBe(3);

      // Verify refill was recorded
      const { data: refillRecords } = await supabase
        .from('ultimate_weekly_refills')
        .select('*')
        .eq('user_id', TEST_USER_ID);

      expect(refillRecords).toHaveLength(1);
      expect(refillRecords?.[0]?.new_deposit_amount).toBe(3);
      expect(refillRecords?.[0]?.previous_deposit_amount).toBe(1);
    });

    it('should process weekly refills for Ultimate Medium package', async () => {
      // Create Ultimate Medium membership with activation date 7 days ago
      const activationDate = new Date();
      activationDate.setDate(activationDate.getDate() - 7);

      const { data: activationResult } = await supabase
        .rpc('create_ultimate_dual_memberships', {
          p_user_id: TEST_USER_ID,
          p_ultimate_request_id: TEST_ULTIMATE_MEDIUM_REQUEST_ID,
          p_duration_days: 365,
          p_start_date: activationDate.toISOString().split('T')[0]
        });

      // Manually reduce deposit to test top-up
      await supabase
        .from('pilates_deposits')
        .update({ deposit_remaining: 0 })
        .eq('user_id', TEST_USER_ID)
        .eq('is_active', true);

      // Process weekly refills
      const { data: refillResult, error: refillError } = await supabase
        .rpc('process_weekly_pilates_refills');

      expect(refillError).toBeNull();
      expect(refillResult?.[0]?.success_count).toBeGreaterThan(0);

      // Verify deposit was topped up
      const { data: deposits } = await supabase
        .from('pilates_deposits')
        .select('deposit_remaining')
        .eq('user_id', TEST_USER_ID)
        .eq('is_active', true);

      expect(deposits?.[0]?.deposit_remaining).toBe(1);
    });

    it('should be idempotent - not refill twice in same week', async () => {
      // Create Ultimate membership with activation date 7 days ago
      const activationDate = new Date();
      activationDate.setDate(activationDate.getDate() - 7);

      await supabase
        .rpc('create_ultimate_dual_memberships', {
          p_user_id: TEST_USER_ID,
          p_ultimate_request_id: TEST_ULTIMATE_REQUEST_ID,
          p_duration_days: 365,
          p_start_date: activationDate.toISOString().split('T')[0]
        });

      // Process refills first time
      const { data: firstResult } = await supabase
        .rpc('process_weekly_pilates_refills');

      const firstSuccessCount = firstResult?.[0]?.success_count || 0;

      // Process refills second time immediately
      const { data: secondResult } = await supabase
        .rpc('process_weekly_pilates_refills');

      const secondSuccessCount = secondResult?.[0]?.success_count || 0;

      // Second run should not process any refills
      expect(secondSuccessCount).toBe(0);
    });

    it('should not refill when deposits are already sufficient', async () => {
      // Create Ultimate membership with activation date 7 days ago
      const activationDate = new Date();
      activationDate.setDate(activationDate.getDate() - 7);

      await supabase
        .rpc('create_ultimate_dual_memberships', {
          p_user_id: TEST_USER_ID,
          p_ultimate_request_id: TEST_ULTIMATE_REQUEST_ID,
          p_duration_days: 365,
          p_start_date: activationDate.toISOString().split('T')[0]
        });

      // Manually increase deposit above target
      await supabase
        .from('pilates_deposits')
        .update({ deposit_remaining: 5 })
        .eq('user_id', TEST_USER_ID)
        .eq('is_active', true);

      // Process weekly refills
      const { data: refillResult } = await supabase
        .rpc('process_weekly_pilates_refills');

      // Should not process any refills since deposit is already sufficient
      expect(refillResult?.[0]?.success_count).toBe(0);

      // Verify deposit amount didn't change
      const { data: deposits } = await supabase
        .from('pilates_deposits')
        .select('deposit_remaining')
        .eq('user_id', TEST_USER_ID)
        .eq('is_active', true);

      expect(deposits?.[0]?.deposit_remaining).toBe(5);
    });
  });

  describe('Helper Functions', () => {
    beforeEach(async () => {
      // Create Ultimate membership
      await supabase
        .rpc('create_ultimate_dual_memberships', {
          p_user_id: TEST_USER_ID,
          p_ultimate_request_id: TEST_ULTIMATE_REQUEST_ID,
          p_duration_days: 365,
          p_start_date: new Date().toISOString().split('T')[0]
        });
    });

    it('should get user weekly refill status', async () => {
      const { data: status, error } = await supabase
        .rpc('get_user_weekly_refill_status', {
          p_user_id: TEST_USER_ID
        });

      expect(error).toBeNull();
      expect(status).toHaveLength(1);
      expect(status?.[0]?.user_id).toBe(TEST_USER_ID);
      expect(status?.[0]?.package_name).toBe('Ultimate');
      expect(status?.[0]?.target_deposit_amount).toBe(3);
    });

    it('should manually trigger weekly refill', async () => {
      const { data: result, error } = await supabase
        .rpc('manual_trigger_weekly_refill', {
          p_user_id: TEST_USER_ID
        });

      expect(error).toBeNull();
      expect(result?.[0]?.success).toBe(true);
    });

    it('should return error for non-Ultimate user', async () => {
      const { data: result, error } = await supabase
        .rpc('manual_trigger_weekly_refill', {
          p_user_id: '99999999-9999-9999-9999-999999999999'
        });

      expect(error).toBeNull();
      expect(result?.[0]?.success).toBe(false);
      expect(result?.[0]?.message).toContain('No active Ultimate membership');
    });
  });

  describe('Edge Cases', () => {
    it('should not process refills when feature is disabled', async () => {
      // Disable feature flag
      await supabase
        .from('feature_flags')
        .update({ is_enabled: false })
        .eq('name', 'weekly_pilates_refill_enabled');

      // Create Ultimate membership
      const activationDate = new Date();
      activationDate.setDate(activationDate.getDate() - 7);

      await supabase
        .rpc('create_ultimate_dual_memberships', {
          p_user_id: TEST_USER_ID,
          p_ultimate_request_id: TEST_ULTIMATE_REQUEST_ID,
          p_duration_days: 365,
          p_start_date: activationDate.toISOString().split('T')[0]
        });

      // Process weekly refills
      const { data: refillResult } = await supabase
        .rpc('process_weekly_pilates_refills');

      // Should not process any refills
      expect(refillResult?.[0]?.processed_count).toBe(0);
      expect(refillResult?.[0]?.details?.error).toBe('Feature disabled');
    });

    it('should handle expired memberships', async () => {
      // Create Ultimate membership with expired date
      const activationDate = new Date();
      activationDate.setDate(activationDate.getDate() - 400); // Expired

      await supabase
        .rpc('create_ultimate_dual_memberships', {
          p_user_id: TEST_USER_ID,
          p_ultimate_request_id: TEST_ULTIMATE_REQUEST_ID,
          p_duration_days: 365,
          p_start_date: activationDate.toISOString().split('T')[0]
        });

      // Process weekly refills
      const { data: refillResult } = await supabase
        .rpc('process_weekly_pilates_refills');

      // Should not process refills for expired membership
      expect(refillResult?.[0]?.processed_count).toBe(0);
    });
  });

  // Helper functions
  async function setupTestData() {
    // Create test user profile
    await supabase
      .from('user_profiles')
      .upsert({
        user_id: TEST_USER_ID,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com'
      });

    // Create test Ultimate package request
    const { data: ultimatePackage } = await supabase
      .from('membership_packages')
      .select('id')
      .eq('name', 'Ultimate')
      .single();

    if (ultimatePackage) {
      await supabase
        .from('membership_requests')
        .upsert({
          id: TEST_ULTIMATE_REQUEST_ID,
          user_id: TEST_USER_ID,
          package_id: ultimatePackage.id,
          duration_type: 'ultimate_1year',
          requested_price: 500.00,
          status: 'approved'
        });
    }

    // Create test Ultimate Medium package request
    const { data: ultimateMediumPackage } = await supabase
      .from('membership_packages')
      .select('id')
      .eq('name', 'Ultimate Medium')
      .single();

    if (ultimateMediumPackage) {
      await supabase
        .from('membership_requests')
        .upsert({
          id: TEST_ULTIMATE_MEDIUM_REQUEST_ID,
          user_id: TEST_USER_ID,
          package_id: ultimateMediumPackage.id,
          duration_type: 'ultimate_medium_1year',
          requested_price: 400.00,
          status: 'approved'
        });
    }
  }

  async function cleanupTestData() {
    // Clean up in reverse order of dependencies
    await supabase
      .from('ultimate_weekly_refills')
      .delete()
      .eq('user_id', TEST_USER_ID);

    await supabase
      .from('pilates_deposits')
      .delete()
      .eq('user_id', TEST_USER_ID);

    await supabase
      .from('memberships')
      .delete()
      .eq('source_request_id', TEST_ULTIMATE_REQUEST_ID);

    await supabase
      .from('memberships')
      .delete()
      .eq('source_request_id', TEST_ULTIMATE_MEDIUM_REQUEST_ID);

    await supabase
      .from('membership_requests')
      .delete()
      .eq('id', TEST_ULTIMATE_REQUEST_ID);

    await supabase
      .from('membership_requests')
      .delete()
      .eq('id', TEST_ULTIMATE_MEDIUM_REQUEST_ID);

    await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', TEST_USER_ID);
  }
});
