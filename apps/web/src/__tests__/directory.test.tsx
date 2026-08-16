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
  ErrorBoundary: ({ children }: any) => <>{children}</>,
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
  Tabs: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TabsList: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TabsTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  TabsContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  FilterBar: ({ searchQuery, onSearchChange, searchPlaceholder, isLoading, onValueChange, children, ...props }: any) => <div {...props}>{children}</div>,
  AppIcon: ({ name, ...props }: any) => <span {...props}>Icon-{name}</span>,
  Dialog: ({ onOpenChange, children, ...props }: any) => <div {...props}>{children}</div>,
  DialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogFooter: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  DialogTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  ConfirmDialog: ({ onConfirm, onOpenChange, children, ...props }: any) => <div {...props}>{children}</div>,
  Avatar: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AvatarImage: ({ src, ...props }: any) => <img src={src} {...props} />,
  AvatarFallback: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Breadcrumb: ({ children, ...props }: any) => <nav {...props}>{children}</nav>,
  BreadcrumbList: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
  BreadcrumbItem: ({ children, ...props }: any) => <li {...props}>{children}</li>,
  BreadcrumbLink: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  BreadcrumbPage: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  BreadcrumbSeparator: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })
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
    const heading = await screen.findByText('Team Directory & Org');
    expect(heading).toBeInTheDocument();
  });
});
