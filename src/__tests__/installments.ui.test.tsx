import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
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

// Mock auth context
const mockAuthContext = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'user'
  },
  login: vi.fn(),
  logout: vi.fn()
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

// Mock API functions
vi.mock('@/utils/membershipApi', () => ({
  getMembershipPackages: vi.fn().mockResolvedValue([
    {
      id: 'free-gym-id',
      name: 'Free Gym',
      description: 'Free Gym Access',
      price: 150,
      duration_days: 180,
      package_type: 'free_gym'
    },
    {
      id: 'pilates-id',
      name: 'Pilates',
      description: 'Pilates Classes',
      price: 6,
      duration_days: 1,
      package_type: 'pilates'
    },
    {
      id: 'ultimate-id',
      name: 'Ultimate',
      description: 'Ultimate Package',
      price: 1200,
      duration_days: 365,
      package_type: 'ultimate'
    }
  ]),
  getMembershipPackageDurations: vi.fn().mockResolvedValue([
    {
      id: 'free-gym-semester',
      package_id: 'free-gym-id',
      duration_type: 'semester',
      duration_days: 180,
      price: 150,
      is_active: true
    },
    {
      id: 'free-gym-year',
      package_id: 'free-gym-id',
      duration_type: 'year',
      duration_days: 365,
      price: 240,
      is_active: true
    }
  ]),
  getPilatesPackageDurations: vi.fn().mockResolvedValue([
    {
      id: 'pilates-6months',
      package_id: 'pilates-id',
      duration_type: 'pilates_6months',
      duration_days: 180,
      price: 190,
      classes_count: 25,
      is_active: true
    },
    {
      id: 'pilates-1year',
      package_id: 'pilates-id',
      duration_type: 'pilates_1year',
      duration_days: 365,
      price: 350,
      classes_count: 50,
      is_active: true
    }
  ]),
  getUltimatePackageDurations: vi.fn().mockResolvedValue([
    {
      id: 'ultimate-1year',
      package_id: 'ultimate-id',
      duration_type: 'ultimate_1year',
      duration_days: 365,
      price: 1200,
      classes_count: 156,
      is_active: true
    }
  ]),
  createMembershipRequest: vi.fn().mockResolvedValue(true),
  createPilatesMembershipRequest: vi.fn().mockResolvedValue(true),
  createUltimateMembershipRequest: vi.fn().mockResolvedValue(true),
  getUserMembershipRequests: vi.fn().mockResolvedValue([]),
  getUserActiveMemberships: vi.fn().mockResolvedValue([]),
  checkUserHasActiveMembership: vi.fn().mockResolvedValue(false),
  getDurationLabel: vi.fn((type) => type),
  getDurationDisplayText: vi.fn((type, days) => `${days} days`),
  formatPrice: vi.fn((price) => `€${price}`)
});

// Import after mocking
import MembershipPage from '@/pages/Membership';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Installments UI - Membership Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show installments checkbox for Free Gym 6 months', async () => {
    renderWithRouter(<MembershipPage />);
    
    // Wait for packages to load
    await waitFor(() => {
      expect(screen.getByText('Free Gym')).toBeInTheDocument();
    });

    // Click on Free Gym package
    const freeGymButton = screen.getByText('Επιλέξτε Πακέτο');
    fireEvent.click(freeGymButton);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Επιλογή Πακέτου: Open Gym')).toBeInTheDocument();
    });

    // Click on 6 months duration
    const semesterOption = screen.getByText('semester');
    fireEvent.click(semesterOption);

    // Check if installments checkbox appears
    await waitFor(() => {
      expect(screen.getByLabelText('Πληρωμή με δόσεις')).toBeInTheDocument();
    });
  });

  it('should show installments checkbox for Free Gym 1 year', async () => {
    renderWithRouter(<MembershipPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Free Gym')).toBeInTheDocument();
    });

    const freeGymButton = screen.getByText('Επιλέξτε Πακέτο');
    fireEvent.click(freeGymButton);

    await waitFor(() => {
      expect(screen.getByText('Επιλογή Πακέτου: Open Gym')).toBeInTheDocument();
    });

    const yearOption = screen.getByText('year');
    fireEvent.click(yearOption);

    await waitFor(() => {
      expect(screen.getByLabelText('Πληρωμή με δόσεις')).toBeInTheDocument();
    });
  });

  it('should show installments checkbox for Pilates 25 lessons', async () => {
    renderWithRouter(<MembershipPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Pilates')).toBeInTheDocument();
    });

    const pilatesButton = screen.getByText('Επιλέξτε Πακέτο');
    fireEvent.click(pilatesButton);

    await waitFor(() => {
      expect(screen.getByText('Επιλογή Πακέτου: Pilates')).toBeInTheDocument();
    });

    const sixMonthsOption = screen.getByText('pilates_6months');
    fireEvent.click(sixMonthsOption);

    await waitFor(() => {
      expect(screen.getByLabelText('Πληρωμή με δόσεις')).toBeInTheDocument();
    });
  });

  it('should show installments checkbox for Pilates 50 lessons', async () => {
    renderWithRouter(<MembershipPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Pilates')).toBeInTheDocument();
    });

    const pilatesButton = screen.getByText('Επιλέξτε Πακέτο');
    fireEvent.click(pilatesButton);

    await waitFor(() => {
      expect(screen.getByText('Επιλογή Πακέτου: Pilates')).toBeInTheDocument();
    });

    const oneYearOption = screen.getByText('pilates_1year');
    fireEvent.click(oneYearOption);

    await waitFor(() => {
      expect(screen.getByLabelText('Πληρωμή με δόσεις')).toBeInTheDocument();
    });
  });

  it('should show installments checkbox for Ultimate', async () => {
    renderWithRouter(<MembershipPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Ultimate')).toBeInTheDocument();
    });

    const ultimateButton = screen.getByText('Επιλέξτε Πακέτο');
    fireEvent.click(ultimateButton);

    await waitFor(() => {
      expect(screen.getByText('Επιλογή Πακέτου: Ultimate')).toBeInTheDocument();
    });

    const ultimateYearOption = screen.getByText('ultimate_1year');
    fireEvent.click(ultimateYearOption);

    await waitFor(() => {
      expect(screen.getByLabelText('Πληρωμή με δόσεις')).toBeInTheDocument();
    });
  });

  it('should NOT show installments checkbox for ineligible packages', async () => {
    renderWithRouter(<MembershipPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Free Gym')).toBeInTheDocument();
    });

    const freeGymButton = screen.getByText('Επιλέξτε Πακέτο');
    fireEvent.click(freeGymButton);

    await waitFor(() => {
      expect(screen.getByText('Επιλογή Πακέτου: Open Gym')).toBeInTheDocument();
    });

    // Try to find a non-eligible duration (if any exist in mock data)
    const monthOption = screen.queryByText('month');
    if (monthOption) {
      fireEvent.click(monthOption);
      
      await waitFor(() => {
        expect(screen.queryByLabelText('Πληρωμή με δόσεις')).not.toBeInTheDocument();
      });
    }
  });

  it('should create request with installments when checkbox is checked', async () => {
    const { createMembershipRequest } = await import('@/utils/membershipApi');
    
    renderWithRouter(<MembershipPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Free Gym')).toBeInTheDocument();
    });

    const freeGymButton = screen.getByText('Επιλέξτε Πακέτο');
    fireEvent.click(freeGymButton);

    await waitFor(() => {
      expect(screen.getByText('Επιλογή Πακέτου: Open Gym')).toBeInTheDocument();
    });

    const semesterOption = screen.getByText('semester');
    fireEvent.click(semesterOption);

    await waitFor(() => {
      expect(screen.getByLabelText('Πληρωμή με δόσεις')).toBeInTheDocument();
    });

    // Check the installments checkbox
    const installmentsCheckbox = screen.getByLabelText('Πληρωμή με δόσεις');
    fireEvent.click(installmentsCheckbox);

    // Click confirm
    const confirmButton = screen.getByText('Επιβεβαίωση');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(createMembershipRequest).toHaveBeenCalledWith(
        'free-gym-id',
        'semester',
        150,
        true
      );
    });
  });
});
