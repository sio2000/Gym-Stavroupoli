/**
 * Integration tests for the installment plan feature
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
          single: jest.fn(),
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

describe('Installment Plan Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-end user flow', () => {
    it('should show menu item and allow access for users with approved installment plans', async () => {
      const { supabase } = require('@/config/supabase');
      
      // Mock authenticated user with approved installment plan
      supabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'user-with-plan' } 
          } 
        },
        error: null,
      });

      const mockMembershipRequest = {
        id: 'request-123',
        user_id: 'user-with-plan',
        status: 'approved',
        has_installments: true,
        installment_1_amount: 100.00,
        installment_2_amount: 100.00,
        installment_3_amount: 100.00,
        installment_1_paid: false,
        installment_2_paid: false,
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
              data: { user_id: 'user-with-plan', role: 'user' },
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
      
      // Verify the response structure matches the expected API contract
      expect(responseData).toHaveProperty('userId', 'user-with-plan');
      expect(responseData).toHaveProperty('subscriptionId', 'request-123');
      expect(responseData).toHaveProperty('status', 'approved');
      expect(responseData).toHaveProperty('total_amount', 300.00);
      expect(responseData).toHaveProperty('total_paid', 0.00);
      expect(responseData).toHaveProperty('remaining', 300.00);
      expect(responseData).toHaveProperty('installments');
      expect(Array.isArray(responseData.installments)).toBe(true);
      expect(responseData.installments).toHaveLength(3);

      // Verify installment structure
      const installment = responseData.installments[0];
      expect(installment).toHaveProperty('installment_number');
      expect(installment).toHaveProperty('due_date');
      expect(installment).toHaveProperty('amount');
      expect(installment).toHaveProperty('status');
      expect(['locked', 'paid', 'overdue']).toContain(installment.status);
    });

    it('should hide menu item and deny access for users without approved installment plans', async () => {
      const { supabase } = require('@/config/supabase');
      
      // Mock authenticated user without installment plan
      supabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'user-without-plan' } 
          } 
        },
        error: null,
      });

      // Mock user profile
      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { user_id: 'user-without-plan', role: 'user' },
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
      const responseData = JSON.parse(res._getData());
      expect(responseData.message).toBe('Δεν υπάρχει ενεργό πλάνο δόσεων για τον λογαριασμό σας');
    });

    it('should deny access for users with installment plans but no locked installments', async () => {
      const { supabase } = require('@/config/supabase');
      
      // Mock authenticated user with installment plan but no locked installments
      supabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'user-no-locked' } 
          } 
        },
        error: null,
      });

      const mockMembershipRequest = {
        id: 'request-456',
        user_id: 'user-no-locked',
        status: 'approved',
        has_installments: true,
        installment_1_amount: 100.00,
        installment_2_amount: 100.00,
        installment_3_amount: 100.00,
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
          id: 'pkg-456',
          name: 'Free Gym',
          description: 'Free Gym Package',
        },
      };

      // Mock user profile
      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { user_id: 'user-no-locked', role: 'user' },
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
      const responseData = JSON.parse(res._getData());
      expect(responseData.message).toBe('Δεν υπάρχει ενεργό πλάνο δόσεων για τον λογαριασμό σας');
    });
  });

  describe('Security and authorization', () => {
    it('should prevent unauthorized access', async () => {
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
      const responseData = JSON.parse(res._getData());
      expect(responseData.message).toBe('Unauthorized');
    });

    it('should only return data for the authenticated user', async () => {
      const { supabase } = require('@/config/supabase');
      
      // Mock authenticated user
      supabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'authenticated-user' } 
          } 
        },
        error: null,
      });

      const mockMembershipRequest = {
        id: 'request-123',
        user_id: 'authenticated-user', // Should match the authenticated user
        status: 'approved',
        has_installments: true,
        installment_1_amount: 100.00,
        installment_1_paid: false,
        installment_1_locked: true,
        installment_1_due_date: '2024-02-01',
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
              data: { user_id: 'authenticated-user', role: 'user' },
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
      
      // Verify that the returned data belongs to the authenticated user
      expect(responseData.userId).toBe('authenticated-user');
    });
  });

  describe('Data integrity and edge cases', () => {
    it('should handle deleted third installment correctly', async () => {
      const { supabase } = require('@/config/supabase');
      
      supabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'user-deleted-third' } 
          } 
        },
        error: null,
      });

      const mockMembershipRequest = {
        id: 'request-789',
        user_id: 'user-deleted-third',
        status: 'approved',
        has_installments: true,
        installment_1_amount: 100.00,
        installment_2_amount: 100.00,
        installment_3_amount: 100.00,
        installment_1_paid: false,
        installment_2_paid: false,
        installment_3_paid: false,
        installment_1_locked: true,
        installment_2_locked: true,
        installment_3_locked: false,
        installment_1_due_date: '2024-02-01',
        installment_2_due_date: '2024-03-01',
        installment_3_due_date: '2024-04-01',
        third_installment_deleted: true, // Third installment is deleted
        package: {
          id: 'pkg-789',
          name: 'Free Gym',
          description: 'Free Gym Package',
        },
      };

      // Mock user profile
      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { user_id: 'user-deleted-third', role: 'user' },
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
      
      // Should only include 2 installments (third is deleted)
      expect(responseData.installments).toHaveLength(2);
      expect(responseData.total_amount).toBe(200.00); // Only first two installments
      expect(responseData.installments[0].installment_number).toBe(1);
      expect(responseData.installments[1].installment_number).toBe(2);
    });

    it('should calculate totals correctly with mixed payment statuses', async () => {
      const { supabase } = require('@/config/supabase');
      
      supabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'user-mixed-payments' } 
          } 
        },
        error: null,
      });

      const mockMembershipRequest = {
        id: 'request-mixed',
        user_id: 'user-mixed-payments',
        status: 'approved',
        has_installments: true,
        installment_1_amount: 50.00,
        installment_2_amount: 75.00,
        installment_3_amount: 25.00,
        installment_1_paid: true,  // Paid
        installment_2_paid: false, // Not paid
        installment_3_paid: true,  // Paid
        installment_1_locked: true,
        installment_2_locked: true,
        installment_3_locked: true,
        installment_1_due_date: '2024-02-01',
        installment_2_due_date: '2024-03-01',
        installment_3_due_date: '2024-04-01',
        third_installment_deleted: false,
        package: {
          id: 'pkg-mixed',
          name: 'Free Gym',
          description: 'Free Gym Package',
        },
      };

      // Mock user profile
      const mockFrom = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { user_id: 'user-mixed-payments', role: 'user' },
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
      
      // Verify calculations
      expect(responseData.total_amount).toBe(150.00); // 50 + 75 + 25
      expect(responseData.total_paid).toBe(75.00);    // 50 + 25 (first and third paid)
      expect(responseData.remaining).toBe(75.00);     // 150 - 75
      
      // Verify installment statuses
      expect(responseData.installments[0].status).toBe('paid');
      expect(responseData.installments[1].status).toBe('locked');
      expect(responseData.installments[2].status).toBe('paid');
    });
  });
});
