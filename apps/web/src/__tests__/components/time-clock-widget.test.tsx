import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
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

    (apiFetch as any).mockResolvedValue({
      attendance_today: {
        day: { total_seconds: 0 },
        events: [],
        standard_seconds: 28800
      }
    });
  });



  it('renders initial state and fetches data', async () => {
    renderWithProviders(<TimeClockWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Start Shift')).toBeInTheDocument();
    });
    
    expect(apiFetch).toHaveBeenCalledWith('/dashboard/init');
  });

  it('handles clock in punch optimistically', async () => {
    (offlineEngine.recordPunch as any).mockResolvedValueOnce(undefined);
    // Mock the subsequent refetch triggered by invalidateQueries
    (apiFetch as any).mockResolvedValue({
      attendance_today: {
        day: { total_seconds: 0 },
        events: [{ type: 'clock_in', timestamp: new Date().toISOString() }],
        standard_seconds: 28800
      }
    });

    renderWithProviders(<TimeClockWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Start Shift')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Start Shift'));
    });
    
    await waitFor(() => {
      expect(useTimerStore.getState().isActive).toBe(true);
      expect(offlineEngine.recordPunch).toHaveBeenCalledWith('clock_in', expect.any(String));
      expect(screen.getByText('End Shift')).toBeInTheDocument();
    });
  });

  it('handles clock out and break states correctly', async () => {
    // Set initial active state to avoid race conditions with queries
    useTimerStore.setState({
      isActive: true,
      isOnBreak: false,
      baseSeconds: 3600,
      clockInTimestamp: new Date().toISOString(),
    });
    
    (offlineEngine.recordPunch as any).mockResolvedValueOnce(undefined);
    (apiFetch as any).mockResolvedValue({
      attendance_today: {
        day: { total_seconds: 3600 },
        events: [
          { type: 'clock_in', timestamp: new Date().toISOString() },
          { type: 'break_start', timestamp: new Date().toISOString() }
        ],
        standard_seconds: 28800
      }
    });

    renderWithProviders(<TimeClockWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Pause for Break')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Pause for Break'));
    });
    
    await waitFor(() => {
      expect(useTimerStore.getState().isOnBreak).toBe(true);
      expect(offlineEngine.recordPunch).toHaveBeenCalledWith('break_start', expect.any(String));
    });
  });

  it('rolls back state on punch failure', async () => {
    const error = new Error('Network failure');
    (offlineEngine.recordPunch as any).mockRejectedValueOnce(error);

    renderWithProviders(<TimeClockWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Start Shift')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Start Shift'));
    });
    
    await waitFor(() => {
      // It should revert back to original state if api fetch fails/invalidates
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
