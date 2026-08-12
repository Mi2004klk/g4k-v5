import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttendanceHistoryCalendar } from '../../components/attendance/attendance-history-calendar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { format } from 'date-fns';

// Mock useIsMobile — default to desktop
vi.mock('@g4k/ui/hooks', () => ({
  useIsMobile: () => false,
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderWithProviders(ui: React.ReactElement) {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const TODAY = format(new Date(), 'yyyy-MM-dd');
const YESTERDAY = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

const mockHistory = [
  {
    id: 1, user_id: 1,
    date: TODAY,
    clock_in: '09:00:00', clock_out: '17:30:00',
    first_event: '09:00:00', last_event: '17:30:00',
    total_seconds: 30600, break_seconds: 3600, overtime_seconds: 0,
    late_minutes: 0, status: 'present', has_open_shift: false,
  },
  {
    id: 2, user_id: 1,
    date: YESTERDAY,
    clock_in: '09:30:00', clock_out: '18:00:00',
    first_event: '09:30:00', last_event: '18:00:00',
    total_seconds: 30600, break_seconds: 0, overtime_seconds: 0,
    late_minutes: 30, status: 'late', has_open_shift: false,
  },
] as any;

describe('AttendanceHistoryCalendar', () => {
  it('renders the month calendar grid on desktop', () => {
    renderWithProviders(<AttendanceHistoryCalendar days={mockHistory} />);
    expect(screen.getByTestId('month-calendar-grid')).toBeInTheDocument();
  });

  it('shows the current month title', () => {
    renderWithProviders(<AttendanceHistoryCalendar days={mockHistory} />);
    const monthTitle = format(new Date(), 'MMMM yyyy');
    expect(screen.getByText(monthTitle)).toBeInTheDocument();
  });

  it('renders day cells with data-testid for current month', () => {
    renderWithProviders(<AttendanceHistoryCalendar days={mockHistory} />);
    expect(screen.getByTestId(`day-cell-${TODAY}`)).toBeInTheDocument();
  });

  it('renders the status legend', () => {
    renderWithProviders(<AttendanceHistoryCalendar days={mockHistory} />);
    expect(screen.getByText('Present')).toBeInTheDocument();
    expect(screen.getByText('Late')).toBeInTheDocument();
    expect(screen.getByText('Leave')).toBeInTheDocument();
    expect(screen.getByText('Overtime')).toBeInTheDocument();
  });

  it('handles empty days array gracefully', () => {
    renderWithProviders(<AttendanceHistoryCalendar days={[]} />);
    expect(screen.getByTestId('attendance-history-calendar')).toBeInTheDocument();
    expect(screen.getByText('0 records this month')).toBeInTheDocument();
  });

  it('opens a detail dialog when a day cell with a record is clicked', () => {
    renderWithProviders(<AttendanceHistoryCalendar days={mockHistory} />);
    const cell = screen.getByTestId(`day-cell-${TODAY}`);
    fireEvent.click(cell);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows the correct record count in the header', () => {
    renderWithProviders(<AttendanceHistoryCalendar days={mockHistory} />);
    expect(screen.getByText('2 records this month')).toBeInTheDocument();
  });
});
