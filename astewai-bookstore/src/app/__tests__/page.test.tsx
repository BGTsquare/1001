import { render, screen } from '@testing-library/react';
import Home from '../page';
import { QueryProvider } from '@/components/providers';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock the home components
vi.mock('@/components/home/featured-books', () => ({
  FeaturedBooks: () => <div data-testid="featured-books">Featured Books</div>,
}));

vi.mock('@/components/home/featured-bundles', () => ({
  FeaturedBundles: () => <div data-testid="featured-bundles">Featured Bundles</div>,
}));

vi.mock('@/components/home/recent-blog-posts', () => ({
  RecentBlogPosts: () => <div data-testid="recent-blog-posts">Recent Blog Posts</div>,
}));

const renderHome = () => {
  return render(
    <QueryProvider>
      <Home />
    </QueryProvider>
  );
};

describe('Home Page', () => {
  it('renders the hero section with app name and description', () => {
    renderHome();
    
    expect(screen.getByText(/Welcome to Astewai Digital Bookstore/)).toBeInTheDocument();
    expect(screen.getByText(/Discover, purchase, and read digital books/)).toBeInTheDocument();
  });

  it('renders navigation buttons in hero section', () => {
    renderHome();
    
    expect(screen.getByText('Browse Books')).toBeInTheDocument();
    expect(screen.getByText('View Bundles')).toBeInTheDocument();
  });

  it('renders featured books section', () => {
    renderHome();
    
    expect(screen.getAllByText('Featured Books')).toHaveLength(2); // Header and mock component
    expect(screen.getByText('Discover our handpicked selection of must-read books')).toBeInTheDocument();
    expect(screen.getByTestId('featured-books')).toBeInTheDocument();
  });

  it('renders featured bundles section', () => {
    renderHome();
    
    expect(screen.getByText('Popular Bundles')).toBeInTheDocument();
    expect(screen.getByText('Save more with our curated book collections')).toBeInTheDocument();
    expect(screen.getByTestId('featured-bundles')).toBeInTheDocument();
  });

  it('renders stats section', () => {
    renderHome();
    
    expect(screen.getByText('1000+')).toBeInTheDocument();
    expect(screen.getByText('Books Available')).toBeInTheDocument();
    expect(screen.getByText('5000+')).toBeInTheDocument();
    expect(screen.getByText('Happy Readers')).toBeInTheDocument();
    expect(screen.getByText('50+')).toBeInTheDocument();
    expect(screen.getByText('Book Bundles')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('Average Rating')).toBeInTheDocument();
  });

  it('renders features section', () => {
    renderHome();
    
    expect(screen.getByText(/Why Choose Astewai Digital Bookstore/)).toBeInTheDocument();
    expect(screen.getByText('Vast Library')).toBeInTheDocument();
    expect(screen.getByText('Curated Bundles')).toBeInTheDocument();
    expect(screen.getByText('Reading Progress')).toBeInTheDocument();
  });

  it('renders recent blog posts section', () => {
    renderHome();
    
    expect(screen.getByText('Latest from Our Blog')).toBeInTheDocument();
    expect(screen.getByText('Stay updated with book reviews, author interviews, and reading tips')).toBeInTheDocument();
    expect(screen.getByTestId('recent-blog-posts')).toBeInTheDocument();
  });

  it('renders call-to-action section', () => {
    renderHome();
    
    expect(screen.getByText('Start Your Reading Journey Today')).toBeInTheDocument();
    expect(screen.getByText(/Join thousands of readers/)).toBeInTheDocument();
    expect(screen.getByText('Get Started Free')).toBeInTheDocument();
  });

  it('has proper navigation links', () => {
    renderHome();
    
    const browseLink = screen.getByText('Browse Books').closest('a');
    const bundlesLink = screen.getByText('View Bundles').closest('a');
    const signUpLink = screen.getByText('Get Started Free').closest('a');
    
    expect(browseLink).toHaveAttribute('href', '/books');
    expect(bundlesLink).toHaveAttribute('href', '/bundles');
    expect(signUpLink).toHaveAttribute('href', '/auth/register');
  });
});