/* @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Mock toast with factory to avoid hoist issues
vi.mock('react-hot-toast', () => {
  const error = vi.fn();
  const success = vi.fn();
  return {
    __esModule: true,
    default: { error, success },
    error,
    success,
  };
});

// Mock supabase with factory-local fns to avoid hoist issues
vi.mock('@/config/supabase', () => {
  const getSessionMock = vi.fn();
  const getUserMock = vi.fn();
  const fromMock = vi.fn();
  const selectMock = vi.fn();
  const eqMock = vi.fn();
  const singleMock = vi.fn();
  const rpcMock = vi.fn();
  const onAuthStateChangeMock = vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }));

  // Chain methods behavior
  fromMock.mockReturnValue({ select: selectMock });
  selectMock.mockReturnValue({ eq: eqMock });
  eqMock.mockReturnValue({ single: singleMock });

  // Defaults; will be overridden per-test
  getSessionMock.mockResolvedValue({ data: { session: { user: { id: 'u-1', email: 'user@example.com' } } }, error: null });
  getUserMock.mockResolvedValue({ data: { user: { id: 'u-1', email: 'user@example.com', user_metadata: {} } }, error: null });
  singleMock.mockResolvedValue({ data: null, error: { message: 'No rows found', code: 'PGRST116', status: 406 } });
  rpcMock.mockResolvedValue({ data: null, error: null });

  const supabase = {
    auth: {
      getSession: getSessionMock,
      getUser: getUserMock,
      onAuthStateChange: onAuthStateChangeMock,
      signOut: vi.fn(),
    },
    from: (...args: any[]) => fromMock(...args),
    rpc: rpcMock,
  } as any;

  // expose mocks so tests can tweak
  return {
    __esModule: true,
    supabase,
    // export helpers for testing
    _mocks: {
      getSessionMock,
      getUserMock,
      fromMock,
      selectMock,
      eqMock,
      singleMock,
      rpcMock,
    },
  };
});

// Helper component to access auth context
const Probe: React.FC = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="auth-user">{auth.user ? auth.user.email : 'null'}</div>
      <div data-testid="is-authenticated">{auth.isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="is-loading">{auth.isLoading ? 'true' : 'false'}</div>
      <div data-testid="is-initialized">{auth.isInitialized ? 'true' : 'false'}</div>
    </div>
  );
};

// Prepare window.location.assign spy
const originalLocation = window.location;

describe('AuthProvider — no fallback virtual user on profile load failure', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    // Reset localStorage
    localStorage.clear();
    // Spy on window.location.assign without breaking type
    // @ts-ignore
    delete (window as any).location;
    // @ts-ignore
    (window as any).location = { assign: vi.fn(), href: '/', origin: 'http://localhost' };
    // Import mocks and ensure defaults (already set in factory)
    await import('@/config/supabase');
  });

  afterEach(() => {
    // Restore window.location
    // @ts-ignore
    (window as any).location = originalLocation;
  });

  // Build >=300 scenarios of different failure shapes
  const scenarios = Array.from({ length: 310 }).map((_, i) => ({
    id: `profile-failure-${i + 1}`,
    failure: i % 5 === 0 ? { message: 'Network error', code: 'NETWORK', status: 0 } :
             i % 5 === 1 ? { message: 'Timeout', code: 'TIMEOUT', status: 0 } :
             i % 5 === 2 ? { message: 'No rows found', code: 'PGRST116', status: 406 } :
             i % 5 === 3 ? { message: 'DB unavailable', code: 'DB_DOWN', status: 500 } :
                           { message: 'Unknown error', code: 'UNKNOWN', status: 520 },
  }));

  it.each(scenarios)('does not create fallback user and redirects [$id]', async ({ id, failure }) => {
    // For each scenario, adapt the single() mock result shape
    const mod = await import('@/config/supabase');
    // @ts-ignore
    mod._mocks.singleMock.mockResolvedValueOnce({ data: null, error: failure });

    const { getByTestId } = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('is-initialized').textContent).toBe('true');
    });

    // Assert no user and unauthenticated
    expect(getByTestId('auth-user').textContent).toBe('null');
    expect(getByTestId('is-authenticated').textContent).toBe('false');

    // Assert redirect attempt
    expect((window.location as any).assign).toHaveBeenCalledWith('/login');

    // Assert toast error shown
    const toast = await import('react-hot-toast');
    const errorFn = (toast as any).default?.error ?? (toast as any).error;
    expect(errorFn).toHaveBeenCalled();
  });
});


