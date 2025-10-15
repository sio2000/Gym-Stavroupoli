/**
 * Unit tests for the InstallmentPlanPage component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InstallmentPlanPage from '@/pages/InstallmentPlanPage';
import { useAuth } from '@/contexts/AuthContext';

// Mock the auth context
jest.mock('@/contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the API service
jest.mock('@/services/api/installmentApi', () => ({
  fetchInstallmentPlan: jest.fn(),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
}));

describe('InstallmentPlanPage', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'user' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      // ... other required properties
    } as any);
  });

  it('should show loading state initially', () => {
    render(
      <BrowserRouter>
        <InstallmentPlanPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Φόρτωση πλάνου δόσεων...')).toBeInTheDocument();
  });

  it('should show error message when no installment plan exists', async () => {
    const { fetchInstallmentPlan } = require('@/services/api/installmentApi');
    fetchInstallmentPlan.mockResolvedValue(null);

    render(
      <BrowserRouter>
        <InstallmentPlanPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Δεν υπάρχει ενεργό πλάνο δόσεων για τον λογαριασμό σας')).toBeInTheDocument();
    });

    expect(screen.getByText('Επιστροφή στο Dashboard')).toBeInTheDocument();
  });

  it('should display installment plan data correctly', async () => {
    const mockPlanData = {
      userId: 'user-123',
      subscriptionId: 'request-123',
      status: 'approved' as const,
      total_amount: 150.00,
      total_paid: 50.00,
      remaining: 100.00,
      installments: [
        {
          installment_number: 1,
          due_date: '2024-02-01',
          amount: 50.00,
          status: 'locked' as const,
        },
        {
          installment_number: 2,
          due_date: '2024-03-01',
          amount: 50.00,
          status: 'paid' as const,
        },
        {
          installment_number: 3,
          due_date: '2024-04-01',
          amount: 50.00,
          status: 'overdue' as const,
        },
      ],
    };

    const { fetchInstallmentPlan } = require('@/services/api/installmentApi');
    fetchInstallmentPlan.mockResolvedValue(mockPlanData);

    render(
      <BrowserRouter>
        <InstallmentPlanPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Πλάνο Δόσεων')).toBeInTheDocument();
    });

    // Check summary cards
    expect(screen.getByText('€150,00')).toBeInTheDocument(); // Total amount
    expect(screen.getByText('€50,00')).toBeInTheDocument(); // Paid amount
    expect(screen.getByText('€100,00')).toBeInTheDocument(); // Remaining amount

    // Check installment details
    expect(screen.getByText('Δόση 1')).toBeInTheDocument();
    expect(screen.getByText('Δόση 2')).toBeInTheDocument();
    expect(screen.getByText('Δόση 3')).toBeInTheDocument();

    // Check status labels
    expect(screen.getByText('Κλειδωμένη')).toBeInTheDocument();
    expect(screen.getByText('Πληρωμένη')).toBeInTheDocument();
    expect(screen.getByText('Εκπρόθεσμη')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    const { fetchInstallmentPlan } = require('@/services/api/installmentApi');
    fetchInstallmentPlan.mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <InstallmentPlanPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Σφάλμα κατά τη φόρτωση του πλάνου δόσεων')).toBeInTheDocument();
    });
  });

  it('should navigate back to dashboard when back button is clicked', async () => {
    const { fetchInstallmentPlan } = require('@/services/api/installmentApi');
    fetchInstallmentPlan.mockResolvedValue(null);

    render(
      <BrowserRouter>
        <InstallmentPlanPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Επιστροφή στο Dashboard')).toBeInTheDocument();
    });

    screen.getByText('Επιστροφή στο Dashboard').click();

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should format dates correctly', async () => {
    const mockPlanData = {
      userId: 'user-123',
      subscriptionId: 'request-123',
      status: 'approved' as const,
      total_amount: 50.00,
      total_paid: 0.00,
      remaining: 50.00,
      installments: [
        {
          installment_number: 1,
          due_date: '2024-02-01',
          amount: 50.00,
          status: 'locked' as const,
        },
      ],
    };

    const { fetchInstallmentPlan } = require('@/services/api/installmentApi');
    fetchInstallmentPlan.mockResolvedValue(mockPlanData);

    render(
      <BrowserRouter>
        <InstallmentPlanPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1/2/2024')).toBeInTheDocument(); // Greek date format
    });
  });

  it('should format currency correctly', async () => {
    const mockPlanData = {
      userId: 'user-123',
      subscriptionId: 'request-123',
      status: 'approved' as const,
      total_amount: 123.45,
      total_paid: 67.89,
      remaining: 55.56,
      installments: [
        {
          installment_number: 1,
          due_date: '2024-02-01',
          amount: 123.45,
          status: 'locked' as const,
        },
      ],
    };

    const { fetchInstallmentPlan } = require('@/services/api/installmentApi');
    fetchInstallmentPlan.mockResolvedValue(mockPlanData);

    render(
      <BrowserRouter>
        <InstallmentPlanPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('€123,45')).toBeInTheDocument();
      expect(screen.getByText('€67,89')).toBeInTheDocument();
      expect(screen.getByText('€55,56')).toBeInTheDocument();
    });
  });
});
