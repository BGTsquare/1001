import { render, screen } from '@testing-library/react';
import ContactPage from '../page';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/contact',
}));

describe('Contact Page', () => {
  it('renders the page title and description', () => {
    render(<ContactPage />);
    
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
    expect(screen.getByText('Get in touch with our team. We\'re here to help with any questions or concerns.')).toBeInTheDocument();
  });

  it('renders contact information', () => {
    render(<ContactPage />);
    
    expect(screen.getByText('Get in Touch')).toBeInTheDocument();
    expect(screen.getByText('support@astewai-bookstore.com')).toBeInTheDocument();
    expect(screen.getByText('+1 (555) 123-4567')).toBeInTheDocument();
    expect(screen.getByText(/123 Digital Library Street/)).toBeInTheDocument();
  });

  it('renders business hours', () => {
    render(<ContactPage />);
    
    expect(screen.getByText('Business Hours')).toBeInTheDocument();
    expect(screen.getByText('Monday - Friday: 9:00 AM - 6:00 PM EST')).toBeInTheDocument();
    expect(screen.getByText('Saturday: 10:00 AM - 4:00 PM EST')).toBeInTheDocument();
    expect(screen.getByText('Sunday: Closed')).toBeInTheDocument();
  });

  it('renders quick help cards', () => {
    render(<ContactPage />);
    
    expect(screen.getByText('Quick Help')).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();
    expect(screen.getByText('Live Chat')).toBeInTheDocument();
  });

  it('renders contact form', () => {
    render(<ContactPage />);
    
    expect(screen.getByText('Send us a Message')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByText('Send Message')).toBeInTheDocument();
  });

  it('renders form category options', () => {
    render(<ContactPage />);
    
    const categorySelect = screen.getByLabelText('Category');
    expect(categorySelect).toBeInTheDocument();
    
    // Check if select has the expected options
    expect(screen.getByText('Select a category')).toBeInTheDocument();
  });

  it('renders administrative contact section', () => {
    render(<ContactPage />);
    
    expect(screen.getByText('Administrative Contact')).toBeInTheDocument();
    expect(screen.getByText('For business inquiries, partnerships, or administrative matters')).toBeInTheDocument();
    
    expect(screen.getByText('General Administration')).toBeInTheDocument();
    expect(screen.getByText('admin@astewai-bookstore.com')).toBeInTheDocument();
    expect(screen.getByText('+1 (555) 123-4500')).toBeInTheDocument();
    
    expect(screen.getByText('Content Management')).toBeInTheDocument();
    expect(screen.getByText('content@astewai-bookstore.com')).toBeInTheDocument();
    expect(screen.getByText('+1 (555) 123-4501')).toBeInTheDocument();
    
    expect(screen.getAllByText('Technical Support')).toHaveLength(2); // Form option and admin section
    expect(screen.getByText('tech@astewai-bookstore.com')).toBeInTheDocument();
    expect(screen.getByText('+1 (555) 123-4502')).toBeInTheDocument();
  });

  it('has proper layout structure', () => {
    render(<ContactPage />);
    
    const container = screen.getByText('Contact Us').closest('.container');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('mx-auto', 'px-4', 'py-8');
  });

  it('renders form with proper accessibility', () => {
    render(<ContactPage />);
    
    // Check that form inputs have proper labels
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
  });
});