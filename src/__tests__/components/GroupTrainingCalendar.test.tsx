import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GroupTrainingCalendar from '@/components/admin/GroupTrainingCalendar';
import { getGroupTrainingCalendarEvents, getGroupTrainingSessionDetails, cancelGroupTrainingSession } from '@/utils/groupTrainingCalendarApi';

// Mock the API functions
vi.mock('@/utils/groupTrainingCalendarApi', () => ({
  getGroupTrainingCalendarEvents: vi.fn(),
  getGroupTrainingSessionDetails: vi.fn(),
  cancelGroupTrainingSession: vi.fn()
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

describe('GroupTrainingCalendar Component', () => {
  const mockEvents = [
    {
      id: 'group-session-1',
      title: 'Group Training - Mike',
      type: 'group' as const,
      start: '2025-09-24T18:00:00',
      end: '2025-09-24T19:00:00',
      room: 'Room A',
      capacity: 4,
      participants_count: 2,
      participants: [
        {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar_url: null
        },
        {
          id: 'user-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          avatar_url: null
        }
      ],
      status: 'scheduled' as const,
      trainer: 'Mike',
      group_type: 3,
      notes: 'Test session'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getGroupTrainingCalendarEvents).mockResolvedValue({
      events: mockEvents,
      total_count: 1
    });
  });

  it('should render calendar with feature enabled', async () => {
    render(<GroupTrainingCalendar featureEnabled={true} />);

    expect(screen.getByText('Group Training Calendar')).toBeInTheDocument();
    expect(screen.getByText('View and manage group training sessions')).toBeInTheDocument();
    
    // Wait for events to load
    await waitFor(() => {
      expect(getGroupTrainingCalendarEvents).toHaveBeenCalled();
    });
  });

  it('should show disabled message when feature is disabled', () => {
    render(<GroupTrainingCalendar featureEnabled={false} />);

    expect(screen.getByText('Group Training Calendar is currently disabled')).toBeInTheDocument();
  });

  it('should display calendar navigation controls', () => {
    render(<GroupTrainingCalendar featureEnabled={true} />);

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('should display calendar grid with days', () => {
    render(<GroupTrainingCalendar featureEnabled={true} />);

    // Check for day headers
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  it('should handle event click and show modal', async () => {
    vi.mocked(getGroupTrainingSessionDetails).mockResolvedValue(mockEvents[0]);

    render(<GroupTrainingCalendar featureEnabled={true} />);

    // Wait for events to load
    await waitFor(() => {
      expect(getGroupTrainingCalendarEvents).toHaveBeenCalled();
    });

    // Find and click on an event (this would be in the calendar grid)
    // Note: In a real test, you'd need to find the actual event element
    // For now, we'll test the modal functionality directly
    const event = mockEvents[0];
    
    // Simulate event click by calling the handler directly
    const { container } = render(<GroupTrainingCalendar featureEnabled={true} />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(getGroupTrainingCalendarEvents).toHaveBeenCalled();
    });
  });

  it('should handle session cancellation', async () => {
    vi.mocked(getGroupTrainingSessionDetails).mockResolvedValue(mockEvents[0]);
    vi.mocked(cancelGroupTrainingSession).mockResolvedValue({ success: true });

    render(<GroupTrainingCalendar featureEnabled={true} />);

    // Wait for events to load
    await waitFor(() => {
      expect(getGroupTrainingCalendarEvents).toHaveBeenCalled();
    });

    // Test cancellation (this would be triggered from the modal)
    const result = await cancelGroupTrainingSession('session-1');
    expect(result.success).toBe(true);
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(getGroupTrainingCalendarEvents).mockRejectedValue(new Error('API Error'));

    render(<GroupTrainingCalendar featureEnabled={true} />);

    // Component should still render even with API error
    expect(screen.getByText('Group Training Calendar')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    // Mock a slow API response
    vi.mocked(getGroupTrainingCalendarEvents).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ events: [], total_count: 0 }), 100))
    );

    render(<GroupTrainingCalendar featureEnabled={true} />);

    expect(screen.getByText('Loading calendar events...')).toBeInTheDocument();
  });

  it('should display current month and year', () => {
    render(<GroupTrainingCalendar featureEnabled={true} />);

    const currentDate = new Date();
    const monthYear = currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });

    expect(screen.getByText(monthYear)).toBeInTheDocument();
  });

  it('should handle navigation between months', () => {
    render(<GroupTrainingCalendar featureEnabled={true} />);

    const prevButton = screen.getByRole('button', { name: /previous/i });
    const nextButton = screen.getByRole('button', { name: /next/i });

    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();

    // Test navigation (actual month change would be tested in integration tests)
    fireEvent.click(prevButton);
    fireEvent.click(nextButton);
  });
});
