import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { WelcomeEmail } from '../welcome-email';

describe('WelcomeEmail', () => {
  const defaultProps = {
    userName: 'John Doe',
    userEmail: 'john@example.com',
  };

  it('should render welcome email with user name', () => {
    const { getByText } = render(<WelcomeEmail {...defaultProps} />);
    
    expect(getByText('Welcome to Astewai Digital Bookstore! 📚')).toBeInTheDocument();
    expect(getByText('Hi John Doe,')).toBeInTheDocument();
  });

  it('should display user email address', () => {
    const { getByText } = render(<WelcomeEmail {...defaultProps} />);
    
    expect(getByText(/john@example\.com/)).toBeInTheDocument();
  });

  it('should include feature highlights', () => {
    const { getByText } = render(<WelcomeEmail {...defaultProps} />);
    
    expect(getByText(/Discover Books/)).toBeInTheDocument();
    expect(getByText(/Explore Bundles/)).toBeInTheDocument();
    expect(getByText(/Build Your Library/)).toBeInTheDocument();
    expect(getByText(/Read Our Blog/)).toBeInTheDocument();
  });

  it('should include call-to-action button', () => {
    const { getByText } = render(<WelcomeEmail {...defaultProps} />);
    
    const button = getByText('Start Exploring Books');
    expect(button).toBeInTheDocument();
    expect(button.closest('a')).toHaveAttribute('href', 'https://astewai-bookstore.com/books');
  });

  it('should include support information', () => {
    const { getByText } = render(<WelcomeEmail {...defaultProps} />);
    
    expect(getByText(/support team/)).toBeInTheDocument();
    expect(getByText(/The Astewai Bookstore Team/)).toBeInTheDocument();
  });

  it('should handle different user names', () => {
    const props = {
      ...defaultProps,
      userName: 'Jane Smith',
    };
    
    const { getByText } = render(<WelcomeEmail {...props} />);
    
    expect(getByText('Hi Jane Smith,')).toBeInTheDocument();
  });

  it('should handle different email addresses', () => {
    const props = {
      ...defaultProps,
      userEmail: 'jane.smith@example.com',
    };
    
    const { getByText } = render(<WelcomeEmail {...props} />);
    
    expect(getByText(/jane\.smith@example\.com/)).toBeInTheDocument();
  });
});