import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryProvider } from '@tanstack/react-query';
import { PurchaseContactModal } from '../purchase-contact-modal';
import type { Book, Bundle, AdminContactInfo } from '@/types';

// Mock the toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

// Mock window.open
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
});

const mockBook: Book = {
  id: '1',
  title: 'Test Book',
  author: 'Test Author',
  price: 19.99,
  cover_image_url: 'https://example.com/cover.jpg',
  description: 'Test description',
  category: 'fiction',
  tags: ['test'],
  is_free: false,
  is_featured: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  content_url: null,
  preview_url: null,
  isbn: null,
  publication_date: null,
  page_count: null,
  language: 'en',
  file_size: null,
  format: 'pdf'
};

const mockBundle: Bundle = {
  id: '1',
  title: 'Test Bundle',
  description: 'Test bundle description',
  price: 49.99,
  cover_image_url: 'https://example.com/bundle-cover.jpg',
  is_featured: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockContacts: AdminContactInfo[] = [
  {
    id: '1',
    admin_id: 'admin1',
    contact_type: 'telegram',
    contact_value: '@testadmin',
    display_name: 'Test Admin',
    is_active: true,
    is_primary: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    admin_id: 'admin1',
    contact_type: 'whatsapp',
    contact_value: '+1234567890',
    display_name: 'WhatsApp Admin',
    is_active: true,
    is_primary: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    admin_id: 'admin1',
    contact_type: 'email',
    contact_value: 'admin@example.com',
    display_name: 'Email Admin',
    is_active: true,
    is_primary: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Mock fetch
global.fetch = jest.fn();

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryProvider client={queryClient}>
      {component}
    </QueryProvider>
  );
};

describe('PurchaseContactModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockContacts }),
    });
  });

  it('renders the trigger button', () => {
    renderWithQueryClient(
      <PurchaseContactModal item={mockBook} itemType="book" />
    );

    expect(screen.getByRole('button', { name: /contact admin/i })).toBeInTheDocument();
  });

  it('opens modal when trigger is clicked', async () => {
    renderWithQueryClient(
      <PurchaseContactModal item={mockBook} itemType="book" />
    );

    fireEvent.click(screen.getByRole('button', { name: /contact admin/i }));

    await waitFor(() => {
      expect(screen.getByText('Contact Admin for Purchase')).toBeInTheDocument();
    });
  });

  it('displays item details correctly for book', async () => {
    renderWithQueryClient(
      <PurchaseContactModal item={mockBook} itemType="book" />
    );

    fireEvent.click(screen.getByRole('button', { name: /contact admin/i }));

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
      expect(screen.getByText('by Test Author')).toBeInTheDocument();
      expect(screen.getByText('$19.99')).toBeInTheDocument();
      expect(screen.getByText('Book')).toBeInTheDocument();
    });
  });

  it('displays item details correctly for bundle', async () => {
    renderWithQueryClient(
      <PurchaseContactModal item={mockBundle} itemType="bundle" />
    );

    fireEvent.click(screen.getByRole('button', { name: /contact admin/i }));

    await waitFor(() => {
      expect(screen.getByText('Test Bundle')).toBeInTheDocument();
      expect(screen.getByText('$49.99')).toBeInTheDocument();
      expect(screen.getByText('Bundle')).toBeInTheDocument();
    });
  });

  it('loads and displays contact methods', async () => {
    renderWithQueryClient(
      <PurchaseContactModal item={mockBook} itemType="book" />
    );

    fireEvent.click(screen.getByRole('button', { name: /contact admin/i }));

    await waitFor(() => {
      expect(screen.getByText('Telegram')).toBeInTheDocument();
      expect(screen.getByText('WhatsApp')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Primary')).toBeInTheDocument();
    });
  });

  it('allows selecting a contact method', async () => {
    renderWithQueryClient(
      <PurchaseContactModal item={mockBook} itemType="book" />
    );

    fireEvent.click(screen.getByRole('button', { name: /contact admin/i }));

    await waitFor(() => {
      const telegramOption = screen.getByText('Telegram').closest('div');
      fireEvent.click(telegramOption!);
    });

    await waitFor(() => {
      expect(screen.getByText('Message Preview')).toBeInTheDocument();
    });
  });

  it('generates correct message template for book', async () => {
    renderWithQueryClient(
      <PurchaseContactModal item={mockBook} itemType="book" />
    );

    fireEvent.click(screen.getByRole('button', { name: /contact admin/i }));

    await waitFor(() => {
      const telegramOption = screen.getByText('Telegram').closest('div');
      fireEvent.click(telegramOption!);
    });

    await waitFor(() => {
      const messagePreview = screen.getByText(/Hi! I'm interested in purchasing the book: "Test Book" by Test Author for \$19\.99/);
      expect(messagePreview).toBeInTheDocument();
    });
  });

  it('includes custom message in template', async () => {
    renderWithQueryClient(
      <PurchaseContactModal item={mockBook} itemType="book" />
    );

    fireEvent.click(screen.getByRole('button', { name: /contact admin/i }));

    await waitFor(() => {
      const customMessageTextarea = screen.getByPlaceholderText(/add any specific questions/i);
      fireEvent.change(customMessageTextarea, { target: { value: 'I need this urgently' } });

      const telegramOption = screen.getByText('Telegram').closest('div');
      fireEvent.click(telegramOption!);
    });

    await waitFor(() => {
      expect(screen.getByText(/Additional message: I need this urgently/)).toBeInTheDocument();
    });
  });

  it('opens contact URL when contact button is clicked', async () => {
    renderWithQueryClient(
      <PurchaseContactModal item={mockBook} itemType="book" />
    );

    fireEvent.click(screen.getByRole('button', { name: /contact admin/i }));

    await waitFor(() => {
      const telegramOption = screen.getByText('Telegram').closest('div');
      fireEvent.click(telegramOption!);
    });

    await waitFor(() => {
      const contactButton = screen.getByRole('button', { name: /contact via telegram/i });
      fireEvent.click(contactButton);
    });

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('https://t.me/testadmin'),
      '_blank'
    );
  });

  it('copies message to clipboard', async () => {
    renderWithQueryClient(
      <PurchaseContactModal item={mockBook} itemType="book" />
    );

    fireEvent.click(screen.getByRole('button', { name: /contact admin/i }));

    await waitFor(() => {
      const telegramOption = screen.getByText('Telegram').closest('div');
      fireEvent.click(telegramOption!);
    });

    await waitFor(() => {
      const copyButton = screen.getByRole('button', { name: '' }); // Copy button has no text, just icon
      fireEvent.click(copyButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Hi! I\'m interested in purchasing the book: "Test Book"')
    );
  });

  it('calls onContactInitiated callback', async () => {
    const mockCallback = jest.fn();
    
    renderWithQueryClient(
      <PurchaseContactModal 
        item={mockBook} 
        itemType="book" 
        onContactInitiated={mockCallback}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /contact admin/i }));

    await waitFor(() => {
      const telegramOption = screen.getByText('Telegram').closest('div');
      fireEvent.click(telegramOption!);
    });

    await waitFor(() => {
      const contactButton = screen.getByRole('button', { name: /contact via telegram/i });
      fireEvent.click(contactButton);
    });

    expect(mockCallback).toHaveBeenCalledWith('telegram');
  });

  it('handles loading state', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithQueryClient(
      <PurchaseContactModal item={mockBook} itemType="book" />
    );

    fireEvent.click(screen.getByRole('button', { name: /contact admin/i }));

    expect(screen.getByText(/loading contact information/i)).toBeInTheDocument();
  });

  it('handles no contacts available', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    renderWithQueryClient(
      <PurchaseContactModal item={mockBook} itemType="book" />
    );

    fireEvent.click(screen.getByRole('button', { name: /contact admin/i }));

    await waitFor(() => {
      expect(screen.getByText(/no admin contact information available/i)).toBeInTheDocument();
    });
  });

  it('handles fetch error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    renderWithQueryClient(
      <PurchaseContactModal item={mockBook} itemType="book" />
    );

    fireEvent.click(screen.getByRole('button', { name: /contact admin/i }));

    // The component should handle the error gracefully
    await waitFor(() => {
      expect(screen.getByText('Contact Admin for Purchase')).toBeInTheDocument();
    });
  });

  it('validates message length', async () => {
    renderWithQueryClient(
      <PurchaseContactModal item={mockBook} itemType="book" />
    );

    fireEvent.click(screen.getByRole('button', { name: /contact admin/i }));

    await waitFor(() => {
      const customMessageTextarea = screen.getByPlaceholderText(/add any specific questions/i);
      // Add a very long message
      const longMessage = 'A'.repeat(5000);
      fireEvent.change(customMessageTextarea, { target: { value: longMessage } });

      const telegramOption = screen.getByText('Telegram').closest('div');
      fireEvent.click(telegramOption!);
    });

    await waitFor(() => {
      // Should show character count
      expect(screen.getByText(/\/4096 characters/)).toBeInTheDocument();
    });
  });

  it('closes modal when cancel is clicked', async () => {
    renderWithQueryClient(
      <PurchaseContactModal item={mockBook} itemType="book" />
    );

    fireEvent.click(screen.getByRole('button', { name: /contact admin/i }));

    await waitFor(() => {
      expect(screen.getByText('Contact Admin for Purchase')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByText('Contact Admin for Purchase')).not.toBeInTheDocument();
    });
  });
});