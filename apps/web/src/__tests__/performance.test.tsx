import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Profiler, Suspense } from 'react';
import { AdminAttendanceTable } from '@/components/attendance/admin-attendance-table';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as apiClient from '@/lib/api-client';

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('Performance - AdminAttendanceTable', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('renders 1000 rows within render count limits', async () => {
    // Generate 1000 mock rows
    const mockRows = Array.from({ length: 1000 }).map((_, i) => ({
      id: i + 1,
      user_id: i % 100,
      user: {
        id: i % 100,
        name: `User ${i}`,
        employee_id: `EMP-${i}`,
        department: { name: 'Engineering' }
      },
      date: '2025-01-01',
      check_in: '09:00:00',
      check_out: '17:00:00',
      status: 'present',
    }));

    (apiClient.apiFetch as any).mockResolvedValue({
      data: mockRows,
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 1000,
        total: 1000,
      }
    });

    let renderCount = 0;
    const onRender = (
      id: string,
      phase: string,
      actualDuration: number,
      baseDuration: number,
      startTime: number,
      commitTime: number
    ) => {
      // Ignore initial mounting phase as that usually triggers Suspense fallbacks
      if (phase === 'update' || phase === 'mount') {
        renderCount++;
      }
    };

    render(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div>Loading...</div>}>
          <Profiler id="AdminAttendanceTable" onRender={onRender}>
            <AdminAttendanceTable />
          </Profiler>
        </Suspense>
      </QueryClientProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      // Just check if any User is rendered
      expect(screen.getAllByText(/User /).length).toBeGreaterThan(0);
    }, { timeout: 5000 });

    // Ensure the table doesn't re-render excessively when processing 1000 rows
    // It should mount (1), then re-render on data fetch success (2), maybe 1 more time for internal state (3)
    // We set a budget of <= 4 renders.
    expect(renderCount).toBeLessThanOrEqual(4);
  });
});
