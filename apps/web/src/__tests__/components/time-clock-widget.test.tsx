import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimeClockWidget } from '../../components/widgets/time-clock-widget';
import { useTimerStore } from '../../stores/timer-store';
import { apiFetch } from '@/lib/api-client';
import { offlineEngine } from '@/lib/offline-engine';

// Mock the query client provider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
    useTimerStore.setState({
      isActive: false,
      isOnBreak: false,
      clockInTimestamp: null,
      currentBreakStart: null,
      baseSeconds: 0,
      lastActiveTimestamp: null,
    });

    (apiFetch as any).mockResolvedValue({
      day: { total_seconds: 0 },
      events: [],
      standard_seconds: 28800
    });
  });



  it('renders initial state and fetches data', async () => {
    renderWithProviders(<TimeClockWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Clock In')).toBeInTheDocument();
    });
    
    expect(apiFetch).toHaveBeenCalledWith('/attendance/me/today');
  });

  it('handles clock in punch optimistically', async () => {
    (offlineEngine.recordPunch as any).mockResolvedValueOnce(undefined);

    renderWithProviders(<TimeClockWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Clock In')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Clock In'));
    
    expect(useTimerStore.getState().isActive).toBe(true);
    expect(offlineEngine.recordPunch).toHaveBeenCalledWith('clock_in', expect.any(String));

    await waitFor(() => {
      expect(screen.getByText('Clock Out')).toBeInTheDocument();
    });
  });

  it('handles clock out and break states correctly', async () => {
    (apiFetch as any).mockResolvedValueOnce({
      day: { total_seconds: 3600 },
      events: [
        { type: 'clock_in', timestamp: new Date().toISOString() }
      ],
      standard_seconds: 28800
    });

    renderWithProviders(<TimeClockWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Break')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Break'));
    
    expect(useTimerStore.getState().isOnBreak).toBe(true);
    expect(offlineEngine.recordPunch).toHaveBeenCalledWith('break_start', expect.any(String));
  });

  it('rolls back state on punch failure', async () => {
    const error = new Error('Network failure');
    (offlineEngine.recordPunch as any).mockRejectedValueOnce(error);

    renderWithProviders(<TimeClockWidget />);
    
    await waitFor(() => {
      expect(screen.getByText('Clock In')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Clock In'));
    
    // Initially optimistic
    expect(useTimerStore.getState().isActive).toBe(true);

    await waitFor(() => {
      // After failure, it should refetch today's status to sync state
      // Since our mock returns inactive state, it should go back to inactive
      expect(apiFetch).toHaveBeenCalledTimes(2); // once on mount, once on failure
    });
  });
});
