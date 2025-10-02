import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    }))
  }))
};

vi.mock('@/config/supabase', () => ({
  supabase: mockSupabase
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Import after mocking
import { 
  createMembershipRequest, 
  createPilatesMembershipRequest, 
  createUltimateMembershipRequest 
} from '@/utils/membershipApi';

describe('Installments API Functions', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
  });

  describe('createMembershipRequest', () => {
    it('should create request without installments by default', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      });

      await createMembershipRequest('package-id', 'year', 150, false);

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        package_id: 'package-id',
        duration_type: 'year',
        requested_price: 150,
        status: 'pending'
      });
    });

    it('should create request with installments when enabled', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      });

      await createMembershipRequest('package-id', 'year', 150, true);

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        package_id: 'package-id',
        duration_type: 'year',
        requested_price: 150,
        status: 'pending',
        has_installments: true,
        installment_1_amount: 0,
        installment_2_amount: 0,
        installment_3_amount: 0,
        installment_1_payment_method: 'cash',
        installment_2_payment_method: 'cash',
        installment_3_payment_method: 'cash'
      });
    });
  });

  describe('createPilatesMembershipRequest', () => {
    it('should create Pilates request without installments by default', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      });

      await createPilatesMembershipRequest('pilates-id', 'pilates_6months', 25, 190, 'test-user-id', false);

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        package_id: 'pilates-id',
        duration_type: 'pilates_6months',
        requested_price: 190,
        classes_count: 25,
        status: 'pending'
      });
    });

    it('should create Pilates request with installments when enabled', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      });

      await createPilatesMembershipRequest('pilates-id', 'pilates_1year', 50, 350, 'test-user-id', true);

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        package_id: 'pilates-id',
        duration_type: 'pilates_1year',
        requested_price: 350,
        classes_count: 50,
        status: 'pending',
        has_installments: true,
        installment_1_amount: 0,
        installment_2_amount: 0,
        installment_3_amount: 0,
        installment_1_payment_method: 'cash',
        installment_2_payment_method: 'cash',
        installment_3_payment_method: 'cash'
      });
    });
  });

  describe('createUltimateMembershipRequest', () => {
    it('should create Ultimate request with installments when enabled', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockSelect = vi.fn().mockResolvedValue({
        data: { id: 'ultimate-package-id' },
        error: null
      });
      
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'membership_packages') {
          return {
            select: mockSelect,
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'ultimate-package-id' },
              error: null
            })
          };
        }
        return {
          insert: mockInsert
        };
      });

      await createUltimateMembershipRequest('Ultimate', 'ultimate_1year', 1200, true, 'test-user-id');

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        package_id: 'ultimate-package-id',
        duration_type: 'ultimate_1year',
        requested_price: 1200,
        has_installments: true,
        status: 'pending',
        installment_1_amount: 0,
        installment_2_amount: 0,
        installment_3_amount: 0,
        installment_1_payment_method: 'cash',
        installment_2_payment_method: 'cash',
        installment_3_payment_method: 'cash'
      });
    });
  });
});
