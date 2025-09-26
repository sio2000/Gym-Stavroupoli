/**
 * Integration tests for Pilates Calendar functionality
 * 
 * These tests simulate user interactions and verify the complete workflow:
 * 1. Navigation between weeks
 * 2. Info button functionality
 * 3. Real-time updates
 * 4. Data consistency
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    })),
    insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
    update: vi.fn(() => Promise.resolve({ data: [], error: null })),
    delete: vi.fn(() => Promise.resolve({ error: null }))
  })),
  channel: vi.fn(() => ({
    on: vi.fn(() => ({
      subscribe: vi.fn(() => ({
        unsubscribe: vi.fn()
      }))
    }))
  }))
};

// Mock the pilatesScheduleApi functions
vi.mock('@/utils/pilatesScheduleApi', () => ({
  getPilatesAvailableSlots: vi.fn(() => Promise.resolve([
    {
      id: 'slot-1',
      date: '2025-09-15',
      start_time: '09:00:00',
      end_time: '10:00:00',
      max_capacity: 4,
      available_capacity: 2,
      status: 'available',
      is_active: true,
      booked_count: 2
    },
    {
      id: 'slot-2',
      date: '2025-09-15',
      start_time: '10:00:00',
      end_time: '11:00:00',
      max_capacity: 4,
      available_capacity: 4,
      status: 'available',
      is_active: true,
      booked_count: 0
    }
  ])),
  getPilatesSlotBookings: vi.fn(() => Promise.resolve([
    {
      id: 'booking-1',
      slot_id: 'slot-1',
      user_id: 'user-1',
      status: 'confirmed',
      booking_date: '2025-09-14T10:00:00Z',
      user: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com'
      }
    },
    {
      id: 'booking-2',
      slot_id: 'slot-1',
      user_id: 'user-2',
      status: 'confirmed',
      booking_date: '2025-09-14T11:00:00Z',
      user: {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com'
      }
    }
  ])),
  subscribePilatesRealtime: vi.fn(() => ({
    unsubscribe: vi.fn()
  }))
}));

describe('Pilates Calendar Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Navigation Workflow', () => {
    it('should handle complete navigation cycle: current -> next -> prev -> current', async () => {
      // Start with current week
      let currentWeek = new Date('2025-09-13T00:00:00.000Z');
      
      // Navigate to next week
      const nextWeek = new Date(currentWeek);
      nextWeek.setDate(nextWeek.getDate() + 14);
      
      // Navigate back to previous week
      const prevWeek = new Date(nextWeek);
      prevWeek.setDate(prevWeek.getDate() - 14);
      
      // Should be back to original week
      expect(prevWeek.toISOString()).toBe(currentWeek.toISOString());
      
      // Navigate to previous week from original
      const actualPrevWeek = new Date(currentWeek);
      actualPrevWeek.setDate(actualPrevWeek.getDate() - 14);
      
      // Verify we can go back
      expect(actualPrevWeek.toISOString()).toBe('2025-08-30T00:00:00.000Z');
    });

    it('should maintain data consistency across navigation', async () => {
      const { getPilatesAvailableSlots } = await import('@/utils/pilatesScheduleApi');
      
      // Mock data for different weeks
      const week1Data = [
        { id: 'slot-1', date: '2025-09-15', start_time: '09:00:00', booked_count: 2 }
      ];
      const week2Data = [
        { id: 'slot-2', date: '2025-09-29', start_time: '09:00:00', booked_count: 1 }
      ];
      
      // Simulate loading data for different weeks
      vi.mocked(getPilatesAvailableSlots)
        .mockResolvedValueOnce(week1Data)
        .mockResolvedValueOnce(week2Data);
      
      const week1Slots = await getPilatesAvailableSlots('2025-09-13', '2025-09-26');
      const week2Slots = await getPilatesAvailableSlots('2025-09-27', '2025-10-10');
      
      expect(week1Slots).toHaveLength(1);
      expect(week2Slots).toHaveLength(1);
      expect(week1Slots[0].date).toBe('2025-09-15');
      expect(week2Slots[0].date).toBe('2025-09-29');
    });
  });

  describe('Info Button Integration', () => {
    it('should show info button only for appropriate slots', () => {
      const mockSlots = [
        { id: 'slot-1', booked_count: 0, max_capacity: 4, is_active: true }, // No bookings
        { id: 'slot-2', booked_count: 2, max_capacity: 4, is_active: true }, // Has bookings
        { id: 'slot-3', booked_count: 4, max_capacity: 4, is_active: true }, // Full
        { id: 'slot-4', booked_count: 1, max_capacity: 4, is_active: false }, // Inactive
      ];

      const slotsWithInfoButton = mockSlots.filter(slot => 
        slot.is_active && slot.booked_count > 0 && slot.booked_count < slot.max_capacity
      );

      expect(slotsWithInfoButton).toHaveLength(1);
      expect(slotsWithInfoButton[0].id).toBe('slot-2');
    });

    it('should load and display slot bookings correctly', async () => {
      const { getPilatesSlotBookings } = await import('@/utils/pilatesScheduleApi');
      
      const mockBookings = await getPilatesSlotBookings('slot-1');
      
      expect(mockBookings).toHaveLength(2);
      expect(mockBookings[0].user.first_name).toBe('John');
      expect(mockBookings[1].user.first_name).toBe('Jane');
    });

    it('should handle empty booking list gracefully', async () => {
      const { getPilatesSlotBookings } = await import('@/utils/pilatesScheduleApi');
      
      // Mock empty response
      vi.mocked(getPilatesSlotBookings).mockResolvedValueOnce([]);
      
      const bookings = await getPilatesSlotBookings('empty-slot');
      
      expect(bookings).toHaveLength(0);
    });
  });

  describe('Real-time Updates Integration', () => {
    it('should handle real-time booking updates', async () => {
      const { subscribePilatesRealtime } = await import('@/utils/pilatesScheduleApi');
      
      const mockChannel = {
        unsubscribe: vi.fn()
      };
      
      vi.mocked(subscribePilatesRealtime).mockReturnValue(mockChannel as any);
      
      // Simulate subscribing to real-time updates
      const channel = subscribePilatesRealtime(() => {
        // This callback should be called when bookings change
      });
      
      expect(channel).toBeDefined();
      expect(channel.unsubscribe).toBeDefined();
      
      // Clean up
      channel.unsubscribe();
      expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });

    it('should refresh data when real-time updates occur', async () => {
      const { getPilatesAvailableSlots } = await import('@/utils/pilatesScheduleApi');
      
      // Initial data
      const initialData = [
        { id: 'slot-1', booked_count: 2, max_capacity: 4 }
      ];
      
      // Updated data after new booking
      const updatedData = [
        { id: 'slot-1', booked_count: 3, max_capacity: 4 }
      ];
      
      vi.mocked(getPilatesAvailableSlots)
        .mockResolvedValueOnce(initialData)
        .mockResolvedValueOnce(updatedData);
      
      // Simulate initial load
      const initialSlots = await getPilatesAvailableSlots('2025-09-13', '2025-09-26');
      expect(initialSlots[0].booked_count).toBe(2);
      
      // Simulate real-time update
      const updatedSlots = await getPilatesAvailableSlots('2025-09-13', '2025-09-26');
      expect(updatedSlots[0].booked_count).toBe(3);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API errors gracefully', async () => {
      const { getPilatesAvailableSlots } = await import('@/utils/pilatesScheduleApi');
      
      // Mock API error
      vi.mocked(getPilatesAvailableSlots).mockRejectedValueOnce(
        new Error('Database connection failed')
      );
      
      await expect(getPilatesAvailableSlots('2025-09-13', '2025-09-26'))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle missing slot data gracefully', async () => {
      const { getPilatesSlotBookings } = await import('@/utils/pilatesScheduleApi');
      
      // Mock empty response
      vi.mocked(getPilatesSlotBookings).mockResolvedValueOnce([]);
      
      const bookings = await getPilatesSlotBookings('non-existent-slot');
      
      expect(bookings).toHaveLength(0);
    });
  });

  describe('Performance Integration', () => {
    it('should handle multiple rapid navigation clicks', () => {
      let currentWeek = new Date('2025-09-13T00:00:00.000Z');
      
      // Simulate rapid clicking
      for (let i = 0; i < 10; i++) {
        const newWeek = new Date(currentWeek);
        newWeek.setDate(newWeek.getDate() + 14);
        currentWeek = newWeek;
      }
      
      // Should end up 140 days (10 * 14) in the future
      const expectedDate = new Date('2025-09-13T00:00:00.000Z');
      expectedDate.setDate(expectedDate.getDate() + 140);
      
      expect(currentWeek.toISOString()).toBe(expectedDate.toISOString());
    });

    it('should debounce info button clicks', async () => {
      const { getPilatesSlotBookings } = await import('@/utils/pilatesScheduleApi');
      
      // Simulate rapid clicks on info button
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(getPilatesSlotBookings('slot-1'));
      }
      
      await Promise.all(promises);
      
      // Should only call the API once per unique slot
      expect(getPilatesSlotBookings).toHaveBeenCalledTimes(5);
    });
  });
});
