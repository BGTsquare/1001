import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PurchaseRequestFormComponent } from '../purchase-request-form';
import type { Book, Bundle, AdminContactInfo } from '@/types';

// Mock fetch
global.fetch = vi.fn();

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn(() => ({})),
    handleSubmit: vi.fn((fn) => (e) => {
      e.preventDefault();
      fn({
        itemType: 'book',
        itemId: 'book-1',
        amount: 29.99,
        preferredContactMethod: 'email',
        userMessage: 'Test message',
      });
    }),
    formState: { errors: {} },
    setValue: vi.fn(),
    watch: vi.fn(() => 'email'),
    reset: vi.fn(),
  }),
}));

const mockBook: Book = {
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
};

const mockBundle: Bundle = {
  id: 'bundle-1',
  title: 'Test Bundle',
  description: 'Test bundle description',
  price: 49.99,
  books: [mockBook],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

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

describe('PurchaseRequestFormComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockContacts }),
    });
  });

  it('should render purchase request form for book', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestFormComponent 
          item={mockBook} 
          itemType="book" 
        />
      </Wrapper>
    );

    // Click trigger to open dialog
    const triggerButton = screen.getByText('Request Purchase');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText('Request Purchase')).toBeInTheDocument();
      expect(screen.getByText('Test Book')).toBeInTheDocument();
      expect(screen.getByText('by Test Author')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
    });
  });

  it('should render purchase request form for bundle', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestFormComponent 
          item={mockBundle} 
          itemType="bundle" 
        />
      </Wrapper>
    );

    // Click trigger to open dialog
    const triggerButton = screen.getByText('Request Purchase');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText('Test Bundle')).toBeInTheDocument();
      expect(screen.getByText('$49.99')).toBeInTheDocument();
    });
  });

  it('should display contact methods when available', async () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestFormComponent 
          item={mockBook} 
          itemType="book" 
        />
      </Wrapper>
    );

    // Click trigger to open dialog
    const triggerButton = screen.getByText('Request Purchase');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText('Contact Method')).toBeInTheDocument();
    });
  });

  it('should show loading state when fetching contacts', async () => {
    (fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestFormComponent 
          item={mockBook} 
          itemType="book" 
        />
      </Wrapper>
    );

    // Click trigger to open dialog
    const triggerButton = screen.getByText('Request Purchase');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText('Loading contact information...')).toBeInTheDocument();
    });
  });

  it('should show message when no contacts available', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });
    
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestFormComponent 
          item={mockBook} 
          itemType="book" 
        />
      </Wrapper>
    );

    // Click trigger to open dialog
    const triggerButton = screen.getByText('Request Purchase');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText('No admin contact information available. Please try again later.')).toBeInTheDocument();
    });
  });

  it('should submit purchase request successfully', async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockContacts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: 'request-1' } }),
      });

    const mockOnSuccess = vi.fn();
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestFormComponent 
          item={mockBook} 
          itemType="book"
          onSuccess={mockOnSuccess}
        />
      </Wrapper>
    );

    // Click trigger to open dialog
    const triggerButton = screen.getByText('Request Purchase');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText('Create Purchase Request')).toBeInTheDocument();
    });

    // Submit form
    const submitButton = screen.getByText('Create Purchase Request');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/purchase-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemType: 'book',
          itemId: 'book-1',
          amount: 29.99,
          preferredContactMethod: 'email',
          userMessage: 'Test message',
        }),
      });
    });
  });

  it('should handle submission error', async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockContacts }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to create request' }),
      });

    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestFormComponent 
          item={mockBook} 
          itemType="book" 
        />
      </Wrapper>
    );

    // Click trigger to open dialog
    const triggerButton = screen.getByText('Request Purchase');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText('Create Purchase Request')).toBeInTheDocument();
    });

    // Submit form
    const submitButton = screen.getByText('Create Purchase Request');
    fireEvent.click(submitButton);

    // Should handle error gracefully
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/purchase-requests', expect.any(Object));
    });
  });

  it('should use custom trigger when provided', () => {
    const customTrigger = <button>Custom Trigger</button>;
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestFormComponent 
          item={mockBook} 
          itemType="book"
          trigger={customTrigger}
        />
      </Wrapper>
    );

    expect(screen.getByText('Custom Trigger')).toBeInTheDocument();
    expect(screen.queryByText('Request Purchase')).not.toBeInTheDocument();
  });

  it('should disable submit button when no contacts available', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });
    
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <PurchaseRequestFormComponent 
          item={mockBook} 
          itemType="book" 
        />
      </Wrapper>
    );

    // Click trigger to open dialog
    const triggerButton = screen.getByText('Request Purchase');
    fireEvent.click(triggerButton);

    await waitFor(() => {
      const submitButton = screen.getByText('Create Purchase Request');
      expect(submitButton).toBeDisabled();
    });
  });
});