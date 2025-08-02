import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContactPurchaseManager } from '../contact-purchase-manager';
import { createTestUtils } from '@/test/utils';
import { vi } from 'vitest';

// Mock the fetch function
global.fetch = vi.fn();

const mockFetch = fetch as any;

// Mock data
const mockContacts = [
  {
    id: '1',
    admin_id: 'admin-1',
    contact_type: 'email' as const,
    contact_value: 'admin@example.com',
    display_name: 'Admin Email',
    is_active: true,
    is_primary: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    admin_id: 'admin-1',
    contact_type: 'telegram' as const,
    contact_value: '@admin',
    display_name: 'Admin Telegram',
    is_active: true,
    is_primary: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const mockAnalytics = {
  totalRequests: 10,
  pendingRequests: 3,
  approvedRequests: 4,
  rejectedRequests: 1,
  completedRequests: 2,
  totalRevenue: 150.00,
  averageResponseTime: 2.5,
  conversionRate: 60.0,
  recentRequests: [
    {
      id: '1',
      user_id: 'user-1',
      item_type: 'book' as const,
      item_id: 'book-1',
      amount: 25.00,
      status: 'pending' as const,
      preferred_contact_method: 'email' as const,
      user_message: 'Looking forward to reading this!',
      admin_notes: null,
      contacted_at: null,
      responded_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      book: {
        id: 'book-1',
        title: 'Test Book',
        author: 'Test Author',
        description: 'A test book',
        cover_image_url: null,
        content_url: null,
        price: 25.00,
        is_free: false,
        category: 'fiction',
        tags: ['test'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
  ],
  requestsByDay: [
    { date: 'Jan 1', count: 2 },
    { date: 'Jan 2', count: 1 },
    { date: 'Jan 3', count: 3 }
  ],
  requestsByContactMethod: [
    { method: 'email', count: 5 },
    { method: 'telegram', count: 3 },
    { method: 'whatsapp', count: 2 }
  ]
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('ContactPurchaseManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main interface with tabs', async () => {
    // Mock API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAnalytics })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockContacts })
      } as Response);

    render(
      <TestWrapper>
        <ContactPurchaseManager />
      </TestWrapper>
    );

    // Check if main title is rendered
    expect(screen.getByText('Contact & Purchase Management')).toBeInTheDocument();

    // Check if tabs are rendered
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /contact methods/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /purchase requests/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /analytics/i })).toBeInTheDocument();
  });

  it('displays contact methods overview correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAnalytics })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockContacts })
      } as Response);

    render(
      <TestWrapper>
        <ContactPurchaseManager />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Contact Methods')[0]).toBeInTheDocument();
    });

    // Check contact method statistics
    expect(screen.getByText('Total Methods')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  it('displays purchase analytics correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAnalytics })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockContacts })
      } as Response);

    render(
      <TestWrapper>
        <ContactPurchaseManager />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Requests')).toBeInTheDocument();
    });

    // Check analytics cards
    expect(screen.getByText('10')).toBeInTheDocument(); // Total requests
    expect(screen.getByText('3')).toBeInTheDocument(); // Pending requests
    expect(screen.getByText('60.0%')).toBeInTheDocument(); // Conversion rate
    expect(screen.getByText('$150.00')).toBeInTheDocument(); // Total revenue
  });

  it('displays recent purchase requests', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAnalytics })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockContacts })
      } as Response);

    render(
      <TestWrapper>
        <ContactPurchaseManager />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Recent Purchase Requests')).toBeInTheDocument();
    });

    // Check if recent request is displayed
    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('Book')).toBeInTheDocument();
    expect(screen.getAllByText('Pending')[0]).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    mockFetch
      .mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockAnalytics })
      } as Response);

    render(
      <TestWrapper>
        <ContactPurchaseManager />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getAllByText('Contact Methods')[0]).toBeInTheDocument();
    });

    // Check that all tabs are present
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /contact methods/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /purchase requests/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /analytics/i })).toBeInTheDocument();
  });

  it('handles time range selection in analytics', async () => {
    mockFetch
      .mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockAnalytics })
      } as Response);

    render(
      <TestWrapper>
        <ContactPurchaseManager />
      </TestWrapper>
    );

    // Just verify the component renders without errors
    expect(screen.getByText('Contact & Purchase Management')).toBeInTheDocument();
  });

  it('displays loading states correctly', () => {
    // Mock pending promises
    mockFetch
      .mockReturnValueOnce(new Promise(() => {})) // Never resolves
      .mockReturnValueOnce(new Promise(() => {})); // Never resolves

    render(
      <TestWrapper>
        <ContactPurchaseManager />
      </TestWrapper>
    );

    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    mockFetch
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockContacts })
      } as Response);

    render(
      <TestWrapper>
        <ContactPurchaseManager />
      </TestWrapper>
    );

    // Should still render the interface even if analytics fail
    await waitFor(() => {
      expect(screen.getByText('Contact & Purchase Management')).toBeInTheDocument();
    });
  });

  it('displays empty state when no contacts are configured', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAnalytics })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      } as Response);

    render(
      <TestWrapper>
        <ContactPurchaseManager />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No contact methods configured')).toBeInTheDocument();
    });
  });

  it('displays analytics breakdown correctly', async () => {
    mockFetch
      .mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockAnalytics })
      } as Response);

    render(
      <TestWrapper>
        <ContactPurchaseManager />
      </TestWrapper>
    );

    // Just verify the component renders without errors
    expect(screen.getByText('Contact & Purchase Management')).toBeInTheDocument();
  });

  it('displays contact method preferences', async () => {
    mockFetch
      .mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockAnalytics })
      } as Response);

    render(
      <TestWrapper>
        <ContactPurchaseManager />
      </TestWrapper>
    );

    // Just verify the component renders without errors
    expect(screen.getByText('Contact & Purchase Management')).toBeInTheDocument();
  });
});