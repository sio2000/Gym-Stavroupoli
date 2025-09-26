import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getGroupTrainingCalendarEvents, getGroupTrainingSessionDetails, cancelGroupTrainingSession } from '@/utils/groupTrainingCalendarApi';
import { supabase } from '@/config/supabase';

// Mock Supabase
vi.mock('@/config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        }))
      }))
    }))
  }
}));

describe('Group Training Calendar API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getGroupTrainingCalendarEvents', () => {
    it('should fetch calendar events successfully', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          session_date: '2025-09-24',
          start_time: '18:00:00',
          end_time: '19:00:00',
          trainer: 'Mike',
          room: 'Room A',
          group_type: 3,
          notes: 'Test session',
          is_active: true,
          program_id: 'program-1',
          user_profiles: {
            user_id: 'user-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            avatar_url: null
          },
          personal_training_schedules: {
            training_type: 'group',
            group_room_size: 4
          }
        }
      ];

      const mockSupabase = vi.mocked(supabase);
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    data: mockSessions,
                    error: null
                  })
                })
              })
            })
          })
        })
      } as any);

      const result = await getGroupTrainingCalendarEvents('2025-09-01', '2025-09-30');

      expect(result.events).toHaveLength(1);
      expect(result.events[0].title).toBe('Group Training - Mike');
      expect(result.events[0].type).toBe('group');
      expect(result.events[0].capacity).toBe(4);
      expect(result.events[0].participants_count).toBe(1);
    });

    it('should handle API errors gracefully', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    data: null,
                    error: { message: 'Database error' }
                  })
                })
              })
            })
          })
        })
      } as any);

      await expect(getGroupTrainingCalendarEvents('2025-09-01', '2025-09-30'))
        .rejects.toThrow('Failed to fetch group sessions: Database error');
    });

    it('should group sessions by date, time, trainer, and room', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          session_date: '2025-09-24',
          start_time: '18:00:00',
          end_time: '19:00:00',
          trainer: 'Mike',
          room: 'Room A',
          group_type: 3,
          is_active: true,
          program_id: 'program-1',
          user_profiles: {
            user_id: 'user-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            avatar_url: null
          },
          personal_training_schedules: {
            training_type: 'group',
            group_room_size: 4
          }
        },
        {
          id: 'session-2',
          session_date: '2025-09-24',
          start_time: '18:00:00',
          end_time: '19:00:00',
          trainer: 'Mike',
          room: 'Room A',
          group_type: 3,
          is_active: true,
          program_id: 'program-1',
          user_profiles: {
            user_id: 'user-2',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane@example.com',
            avatar_url: null
          },
          personal_training_schedules: {
            training_type: 'group',
            group_room_size: 4
          }
        }
      ];

      const mockSupabase = vi.mocked(supabase);
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    data: mockSessions,
                    error: null
                  })
                })
              })
            })
          })
        })
      } as any);

      const result = await getGroupTrainingCalendarEvents('2025-09-01', '2025-09-30');

      expect(result.events).toHaveLength(1); // Should be grouped into one event
      expect(result.events[0].participants_count).toBe(2); // Two participants
      expect(result.events[0].participants).toHaveLength(2);
    });
  });

  describe('getGroupTrainingSessionDetails', () => {
    it('should fetch session details successfully', async () => {
      const mockSession = {
        id: 'session-1',
        session_date: '2025-09-24',
        start_time: '18:00:00',
        end_time: '19:00:00',
        trainer: 'Mike',
        room: 'Room A',
        group_type: 3,
        notes: 'Test session',
        is_active: true,
        program_id: 'program-1',
        user_profiles: {
          user_id: 'user-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          avatar_url: null
        },
        personal_training_schedules: {
          training_type: 'group',
          group_room_size: 4
        }
      };

      const mockSupabase = vi.mocked(supabase);
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: mockSession,
              error: null
            })
          })
        })
      } as any);

      const result = await getGroupTrainingSessionDetails('session-1');

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Group Training - Mike');
      expect(result?.type).toBe('group');
      expect(result?.capacity).toBe(4);
    });

    it('should return null when session not found', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      } as any);

      const result = await getGroupTrainingSessionDetails('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('cancelGroupTrainingSession', () => {
    it('should cancel session successfully', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: null,
            error: null
          })
        })
      } as any);

      const result = await cancelGroupTrainingSession('session-1');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle cancellation errors', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: null,
            error: { message: 'Update failed' }
          })
        })
      } as any);

      const result = await cancelGroupTrainingSession('session-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });
});
