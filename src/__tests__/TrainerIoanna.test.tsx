import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TrainerIoanna from '@/pages/TrainerIoanna';

// Mock the PilatesScheduleDisplay component
jest.mock('@/components/pilates/PilatesScheduleDisplay', () => {
  return function MockPilatesScheduleDisplay({ 
    readOnly, 
    trainerName, 
    showAdminControls, 
    title 
  }: {
    readOnly: boolean;
    trainerName: string;
    showAdminControls: boolean;
    title: string;
  }) {
    return (
      <div data-testid="pilates-schedule-display">
        <h2>{title}</h2>
        <p>Trainer: {trainerName}</p>
        <p>Read Only: {readOnly ? 'Yes' : 'No'}</p>
        <p>Admin Controls: {showAdminControls ? 'Yes' : 'No'}</p>
      </div>
    );
  };
});

describe('TrainerIoanna', () => {
  it('renders the Ioanna trainer page with correct props', () => {
    render(
      <BrowserRouter>
        <TrainerIoanna />
      </BrowserRouter>
    );

    // Check if the page title is rendered
    expect(screen.getByText('Ιωάννα - Pilates Schedule')).toBeInTheDocument();
    
    // Check if the read-only notice is displayed
    expect(screen.getByText(/Προβολή Προγράμματος/)).toBeInTheDocument();
    
    // Check if the PilatesScheduleDisplay component is rendered with correct props
    expect(screen.getByTestId('pilates-schedule-display')).toBeInTheDocument();
    expect(screen.getByText('Πρόγραμμα Pilates - Ιωάννα')).toBeInTheDocument();
    expect(screen.getByText('Trainer: Ιωάννα')).toBeInTheDocument();
    expect(screen.getByText('Read Only: Yes')).toBeInTheDocument();
    expect(screen.getByText('Admin Controls: No')).toBeInTheDocument();
  });

  it('shows read-only information', () => {
    render(
      <BrowserRouter>
        <TrainerIoanna />
      </BrowserRouter>
    );

    // Check if the read-only notice contains the expected text
    expect(screen.getByText(/Δεν μπορείτε να κάνετε αλλαγές - είναι προβολή μόνο/)).toBeInTheDocument();
  });

  it('displays the correct trainer name throughout the page', () => {
    render(
      <BrowserRouter>
        <TrainerIoanna />
      </BrowserRouter>
    );

    // Check if Ioanna's name appears in multiple places
    expect(screen.getByText('Ιωάννα - Pilates Schedule')).toBeInTheDocument();
    expect(screen.getByText('Trainer: Ιωάννα')).toBeInTheDocument();
    expect(screen.getByText('Πρόγραμμα Pilates - Ιωάννα')).toBeInTheDocument();
  });
});
