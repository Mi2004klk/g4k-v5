import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '../app/(auth)/login/page';
import ForgotPasswordPage from '../app/(auth)/forgot-password/page';
import { apiFetch } from '@/lib/api-client';

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
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />
}));

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
  useAuthStore: (selector?: any) => {
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
      render(<LoginForm />);
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\. karthik/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    });

    it('shows validation errors for empty submission', async () => {
      render(<LoginForm />);
      
      const submitButton = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Username, Email, or Employee ID is required')).toBeInTheDocument();
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });
    });

    it('validates and submits form successfully', async () => {
      (apiFetch as any).mockResolvedValueOnce({
        token: 'fake-token',
        user: { id: 1, name: 'Test User', current_tenant_id: 1 },
        onboarded: true
      });

      render(<LoginForm />);
      
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. karthik/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'password123' } });
      
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(apiFetch).toHaveBeenCalledWith('/auth/login', expect.any(Object));
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('displays lockout message when receiving a 423 status', async () => {
      // Mock 423 response
      const lockoutError = new Error('Too many login attempts.');
      (lockoutError as any).status = 423;
      (lockoutError as any).retry_after = 600;
      
      (apiFetch as any).mockRejectedValueOnce(lockoutError);

      render(<LoginForm />);
      
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. karthik/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'password123' } });
      
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(screen.getByText(/Too many login attempts/i)).toBeInTheDocument();
      });
    });
  });

  describe('ForgotPasswordPage', () => {
    it('renders channel selection and submits correctly', async () => {
      (apiFetch as any).mockResolvedValueOnce({});

      render(<ForgotPasswordPage />);
      
      fireEvent.change(screen.getByPlaceholderText(/Enter your identifier/i), { target: { value: 'test@example.com' } });
      
      // Select Admin Approval
      fireEvent.click(screen.getByRole('button', { name: /Admin Approval/i }));
      
      fireEvent.click(screen.getByRole('button', { name: /Recover Password/i }));

      await waitFor(() => {
        expect(apiFetch).toHaveBeenCalledWith('/auth/forgot-password', expect.objectContaining({
          body: expect.stringContaining('"channel":"admin"')
        }));
      });
    });
  });
});
