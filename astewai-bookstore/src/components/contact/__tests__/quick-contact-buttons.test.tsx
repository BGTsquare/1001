import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryProvider } from '@tanstack/react-query';
import { QuickContactButtons, SingleContactButton } from '../quick-contact-buttons';
import type { Book, Bundle, AdminContactInfo } from '@/types';

// Mock the toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

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

describe('QuickContactButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockContacts }),
    });
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithQueryClient(
      <QuickContactButtons item={mockBook} itemType="book" />
    );

    expect(screen.getByText(/loading contact options/i)).toBeInTheDocument();
  });

  it('renders contact buttons after loading', async () => {
    renderWithQueryClient(
      <QuickContactButtons item={mockBook} itemType="book" />
    );

    await waitFor(() => {
      expect(screen.getByText('Quick Contact:')).toBeInTheDocument();
      expect(screen.getByText('Telegram')).toBeInTheDocument();
      expect(screen.getByText('WhatsApp')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });
  });

  it('shows display names for contacts', async () => {
    renderWithQueryClient(
      <QuickContactButtons item={mockBook} itemType="book" />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Admin')).toBeInTheDocument();
      expect(screen.getByText('WhatsApp Admin')).toBeInTheDocument();
      expect(screen.getByText('Email Admin')).toBeInTheDocument();
    });
  });

  it('opens contact URL when button is clicked', async () => {
    renderWithQueryClient(
      <QuickContactButtons item={mockBook} itemType="book" />
    );

    await waitFor(() => {
      const telegramButton = screen.getByText('Telegram').closest('button');
      fireEvent.click(telegramButton!);
    });

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('https://t.me/testadmin'),
      '_blank'
    );
  });

  it('calls onContactInitiated callback', async () => {
    const mockCallback = jest.fn();
    
    renderWithQueryClient(
      <QuickContactButtons 
        item={mockBook} 
        itemType="book" 
        onContactInitiated={mockCallback}
      />
    );

    await waitFor(() => {
      const telegramButton = screen.getByText('Telegram').closest('button');
      fireEvent.click(telegramButton!);
    });

    expect(mockCallback).toHaveBeenCalledWith('telegram');
  });

  it('handles no contacts available', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    renderWithQueryClient(
      <QuickContactButtons item={mockBook} itemType="book" />
    );

    await waitFor(() => {
      expect(screen.getByText(/no contact methods available/i)).toBeInTheDocument();
    });
  });

  it('prioritizes primary contacts', async () => {
    const contactsWithMultipleTelegram = [
      ...mockContacts,
      {
        id: '4',
        admin_id: 'admin2',
        contact_type: 'telegram' as const,
        contact_value: '@secondadmin',
        display_name: 'Second Admin',
        is_active: true,
        is_primary: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: contactsWithMultipleTelegram }),
    });

    renderWithQueryClient(
      <QuickContactButtons item={mockBook} itemType="book" />
    );

    await waitFor(() => {
      // Should show the primary contact (Test Admin) not the secondary one
      expect(screen.getByText('Test Admin')).toBeInTheDocument();
      expect(screen.queryByText('Second Admin')).not.toBeInTheDocument();
    });
  });
});

describe('SingleContactButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockContacts }),
    });
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithQueryClient(
      <SingleContactButton item={mockBook} itemType="book" />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders contact button for specific method', async () => {
    renderWithQueryClient(
      <SingleContactButton 
        item={mockBook} 
        itemType="book" 
        contactMethod="telegram"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/contact via telegram/i)).toBeInTheDocument();
    });
  });

  it('renders contact button for primary contact when no method specified', async () => {
    renderWithQueryClient(
      <SingleContactButton item={mockBook} itemType="book" />
    );

    await waitFor(() => {
      expect(screen.getByText(/contact via telegram/i)).toBeInTheDocument();
    });
  });

  it('opens contact URL when clicked', async () => {
    renderWithQueryClient(
      <SingleContactButton 
        item={mockBook} 
        itemType="book" 
        contactMethod="telegram"
      />
    );

    await waitFor(() => {
      const button = screen.getByText(/contact via telegram/i);
      fireEvent.click(button);
    });

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('https://t.me/testadmin'),
      '_blank'
    );
  });

  it('calls onContactInitiated callback', async () => {
    const mockCallback = jest.fn();
    
    renderWithQueryClient(
      <SingleContactButton 
        item={mockBook} 
        itemType="book" 
        contactMethod="telegram"
        onContactInitiated={mockCallback}
      />
    );

    await waitFor(() => {
      const button = screen.getByText(/contact via telegram/i);
      fireEvent.click(button);
    });

    expect(mockCallback).toHaveBeenCalledWith('telegram');
  });

  it('handles unavailable contact method', async () => {
    const contactsWithoutWhatsApp = mockContacts.filter(c => c.contact_type !== 'whatsapp');
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: contactsWithoutWhatsApp }),
    });

    renderWithQueryClient(
      <SingleContactButton 
        item={mockBook} 
        itemType="book" 
        contactMethod="whatsapp"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/no contact available/i)).toBeInTheDocument();
    });
  });

  it('renders custom children', async () => {
    renderWithQueryClient(
      <SingleContactButton 
        item={mockBook} 
        itemType="book" 
        contactMethod="telegram"
      >
        Custom Button Text
      </SingleContactButton>
    );

    await waitFor(() => {
      expect(screen.getByText('Custom Button Text')).toBeInTheDocument();
    });
  });

  it('applies custom styling props', async () => {
    renderWithQueryClient(
      <SingleContactButton 
        item={mockBook} 
        itemType="book" 
        contactMethod="telegram"
        variant="secondary"
        size="lg"
        className="custom-class"
      />
    );

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  it('handles no contacts available', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    renderWithQueryClient(
      <SingleContactButton item={mockBook} itemType="book" />
    );

    await waitFor(() => {
      expect(screen.getByText(/no contact available/i)).toBeInTheDocument();
    });
  });

  it('generates correct message for bundle', async () => {
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

    renderWithQueryClient(
      <SingleContactButton 
        item={mockBundle} 
        itemType="bundle" 
        contactMethod="telegram"
      />
    );

    await waitFor(() => {
      const button = screen.getByText(/contact via telegram/i);
      fireEvent.click(button);
    });

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('bundle%3A%20%22Test%20Bundle%22%20for%20%2449.99'),
      '_blank'
    );
  });
});