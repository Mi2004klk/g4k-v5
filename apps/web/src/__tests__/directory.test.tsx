import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DirectoryPage from '../app/dashboard/directory/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn().mockResolvedValue({
    data: [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        designation: { name: 'Developer' },
        department: { name: 'Engineering' }
      }
    ]
  })
}));

vi.mock('@/hooks/use-url-state', () => ({
  useUrlState: vi.fn((key, initial) => {
    return [initial, vi.fn()];
  })
}));

vi.mock('@g4k/ui/components', () => ({
  Button: (props: any) => <button {...props} />,
  Input: (props: any) => <input {...props} />,
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Skeleton: () => <div>Loading...</div>,
  EmptyState: () => <div>Empty</div>,
  Sheet: ({ children, ...props }: any) => <div data-testid="sheet" {...props}>{children}</div>,
  SheetContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SheetHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SheetTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SheetDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DataTable: () => <table data-testid="data-table"></table>,
}));

const queryClient = new QueryClient();

describe('DirectoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the directory page in grid view', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DirectoryPage />
      </QueryClientProvider>
    );

    // Wait for the data to load
    const heading = await screen.findByText('Employee Directory');
    expect(heading).toBeInTheDocument();
  });
});
