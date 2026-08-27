import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

// Mock NextResponse
vi.mock('next/server', () => {
  const originalModule = vi.importActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      next: vi.fn(() => ({
        headers: {
          set: vi.fn(),
        },
      })),
      redirect: vi.fn((url) => ({
        url,
        headers: {
          set: vi.fn(),
        },
      })),
    },
  };
});

describe('Middleware E2E Smoke Test (F-009)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows super_admin to access /dashboard/settings with g4k_capabilities_* cookie', () => {
    // Construct a mock NextRequest targeting /dashboard/settings
    const req = new NextRequest('http://localhost:3000/dashboard/settings');
    
    // Mock the cookies
    Object.defineProperty(req, 'cookies', {
      value: {
        get: (name: string) => {
          if (name === 'g4k_token') return { name: 'g4k_token', value: 'fake-token' };
          return undefined;
        },
        getAll: () => [
          { name: 'g4k_token', value: 'fake-token' },
          { name: 'g4k_capabilities_123', value: encodeURIComponent(JSON.stringify(["*"])) }
        ],
      }
    });

    const response = middleware(req);
    
    // NextResponse.next() should be called (represented by the mocked response), not a redirect
    // If it was rejected, it would return a redirect to /dashboard?error=unauthorized
    expect(response).toBeDefined();
    if ('url' in response) {
      expect((response as any).url.toString()).not.toContain('error=unauthorized');
    }
  });

  it('rejects user without required capability for /dashboard/settings', () => {
    const req = new NextRequest('http://localhost:3000/dashboard/settings');
    
    Object.defineProperty(req, 'cookies', {
      value: {
        get: (name: string) => {
          if (name === 'g4k_token') return { name: 'g4k_token', value: 'fake-token' };
          return undefined;
        },
        getAll: () => [
          { name: 'g4k_token', value: 'fake-token' },
          { name: 'g4k_capabilities_456', value: encodeURIComponent(JSON.stringify(["employee.view"])) }
        ],
      }
    });

    const response: any = middleware(req);
    
    // Should be redirected to /dashboard?error=unauthorized
    expect(response).toBeDefined();
    expect(response.url.toString()).toContain('error=unauthorized');
  });
});
