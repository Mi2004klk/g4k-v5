import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AttendanceHistoryCalendar } from '../../components/attendance/attendance-history-calendar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock ECharts to avoid canvas rendering issues in JSDOM
vi.mock('echarts-for-react', () => ({
  default: () => <div data-testid="echarts-mock" />
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function renderWithProviders(ui: React.ReactElement) {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('AttendanceHistoryCalendar', () => {
  it('renders correctly with historical data', async () => {
    const mockHistory = [
      { date: '2026-08-01', total_seconds: 28800, status: 'present', overtime_seconds: 0 },
      { date: '2026-08-02', total_seconds: 32400, status: 'present', overtime_seconds: 3600 },
    ] as any;

    renderWithProviders(<AttendanceHistoryCalendar days={mockHistory} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('echarts-mock')).toBeInTheDocument();
    });
  });

  it('handles empty days array gracefully', async () => {
    renderWithProviders(<AttendanceHistoryCalendar days={[]} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('echarts-mock')).toBeInTheDocument();
    });
  });
});
