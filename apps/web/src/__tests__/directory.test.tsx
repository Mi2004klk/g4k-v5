import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
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

/* eslint-disable @next/next/no-img-element */
vi.mock('@g4k/ui/components', () => ({
  ErrorBoundary: ({ children }: React.PropsWithChildren) => <>{children}</>,
  Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />,
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
  Card: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  Skeleton: () => <div>Loading...</div>,
  ContentSkeleton: () => <div>Loading...</div>,
  EmptyState: () => <div>Empty</div>,
  Sheet: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div data-testid="sheet" {...props}>{children}</div>,
  SheetContent: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  SheetHeader: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  SheetTitle: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  SheetDescription: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  DataTable: () => <table data-testid="data-table"></table>,
  Tabs: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  TabsList: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  TabsTrigger: ({ children, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => <button {...props}>{children}</button>,
  TabsContent: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  FilterBar: ({ searchQuery, onSearchChange, searchPlaceholder, isLoading, onValueChange, children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  AppIcon: ({ name, ...props }: { name: string } & React.HTMLAttributes<HTMLSpanElement>) => <span {...props}>Icon-{name}</span>,
  Dialog: ({ onOpenChange, children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  DialogContent: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  DialogHeader: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  DialogDescription: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  DialogFooter: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  DialogTrigger: ({ children, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => <button {...props}>{children}</button>,
  ConfirmDialog: ({ onConfirm, onOpenChange, children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  Avatar: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  AvatarImage: ({ src, ...props }: { src: string } & React.ImgHTMLAttributes<HTMLImageElement>) => <img src={src} alt={props.alt || ''} {...props} />,
  AvatarFallback: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  Breadcrumb: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>) => <nav {...props}>{children}</nav>,
  BreadcrumbList: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLUListElement>>) => <ul {...props}>{children}</ul>,
  BreadcrumbItem: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLLIElement>>) => <li {...props}>{children}</li>,
  BreadcrumbLink: ({ children, ...props }: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) => <a {...props}>{children}</a>,
  BreadcrumbPage: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLSpanElement>>) => <span {...props}>{children}</span>,
  BreadcrumbSeparator: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLSpanElement>>) => <span {...props}>{children}</span>,
}));
/* eslint-enable @next/next/no-img-element, jsx-a11y/alt-text */

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
