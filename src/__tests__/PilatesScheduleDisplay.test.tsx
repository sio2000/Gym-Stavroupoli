import React from 'react';
import { render, screen } from '@testing-library/react';
import PilatesScheduleDisplay from '@/components/pilates/PilatesScheduleDisplay';

// Mock the API functions
jest.mock('@/utils/pilatesScheduleApi', () => ({
  getPilatesScheduleSlots: jest.fn().mockResolvedValue([]),
  getPilatesAvailableSlots: jest.fn().mockResolvedValue([]),
  subscribePilatesRealtime: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
  getPilatesSlotBookings: jest.fn().mockResolvedValue([]),
}));

// Mock the date utilities
jest.mock('@/utils/date', () => ({
  toLocalDateKey: jest.fn((date) => date.toISOString().split('T')[0]),
  addDaysLocal: jest.fn((date, days) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  }),
  getGreekMondayOfCurrentWeek: jest.fn(() => new Date('2024-01-01')),
  parseDateKeyLocal: jest.fn((dateStr) => new Date(dateStr)),
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

describe('PilatesScheduleDisplay', () => {
  it('renders in read-only mode correctly', () => {
    render(
      <PilatesScheduleDisplay
        readOnly={true}
        trainerName="Katerina"
        showAdminControls={false}
        title="Test Title"
      />
    );

    // Check if the title is rendered
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    
    // Check if trainer name is displayed
    expect(screen.getByText('Πρόγραμμα για Katerina')).toBeInTheDocument();
    
    // Check if admin controls are hidden (save button should not be present)
    expect(screen.queryByText('Αποθήκευση')).not.toBeInTheDocument();
  });

  it('renders in admin mode correctly', () => {
    render(
      <PilatesScheduleDisplay
        readOnly={false}
        showAdminControls={true}
        title="Admin Title"
        subtitle="Admin Subtitle"
      />
    );

    // Check if the title and subtitle are rendered
    expect(screen.getByText('Admin Title')).toBeInTheDocument();
    expect(screen.getByText('Admin Subtitle')).toBeInTheDocument();
    
    // Check if admin controls are visible (save button should be present)
    expect(screen.getByText('Αποθήκευση')).toBeInTheDocument();
  });

  it('shows correct information box content based on read-only mode', () => {
    const { rerender } = render(
      <PilatesScheduleDisplay readOnly={true} />
    );

    // In read-only mode, should not show edit instructions
    expect(screen.queryByText(/Κάντε κλικ στις ώρες που δεν θέλετε να δουλεύετε/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Μην ξεχάσετε να αποθηκεύσετε τις αλλαγές/)).not.toBeInTheDocument();

    // Rerender in admin mode
    rerender(<PilatesScheduleDisplay readOnly={false} showAdminControls={true} />);

    // In admin mode, should show edit instructions
    expect(screen.getByText(/Κάντε κλικ στις ώρες που δεν θέλετε να δουλεύετε/)).toBeInTheDocument();
    expect(screen.getByText(/Μην ξεχάσετε να αποθηκεύσετε τις αλλαγές/)).toBeInTheDocument();
  });
});
