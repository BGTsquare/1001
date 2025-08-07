import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaymentApprovalDashboard } from '../payment-approval-dashboard';
import type { PurchaseRequest } from '@/types';

// Mock the actual react-query but keep QueryClientProvider
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
  };
});

// Mock fetch
global.fetch = vi.fn();

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock notification context
vi.mock('@/contexts/notification-context', () => ({
  useNotifications: () => ({
    notifications: [],
    markAsRead: vi.fn(),
    clearNotification: vi.fn(),
  }),
}));

// Mock the payment approval utils
vi.mock('@/lib/utils/payment-approval-utils', () => ({
  calculatePaymentStats: vi.fn(),
  sortRequestsByPriority: vi.fn(),
  validateBulkApproval: vi.fn(),
  generateApprovalSummary: vi.fn(),
  formatApprovalMessage: vi.fn(),
}));

const mockRequests: PurchaseRequest[] = [
  {
    id: 'req-1',
    user_id: 'user-1',
    item_type: 'book',
    item_id: 'book-1',
    amount: 29.99,
    status: 'pending',
    user_message: 'Please approve my purchase',
    preferred_contact_method: 'email',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    admin_notes: null,
    book: {
      id: 'book-1',
      title: 'Test Book',
      author: 'Test Author',
      description: 'A test book',
      price: 29.99,
      cover_image_url: 'https://example.com/cover.jpg',
      file_url: 'https://example.com/book.pdf',
      category: 'fiction',
      tags: ['test'],
      is_featured: false,
      is_free: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      admin_id: 'admin-1',
      status: 'published',
      file_size: 1024,
      page_count: 200,
      language: 'en',
      isbn: '1234567890',
      publisher: 'Test Publisher',
      publication_date: new Date().toISOString(),
    },
    bundle: null,
  },
  {
    id: 'req-2',
    user_id: 'user-2',
    item_type: 'bundle',
    item_id: 'bundle-1',
    amount: 49.99,
    status: 'approved',
    user_message: null,
    preferred_contact_method: 'whatsapp',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    admin_notes: 'Approved quickly',
    book: null,
    bundle: {
      id: 'bundle-1',
      title: 'Test Bundle',
      description: 'A test bundle',
      cover_image_url: 'https://example.com/bundle-cover.jpg',
      original_price: 79.99,
      bundle_price: 49.99,
      is_featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      admin_id: 'admin-1',
      status: 'published',
    },
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('PaymentApprovalDashboard', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockRequests }),
    });

    // Mock the react-query hooks
    const { useQuery, useMutation, useQueryClient } = await import('@tanstack/react-query');
    
    (useQuery as any).mockReturnValue({
      data: mockRequests,
      isLoading: false,
      error: null,
    });

    (useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (useQueryClient as any).mockReturnValue({
      invalidateQueries: vi.fn(),
    });

    // Mock the utils
    const utils = await import('@/lib/utils/payment-approval-utils');
    (utils.calculatePaymentStats as any).mockReturnValue({
      total: 2,
      pending: 1,
      approved: 1,
      rejected: 0,
      completed: 0,
      totalValue: 49.99,
      pendingValue: 29.99,
      approvedValue: 49.99,
      recentRequests: 2,
    });
  });

  it('should render payment approval dashboard', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PaymentApprovalDashboard />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Pending Approvals')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Pending Value')).toBeInTheDocument();
      expect(screen.getByText('Total Approved')).toBeInTheDocument();
    });
  });

  it('should display correct stats', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PaymentApprovalDashboard />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 pending
      expect(screen.getByText('$29.99')).toBeInTheDocument(); // pending value
      expect(screen.getByText('$49.99')).toBeInTheDocument(); // approved value
    });
  });

  it('should filter requests by status', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PaymentApprovalDashboard />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });

    // Change filter to approved
    const statusFilter = screen.getByDisplayValue('Pending');
    fireEvent.click(statusFilter);
    
    const approvedOption = screen.getByText('Approved');
    fireEvent.click(approvedOption);

    await waitFor(() => {
      expect(screen.getByText('Test Bundle')).toBeInTheDocument();
    });
  });

  it('should handle search functionality', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PaymentApprovalDashboard />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search by item name or request ID...');
    fireEvent.change(searchInput, { target: { value: 'Bundle' } });

    // Should filter out the book and show no results in pending tab
    await waitFor(() => {
      expect(screen.queryByText('Test Book')).not.toBeInTheDocument();
    });
  });

  it('should handle bulk selection', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PaymentApprovalDashboard />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Select All')).toBeInTheDocument();
    });

    const selectAllCheckbox = screen.getByRole('checkbox');
    fireEvent.click(selectAllCheckbox);

    await waitFor(() => {
      expect(screen.getByText('1 selected')).toBeInTheDocument();
      expect(screen.getByText('Bulk Actions')).toBeInTheDocument();
    });
  });

  it('should open payment request details', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PaymentApprovalDashboard />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });

    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);

    await waitFor(() => {
      expect(screen.getByText('Payment Request Details')).toBeInTheDocument();
    });
  });

  it('should handle loading state', () => {
    (fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PaymentApprovalDashboard />
      </Wrapper>
    );

    expect(screen.getByText('Loading payment requests...')).toBeInTheDocument();
  });

  it('should handle empty state', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PaymentApprovalDashboard />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No payment requests found.')).toBeInTheDocument();
    });
  });
});