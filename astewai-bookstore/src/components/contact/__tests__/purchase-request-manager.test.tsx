import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PurchaseRequestManager } from '../purchase-request-manager';
import type { PurchaseRequest, AdminContactInfo } from '@/types';

// Mock fetch
global.fetch = vi.fn();

// Mock window.open
const mockOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true,
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(() => 'Jan 1, 2024'),
}));

const mockPurchaseRequests: PurchaseRequest[] = [
  {
    id: 'request-1',
    user_id: 'user-1',
    item_type: 'book',
    item_id: 'book-1',
    amount: 29.99,
    status: 'pending',
    preferred_contact_method: 'email',
    user_message: 'I would like to purchase this book',
    admin_notes: null,
    contacted_at: null,
    responded_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    book: {
      id: 'book-1',
      title: 'Test Book',
      author: 'Test Author',
      description: 'Test description',
      cover_image_url: 'https://example.com/cover.jpg',
      content_url: 'https://example.com/content.pdf',
      price: 29.99,
      is_free: false,
      category: 'Fiction',
      tags: ['test'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
  {
    id: 'request-2',
    user_id: 'user-2',
    item_type: 'bundle',
    item_id: 'bundle-1',
    amount: 49.99,
    status: 'contacted',
    preferred_contact_method: 'telegram',
    user_message: null,
    admin_notes: 'Contacted via Telegram',
    contacted_at: '2024-01-01T12:00:00Z',
    responded_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
    bundle: {
      id: 'bundle-1',
      title: 'Test Bundle',
      description: 'Test bundle description',
      price: 49.99,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
];

const mockContacts: AdminContactInfo[] = [
  {
    id: '1',
    admin_id: 'admin-1',
    contact_type: 'email',
    contact_value: 'admin@example.com',
    display_name: 'Admin Team',
    is_active: true,
    is_primary: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    admin_id: 'admin-1',
    contact_type: 'telegram',
    contact_value: '@admin',
    display_name: null,
    is_active: true,
    is_primary: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('PurchaseRequestManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockPurchaseRequests }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockContacts }),
      });
  });

  it('should render purchase request manager with tabs', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestManager />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Purchase Requests')).toBeInTheDocument();
      expect(screen.getByText('Pending (1)')).toBeInTheDocument();
      expect(screen.getByText('Contacted (1)')).toBeInTheDocument();
      expect(screen.getByText('Approved (0)')).toBeInTheDocument();
      expect(screen.getByText('Completed (0)')).toBeInTheDocument();
      expect(screen.getByText('Rejected (0)')).toBeInTheDocument();
    });
  });

  it('should display request cards with correct information', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestManager />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
      expect(screen.getByText('I would like to purchase this book')).toBeInTheDocument();
      expect(screen.getByText('Preferred contact: Email')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    (fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestManager />
      </Wrapper>
    );

    expect(screen.getByText('Loading purchase requests...')).toBeInTheDocument();
  });

  it('should show empty state when no requests in tab', async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockContacts }),
      });

    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestManager />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No pending requests found.')).toBeInTheDocument();
    });
  });

  it('should open manage dialog when manage button is clicked', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestManager />
      </Wrapper>
    );

    await waitFor(() => {
      const manageButton = screen.getAllByText('Manage')[0];
      fireEvent.click(manageButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Manage Purchase Request')).toBeInTheDocument();
      expect(screen.getByText('Request Details')).toBeInTheDocument();
    });
  });

  it('should update request status when status button is clicked', async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockPurchaseRequests }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockContacts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { ...mockPurchaseRequests[0], status: 'approved' } }),
      });

    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestManager />
      </Wrapper>
    );

    await waitFor(() => {
      const manageButton = screen.getAllByText('Manage')[0];
      fireEvent.click(manageButton);
    });

    await waitFor(() => {
      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/purchase-requests/request-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved', adminNotes: '' }),
      });
    });
  });

  it('should open contact URL when contact button is clicked', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestManager />
      </Wrapper>
    );

    await waitFor(() => {
      const contactButton = screen.getByText('Contact');
      fireEvent.click(contactButton);
    });

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('mailto:admin@example.com'),
      '_blank'
    );
  });

  it('should switch between tabs correctly', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestManager />
      </Wrapper>
    );

    await waitFor(() => {
      const contactedTab = screen.getByText('Contacted (1)');
      fireEvent.click(contactedTab);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Bundle')).toBeInTheDocument();
    });
  });

  it('should display status badges correctly', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestManager />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    // Switch to contacted tab
    const contactedTab = screen.getByText('Contacted (1)');
    fireEvent.click(contactedTab);

    await waitFor(() => {
      expect(screen.getByText('Contacted')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    (fetch as any).mockRejectedValue(new Error('API Error'));
    
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestManager />
      </Wrapper>
    );

    // Should not crash and show loading state
    expect(screen.getByText('Loading purchase requests...')).toBeInTheDocument();
  });

  it('should display admin notes in manage dialog', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestManager />
      </Wrapper>
    );

    // Switch to contacted tab to see request with admin notes
    await waitFor(() => {
      const contactedTab = screen.getByText('Contacted (1)');
      fireEvent.click(contactedTab);
    });

    await waitFor(() => {
      const manageButton = screen.getByText('Manage');
      fireEvent.click(manageButton);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Contacted via Telegram')).toBeInTheDocument();
    });
  });
});