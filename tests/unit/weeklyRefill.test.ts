import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  processWeeklyRefills,
  getUserWeeklyRefillStatus,
  manualTriggerWeeklyRefill,
  getWeeklyRefillFeatureStatus,
  toggleWeeklyRefillFeature,
  WeeklyRefillStatus,
  RefillResult,
  ManualRefillResult
} from '../../src/utils/weeklyRefillApi';

// Mock supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  rpc: vi.fn(),
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn()
    })),
    insert: vi.fn(),
    delete: vi.fn()
  }))
};

vi.mock('../../src/utils/supabaseClient', () => ({
  supabase: mockSupabase
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}));

describe('WeeklyRefillApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUserWeeklyRefillStatus', () => {
    it('should return refill status for authenticated user', async () => {
      const mockUser = { id: 'user-123' };
      const mockStatus: WeeklyRefillStatus = {
        user_id: 'user-123',
        package_name: 'Ultimate',
        activation_date: '2024-01-01',
        next_refill_date: '2024-01-08',
        next_refill_week: 2,
        current_deposit_amount: 2,
        target_deposit_amount: 3,
        is_refill_due: true
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.rpc.mockResolvedValue({ data: [mockStatus], error: null });

      const result = await getUserWeeklyRefillStatus();

      expect(result).toEqual(mockStatus);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_weekly_refill_status', {
        p_user_id: 'user-123'
      });
    });

    it('should return null for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await getUserWeeklyRefillStatus();

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const mockUser = { id: 'user-123' };
      const mockError = new Error('Database error');

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.rpc.mockResolvedValue({ data: null, error: mockError });

      const result = await getUserWeeklyRefillStatus();

      expect(result).toBeNull();
    });
  });

  describe('manualTriggerWeeklyRefill', () => {
    it('should successfully trigger manual refill', async () => {
      const mockUser = { id: 'user-123' };
      const mockResult: ManualRefillResult = {
        success: true,
        message: 'Refill processed successfully',
        details: { user_id: 'user-123', new_amount: 3 }
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.rpc.mockResolvedValue({ data: [mockResult], error: null });

      const result = await manualTriggerWeeklyRefill();

      expect(result).toEqual(mockResult);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('manual_trigger_weekly_refill', {
        p_user_id: 'user-123'
      });
    });

    it('should handle failed refill', async () => {
      const mockUser = { id: 'user-123' };
      const mockResult: ManualRefillResult = {
        success: false,
        message: 'No active Ultimate membership found',
        details: {}
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.rpc.mockResolvedValue({ data: [mockResult], error: null });

      const result = await manualTriggerWeeklyRefill();

      expect(result).toEqual(mockResult);
    });
  });

  describe('processWeeklyRefills', () => {
    it('should process weekly refills successfully', async () => {
      const mockResult: RefillResult = {
        processed_count: 5,
        success_count: 4,
        error_count: 1,
        details: [
          { user_id: 'user-1', success: true },
          { user_id: 'user-2', error: 'No deposit found' }
        ]
      };

      mockSupabase.rpc.mockResolvedValue({ data: [mockResult], error: null });

      const result = await processWeeklyRefills();

      expect(result).toEqual(mockResult);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('process_weekly_pilates_refills');
    });

    it('should handle processing errors', async () => {
      const mockError = new Error('Processing failed');
      mockSupabase.rpc.mockResolvedValue({ data: null, error: mockError });

      const result = await processWeeklyRefills();

      expect(result).toBeNull();
    });
  });

  describe('getWeeklyRefillFeatureStatus', () => {
    it('should return feature status', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { is_enabled: true }, error: null })
          }))
        }))
      });

      const result = await getWeeklyRefillFeatureStatus();

      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
          }))
        }))
      });

      const result = await getWeeklyRefillFeatureStatus();

      expect(result).toBe(false);
    });
  });

  describe('toggleWeeklyRefillFeature', () => {
    it('should toggle feature to enabled', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      });

      const result = await toggleWeeklyRefillFeature(true);

      expect(result).toBe(true);
    });

    it('should toggle feature to disabled', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      });

      const result = await toggleWeeklyRefillFeature(false);

      expect(result).toBe(true);
    });

    it('should handle toggle errors', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') })
        }))
      });

      const result = await toggleWeeklyRefillFeature(true);

      expect(result).toBe(false);
    });
  });
});

