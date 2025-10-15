/**
 * Unit tests for the user installment plan API endpoint
 */

import { createMocks } from 'node-mocks-http';
import handler from '@/api/userInstallmentPlan';

// Mock Supabase
jest.mock('@/config/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          not: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                single: jest.fn(),
              })),
            })),
          })),
        })),
      })),
    })),
  },
}));

describe('/api/userInstallmentPlan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 405 for non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Method not allowed',
    });
  });

  it('should return 401 when user is not authenticated', async () => {
    const { supabase } = require('@/config/supabase');
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Unauthorized',
    });
  });

  it('should return 404 when user has no installment plan', async () => {
    const { supabase } = require('@/config/supabase');
    
    // Mock authenticated user
    supabase.auth.getSession.mockResolvedValue({
      data: { 
        session: { 
          user: { id: 'user-123' } 
        } 
      },
      error: null,
    });

    // Mock user profile
    const mockFrom = jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'user-123', role: 'user' },
            error: null,
          }),
        })),
      })),
    }));

    supabase.from.mockImplementation((table) => {
      if (table === 'user_profiles') {
        return mockFrom();
      }
      if (table === 'membership_requests') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  not: jest.fn(() => ({
                    order: jest.fn(() => ({
                      limit: jest.fn(() => ({
                        single: jest.fn().mockRejectedValue({
                          code: 'PGRST116', // No rows found
                        }),
                      })),
                    })),
                  })),
                })),
              })),
            })),
          })),
        };
      }
      return mockFrom();
    });

    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Δεν υπάρχει ενεργό πλάνο δόσεων για τον λογαριασμό σας',
    });
  });

  it('should return installment plan data for user with approved plan', async () => {
    const { supabase } = require('@/config/supabase');
    
    // Mock authenticated user
    supabase.auth.getSession.mockResolvedValue({
      data: { 
        session: { 
          user: { id: 'user-123' } 
        } 
      },
      error: null,
    });

    const mockMembershipRequest = {
      id: 'request-123',
      user_id: 'user-123',
      status: 'approved',
      has_installments: true,
      installment_1_amount: 50.00,
      installment_2_amount: 50.00,
      installment_3_amount: 50.00,
      installment_1_paid: false,
      installment_2_paid: true,
      installment_3_paid: false,
      installment_1_locked: true,
      installment_2_locked: true,
      installment_3_locked: false,
      installment_1_due_date: '2024-02-01',
      installment_2_due_date: '2024-03-01',
      installment_3_due_date: '2024-04-01',
      third_installment_deleted: false,
      package: {
        id: 'pkg-123',
        name: 'Free Gym',
        description: 'Free Gym Package',
      },
    };

    // Mock user profile
    const mockFrom = jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'user-123', role: 'user' },
            error: null,
          }),
        })),
      })),
    }));

    supabase.from.mockImplementation((table) => {
      if (table === 'user_profiles') {
        return mockFrom();
      }
      if (table === 'membership_requests') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  not: jest.fn(() => ({
                    order: jest.fn(() => ({
                      limit: jest.fn(() => ({
                        single: jest.fn().mockResolvedValue({
                          data: mockMembershipRequest,
                          error: null,
                        }),
                      })),
                    })),
                  })),
                })),
              })),
            })),
          })),
        };
      }
      return mockFrom();
    });

    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    
    expect(responseData).toEqual({
      userId: 'user-123',
      subscriptionId: 'request-123',
      status: 'approved',
      total_amount: 150.00,
      total_paid: 50.00,
      remaining: 100.00,
      installments: [
        {
          installment_number: 1,
          due_date: '2024-02-01',
          amount: 50.00,
          status: 'locked',
        },
        {
          installment_number: 2,
          due_date: '2024-03-01',
          amount: 50.00,
          status: 'paid',
        },
        {
          installment_number: 3,
          due_date: '2024-04-01',
          amount: 50.00,
          status: 'overdue',
        },
      ],
    });
  });

  it('should return 404 when user has no locked installments', async () => {
    const { supabase } = require('@/config/supabase');
    
    // Mock authenticated user
    supabase.auth.getSession.mockResolvedValue({
      data: { 
        session: { 
          user: { id: 'user-123' } 
        } 
      },
      error: null,
    });

    const mockMembershipRequest = {
      id: 'request-123',
      user_id: 'user-123',
      status: 'approved',
      has_installments: true,
      installment_1_amount: 50.00,
      installment_2_amount: 50.00,
      installment_3_amount: 50.00,
      installment_1_paid: false,
      installment_2_paid: false,
      installment_3_paid: false,
      installment_1_locked: false, // No locked installments
      installment_2_locked: false,
      installment_3_locked: false,
      installment_1_due_date: '2024-02-01',
      installment_2_due_date: '2024-03-01',
      installment_3_due_date: '2024-04-01',
      third_installment_deleted: false,
      package: {
        id: 'pkg-123',
        name: 'Free Gym',
        description: 'Free Gym Package',
      },
    };

    // Mock user profile
    const mockFrom = jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'user-123', role: 'user' },
            error: null,
          }),
        })),
      })),
    }));

    supabase.from.mockImplementation((table) => {
      if (table === 'user_profiles') {
        return mockFrom();
      }
      if (table === 'membership_requests') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  not: jest.fn(() => ({
                    order: jest.fn(() => ({
                      limit: jest.fn(() => ({
                        single: jest.fn().mockResolvedValue({
                          data: mockMembershipRequest,
                          error: null,
                        }),
                      })),
                    })),
                  })),
                })),
              })),
            })),
          })),
        };
      }
      return mockFrom();
    });

    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Δεν υπάρχει ενεργό πλάνο δόσεων για τον λογαριασμό σας',
    });
  });
});
