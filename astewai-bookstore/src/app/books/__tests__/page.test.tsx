import { render, screen } from '@testing-library/react';
import BooksPage from '../page';
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
  usePathname: () => '/books',
}));

// Mock book components
vi.mock('@/components/books', () => ({
  BookGrid: () => <div data-testid="book-grid">Book Grid</div>,
  SearchBar: () => <div data-testid="search-bar">Search Bar</div>,
  BookFiltersComponent: () => <div data-testid="book-filters">Book Filters</div>,
}));

const renderBooksPage = () => {
  return render(
    <QueryProvider>
      <BooksPage />
    </QueryProvider>
  );
};

describe('Books Page', () => {
  it('renders the page title and description', () => {
    renderBooksPage();
    
    expect(screen.getByText('Books')).toBeInTheDocument();
    expect(screen.getByText('Discover and browse our collection of digital books')).toBeInTheDocument();
  });

  it('renders the search bar', () => {
    renderBooksPage();
    
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
  });

  it('renders the book filters', () => {
    renderBooksPage();
    
    expect(screen.getByTestId('book-filters')).toBeInTheDocument();
  });

  it('renders the book grid', () => {
    renderBooksPage();
    
    expect(screen.getByTestId('book-grid')).toBeInTheDocument();
  });

  it('has proper layout structure', () => {
    renderBooksPage();
    
    const container = screen.getByText('Books').closest('.container');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('mx-auto', 'px-4', 'py-8');
  });
});