// Integration tests for edge cases
describe('WeeklyRefillApi Edge Cases', () => {
  describe('Ultimate Package Logic', () => {
    it('should handle Ultimate package (3 lessons per week)', async () => {
      const mockStatus: WeeklyRefillStatus = {
        user_id: 'user-123',
        package_name: 'Ultimate',
        activation_date: '2024-01-01',
        next_refill_date: '2024-01-08',
        next_refill_week: 2,
        current_deposit_amount: 1,
        target_deposit_amount: 3,
        is_refill_due: true
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
      mockSupabase.rpc.mockResolvedValue({ data: [mockStatus], error: null });

      const result = await getUserWeeklyRefillStatus();

      expect(result?.target_deposit_amount).toBe(3);
      expect(result?.is_refill_due).toBe(true);
    });

    it('should handle Ultimate Medium package (1 lesson per week)', async () => {
      const mockStatus: WeeklyRefillStatus = {
        user_id: 'user-123',
        package_name: 'Ultimate Medium',
        activation_date: '2024-01-01',
        next_refill_date: '2024-01-08',
        next_refill_week: 2,
        current_deposit_amount: 0,
        target_deposit_amount: 1,
        is_refill_due: true
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
      mockSupabase.rpc.mockResolvedValue({ data: [mockStatus], error: null });

      const result = await getUserWeeklyRefillStatus();

      expect(result?.target_deposit_amount).toBe(1);
      expect(result?.package_name).toBe('Ultimate Medium');
    });
  });

  describe('Refill Timing Logic', () => {
    it('should handle refill due today', async () => {
      const today = new Date();
      const mockStatus: WeeklyRefillStatus = {
        user_id: 'user-123',
        package_name: 'Ultimate',
        activation_date: today.toISOString().split('T')[0],
        next_refill_date: today.toISOString().split('T')[0],
        next_refill_week: 1,
        current_deposit_amount: 2,
        target_deposit_amount: 3,
        is_refill_due: true
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
      mockSupabase.rpc.mockResolvedValue({ data: [mockStatus], error: null });

      const result = await getUserWeeklyRefillStatus();

      expect(result?.is_refill_due).toBe(true);
    });

    it('should handle refill not due yet', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      
      const mockStatus: WeeklyRefillStatus = {
        user_id: 'user-123',
        package_name: 'Ultimate',
        activation_date: '2024-01-01',
        next_refill_date: futureDate.toISOString().split('T')[0],
        next_refill_week: 2,
        current_deposit_amount: 3,
        target_deposit_amount: 3,
        is_refill_due: false
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
      mockSupabase.rpc.mockResolvedValue({ data: [mockStatus], error: null });

      const result = await getUserWeeklyRefillStatus();

      expect(result?.is_refill_due).toBe(false);
    });
  });

  describe('Deposit Amount Logic', () => {
    it('should handle user with sufficient deposits', async () => {
      const mockStatus: WeeklyRefillStatus = {
        user_id: 'user-123',
        package_name: 'Ultimate',
        activation_date: '2024-01-01',
        next_refill_date: '2024-01-08',
        next_refill_week: 2,
        current_deposit_amount: 5, // More than target
        target_deposit_amount: 3,
        is_refill_due: true
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
      mockSupabase.rpc.mockResolvedValue({ data: [mockStatus], error: null });

      const result = await getUserWeeklyRefillStatus();

      expect(result?.current_deposit_amount).toBeGreaterThanOrEqual(result?.target_deposit_amount || 0);
    });

    it('should handle user with zero deposits', async () => {
      const mockStatus: WeeklyRefillStatus = {
        user_id: 'user-123',
        package_name: 'Ultimate',
        activation_date: '2024-01-01',
        next_refill_date: '2024-01-08',
        next_refill_week: 2,
        current_deposit_amount: 0,
        target_deposit_amount: 3,
        is_refill_due: true
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
      mockSupabase.rpc.mockResolvedValue({ data: [mockStatus], error: null });

      const result = await getUserWeeklyRefillStatus();

      expect(result?.current_deposit_amount).toBe(0);
      expect(result?.is_refill_due).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'));

      const result = await getUserWeeklyRefillStatus();

      expect(result).toBeNull();
    });

    it('should handle malformed responses', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const result = await getUserWeeklyRefillStatus();

      expect(result).toBeNull();
    });
  });
});
