import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { TimeClockWidget } from '../../components/widgets/time-clock-widget';
import { useTimerStore } from '../../stores/timer-store';
import { apiFetch } from '@/lib/api-client';
import { offlineEngine } from '@/lib/offline-engine';

// Mock the query client provider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/offline-engine', () => ({
  offlineEngine: {
    recordPunch: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function renderWithProviders(ui: React.ReactElement) {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('TimeClockWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    useTimerStore.setState({
      isActive: false,
      isOnBreak: false,
      clockInTimestamp: null,
      currentBreakStart: null,
      baseSeconds: 0,
      lastActiveTimestamp: null,
    });

    (apiFetch as Mock).mockImplementation(async (url: string) => {
      if (url.includes('/dashboard/init')) {
        return {
          active_task: null
        };
      }
      return {
        day: { total_seconds: 0 },
        events: [],
        standard_seconds: 28800
      };
    });
  });



  it('renders initial state and fetches data', async () => {
    renderWithProviders(<TimeClockWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Start Shift')).toBeInTheDocument();
    });
    
    expect(apiFetch).toHaveBeenCalledWith('/dashboard/init');
    expect(apiFetch).toHaveBeenCalledWith('/attendance/me/today');
  });

  it('handles clock in punch optimistically', async () => {
    (offlineEngine.recordPunch as Mock).mockResolvedValueOnce(undefined);
    // Mock the subsequent refetch triggered by invalidateQueries
    (apiFetch as Mock).mockImplementation(async (url: string) => {
      if (url.includes('/dashboard/init')) return { active_task: null };
      return {
        day: { total_seconds: 0 },
        events: [{ type: 'clock_in', timestamp: new Date().toISOString() }],
        standard_seconds: 28800
      };
    });

    renderWithProviders(<TimeClockWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Start Shift')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Start Shift'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('End Shift')).toBeInTheDocument();
    });
    
    expect(offlineEngine.recordPunch).toHaveBeenCalledWith('clock_in');
  });

  it('handles clock out and break states correctly', async () => {
    // Start with a clocked-in state
    (apiFetch as Mock).mockImplementation(async (url: string) => {
      if (url.includes('/dashboard/init')) return { active_task: null };
      return {
        day: { total_seconds: 3600 },
        events: [{ type: 'clock_in', timestamp: new Date(Date.now() - 3600000).toISOString() }],
        standard_seconds: 28800
      };
    });

    renderWithProviders(<TimeClockWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('End Shift')).toBeInTheDocument();
      expect(screen.getByText('Start Break')).toBeInTheDocument();
    });

    // Test going on break
    (offlineEngine.recordPunch as Mock).mockResolvedValueOnce(undefined);
    await act(async () => {
      fireEvent.click(screen.getByText('Start Break'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('End Break')).toBeInTheDocument();
    });
    
    expect(offlineEngine.recordPunch).toHaveBeenCalledWith('break_start');
  });

  it('rolls back state on punch failure', async () => {
    (offlineEngine.recordPunch as Mock).mockRejectedValueOnce(new Error('Network error'));
    
    renderWithProviders(<TimeClockWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Start Shift')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Start Shift'));
    });
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
      // It should revert back to original state if api fetch fails/in.
      // The button text should remain 'Start Shift' because the mutation failed and query invalidate restored state,
      // actually the optimistic update is rolled back by react-query.
      expect(screen.getByText('Start Shift')).toBeInTheDocument();
    });
  });
});
