import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminAttendanceTable } from "../admin-attendance-table";
import { AdminOpenShiftsTable } from "../admin-open-shifts-table";
import { AdminTodayAttendanceWidget } from "../../dashboard/admin-today-attendance-widget";

// Mock dependencies
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn().mockReturnValue({
    data: { data: [{ id: 1, user_id: 1, user_name: "Test User", status: "present" }] },
    isLoading: false,
  }),
  useQueryClient: vi.fn().mockReturnValue({
    invalidateQueries: vi.fn(),
  }),
  useMutation: vi.fn().mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  })
}));

vi.mock("@/hooks/use-url-state", () => ({
  useUrlState: vi.fn((key, initial) => [initial, vi.fn()])
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  })
}));

vi.mock("@/lib/api-client", () => ({
  apiFetch: vi.fn()
}));

describe("Admin Attendance Components", () => {
  it("renders AdminAttendanceTable correctly", () => {
    render(<AdminAttendanceTable />);
    expect(screen.getByText("All Departments")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search company/i)).toBeInTheDocument();
  });

  it("renders AdminOpenShiftsTable correctly", () => {
    render(<AdminOpenShiftsTable />);
    // Checking for filters
    expect(screen.getByPlaceholderText(/Search company/i)).toBeInTheDocument();
  });

  it("renders AdminTodayAttendanceWidget correctly", () => {
    render(<AdminTodayAttendanceWidget />);
    expect(screen.getByText("Today's Attendance")).toBeInTheDocument();
    expect(screen.getByText(/clocked in/i)).toBeInTheDocument();
  });
});
