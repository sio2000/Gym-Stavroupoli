import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// Stable timers for reproducible tests
vi.useFakeTimers();
vi.setSystemTime(new Date('2025-01-01T10:00:00.000Z'));

// Minimal localStorage/sessionStorage mocks
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

// @ts-expect-error jsdom type
globalThis.localStorage = new MemoryStorage();
// @ts-expect-error jsdom type
globalThis.sessionStorage = new MemoryStorage();

// Mock fetch to avoid real network
const mockFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : (input as URL).toString();
  // Return benign responses for Supabase endpoints or app APIs
  if (url.includes('supabase') || url.includes('/rpc/') || url.includes('/rest/v1/')) {
    return new Response(JSON.stringify({ ok: true, data: null }), { status: 200 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};

vi.stubGlobal('fetch', mockFetch);

// Mock @supabase/supabase-js client with harmless no-op behavior
vi.mock('@supabase/supabase-js', () => {
  const anon = {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session: { access_token: 'tok', user: { id: 'u1', email: 'user@example.com' } } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'tok', user: { id: 'u1' } } }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis()
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null })
  };
  return {
    createClient: vi.fn().mockReturnValue(anon)
  };
});

beforeAll(() => {
  // Ensure we never hit real env vars
  process.env.NODE_ENV = 'test';
  process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
});

afterEach(() => {
  // Clear storages between tests to avoid persistence
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});

afterAll(() => {
  vi.useRealTimers();
});


