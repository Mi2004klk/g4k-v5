import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import LoginForm from '../app/(auth)/login/page';
import ForgotPasswordPage from '../app/(auth)/forgot-password/page';
import { apiFetch } from '@/lib/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock Next.js Image
/* eslint-disable @next/next/no-img-element */
vi.mock('next/image', () => ({
  default: ({ priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean | string }) => <img alt={props.alt || ''} {...props} />
}));
/* eslint-enable @next/next/no-img-element */

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

// Mock auth store
const mockSetAuth = vi.fn();
vi.mock('@/lib/auth-store', () => ({
  useAuthStore: (selector?: (state: { setAuth: Mock; user: unknown; setSession: Mock; token: unknown }) => unknown) => {
    const state = { setAuth: mockSetAuth, user: null, setSession: vi.fn(), token: null };
    return selector ? selector(state) : state;
  }
}));

describe('Authentication Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LoginForm', () => {
    it('renders the login form', () => {
      render(<QueryClientProvider client={queryClient}><LoginForm /></QueryClientProvider>);
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/you@games4king\.in/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    });

    it('shows validation errors for empty submission', async () => {
      render(<QueryClientProvider client={queryClient}><LoginForm /></QueryClientProvider>);
      
      const submitButton = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getAllByText('Email or Employee ID is required')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Password must be at least 6 characters')[0]).toBeInTheDocument();
      });
    });

    it('validates and submits form successfully', async () => {
      (apiFetch as Mock).mockImplementation(async (url: string) => {
        if (url === '/auth/login') {
          return {
            token: 'fake-token',
            user: { id: 1, name: 'Test User', current_tenant_id: 1 },
            onboarded: true
          };
        }
        return {};
      });

      render(<QueryClientProvider client={queryClient}><LoginForm /></QueryClientProvider>);
      
      fireEvent.change(screen.getByPlaceholderText(/you@games4king\.in/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'password123' } });
      
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(apiFetch).toHaveBeenCalledWith('/auth/login', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test@example.com')
        }));
      });
    });

    it('displays lockout message when receiving a 423 status', async () => {
      // Mock 423 response
      interface FetchError extends Error {
        status?: number;
        retry_after?: number;
      }
      const lockoutError = new Error('Too many login attempts.') as FetchError;
      lockoutError.status = 423;
      lockoutError.retry_after = 600;
      
      (apiFetch as Mock).mockImplementation(async (url: string) => {
        if (url === '/auth/login') {
          throw lockoutError;
        }
        return {};
      });

      render(<QueryClientProvider client={queryClient}><LoginForm /></QueryClientProvider>);
      
      fireEvent.change(screen.getByPlaceholderText(/you@games4king\.in/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'password123' } });
      
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(screen.getByText(/Too many login attempts/i)).toBeInTheDocument();
      });
    });
  });

  describe('ForgotPasswordPage', () => {
    it('renders channel selection and submits correctly', async () => {
      (apiFetch as Mock).mockResolvedValueOnce({});

      render(<ForgotPasswordPage />);
      
      fireEvent.change(screen.getByPlaceholderText(/Enter your identifier/i), { target: { value: 'test@example.com' } });
      
      fireEvent.click(screen.getByRole('button', { name: /Recover Password/i }));

      await waitFor(() => {
        expect(apiFetch).toHaveBeenCalledWith('/auth/forgot-password', expect.objectContaining({
          body: expect.stringContaining('"identifier":"test@example.com"')
        }));
      });
    });
  });
});
