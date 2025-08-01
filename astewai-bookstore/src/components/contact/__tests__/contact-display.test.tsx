import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContactDisplay, ContactMethodSelector, ContactButton } from '../contact-display';
import type { AdminContactInfo } from '@/types';

// Mock window.open
const mockOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true,
});

describe('ContactDisplay', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render contact information correctly', () => {
    render(<ContactDisplay contacts={mockContacts} />);

    expect(screen.getByText('Contact Admin')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Admin Team')).toBeInTheDocument();
    expect(screen.getByText('Telegram')).toBeInTheDocument();
    expect(screen.getByText('@admin')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  it('should show message when no contacts available', () => {
    render(<ContactDisplay contacts={[]} />);

    expect(screen.getByText('No contact information available at the moment.')).toBeInTheDocument();
  });

  it('should filter to primary contacts only when showPrimaryOnly is true', () => {
    render(<ContactDisplay contacts={mockContacts} showPrimaryOnly={true} />);

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.queryByText('Telegram')).not.toBeInTheDocument();
  });

  it('should open contact URL when contact button is clicked', () => {
    render(<ContactDisplay contacts={mockContacts} />);

    const contactButtons = screen.getAllByText('Contact');
    fireEvent.click(contactButtons[0]);

    expect(mockOpen).toHaveBeenCalledWith('mailto:admin@example.com', '_blank');
  });

  it('should use custom title when provided', () => {
    render(<ContactDisplay contacts={mockContacts} title="Get Support" />);

    expect(screen.getByText('Get Support')).toBeInTheDocument();
  });
});

describe('ContactMethodSelector', () => {
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

  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render contact method options', () => {
    render(<ContactMethodSelector contacts={mockContacts} onSelect={mockOnSelect} />);

    expect(screen.getByText('Choose contact method:')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Telegram')).toBeInTheDocument();
  });

  it('should call onSelect when a method is clicked', () => {
    render(<ContactMethodSelector contacts={mockContacts} onSelect={mockOnSelect} />);

    const emailButton = screen.getByRole('button', { name: /Email/ });
    fireEvent.click(emailButton);

    expect(mockOnSelect).toHaveBeenCalledWith(mockContacts[0]);
  });

  it('should show selected method with different styling', () => {
    render(
      <ContactMethodSelector 
        contacts={mockContacts} 
        onSelect={mockOnSelect} 
        selectedMethod="email" 
      />
    );

    const emailButton = screen.getByRole('button', { name: /Email/ });
    expect(emailButton).toHaveClass('bg-primary'); // Default variant styling
  });

  it('should show display name when available', () => {
    render(<ContactMethodSelector contacts={mockContacts} onSelect={mockOnSelect} />);

    expect(screen.getByText('(Admin Team)')).toBeInTheDocument();
  });
});

describe('ContactButton', () => {
  const mockContact: AdminContactInfo = {
    id: '1',
    admin_id: 'admin-1',
    contact_type: 'email',
    contact_value: 'admin@example.com',
    display_name: 'Admin Team',
    is_active: true,
    is_primary: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default content', () => {
    render(<ContactButton contact={mockContact} />);

    expect(screen.getByText('📧 Contact via Email')).toBeInTheDocument();
  });

  it('should render with custom children', () => {
    render(
      <ContactButton contact={mockContact}>
        Custom Contact Text
      </ContactButton>
    );

    expect(screen.getByText('Custom Contact Text')).toBeInTheDocument();
  });

  it('should open contact URL with message when clicked', () => {
    const message = 'Hello, I need help!';
    render(<ContactButton contact={mockContact} message={message} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOpen).toHaveBeenCalledWith(
      'mailto:admin@example.com?subject=Purchase Request&body=Hello%2C%20I%20need%20help!',
      '_blank'
    );
  });

  it('should apply custom variant and size', () => {
    render(
      <ContactButton 
        contact={mockContact} 
        variant="outline" 
        size="sm"
        className="custom-class"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });
});