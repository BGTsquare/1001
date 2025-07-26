import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { BundleGrid } from '../bundle-grid'
import { clientBundleService } from '@/lib/services/client-bundle-service'
import type { Bundle } from '@/types'

// Mock the bundle service
vi.mock('@/lib/services/client-bundle-service', () => ({
  clientBundleService: {
    searchBundles: vi.fn()
  }
}))

// Mock the BundleCard component
vi.mock('../bundle-card', () => ({
  BundleCard: ({ bundle }: { bundle: Bundle }) => (
    <div data-testid={`bundle-card-${bundle.id}`}>
      <h3>{bundle.title}</h3>
      <p>{bundle.description}</p>
      <span>${bundle.price}</span>
    </div>
  )
}))

// Mock the SearchBar component - keep it simple but functional
vi.mock('../books/search-bar', () => ({
  SearchBar: ({ onSearch, placeholder }: { onSearch: (query: string) => void; placeholder: string }) => (
    <input
      data-testid="search-bar"
      placeholder={placeholder}
      onChange={(e) => onSearch(e.target.value)}
    />
  )
}))

// Mock the Pagination components - keep them simple but functional
vi.mock('../books/pagination', () => ({
  Pagination: ({ currentPage, totalPages, onPageChange }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void 
  }) => (
    <div data-testid="pagination">
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      <span>Page {currentPage} of {totalPages}</span>
      <button 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  ),
  PaginationInfo: ({ currentPage, totalPages, totalItems, itemsPerPage }: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  }) => (
    <div data-testid="pagination-info">
      Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
    </div>
  )
}))

const mockBundles: Bundle[] = [
  {
    id: 'bundle-1',
    title: 'Programming Fundamentals Bundle',
    description: 'A comprehensive collection of programming books',
    price: 49.99,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    books: [
      {
        id: 'book-1',
        title: 'JavaScript Basics',
        author: 'John Doe',
        description: 'Learn JavaScript fundamentals',
        cover_image_url: 'https://example.com/js-book.jpg',
        content_url: 'https://example.com/js-content',
        price: 19.99,
        is_free: false,
        category: 'Programming',
        tags: ['javascript', 'web'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ]
  },
  {
    id: 'bundle-2',
    title: 'Web Development Bundle',
    description: 'Complete web development resources',
    price: 79.99,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    books: [
      {
        id: 'book-2',
        title: 'React Guide',
        author: 'Jane Smith',
        description: 'Master React development',
        cover_image_url: 'https://example.com/react-book.jpg',
        content_url: 'https://example.com/react-content',
        price: 29.99,
        is_free: false,
        category: 'Frontend',
        tags: ['react', 'javascript'],
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      }
    ]
  }
]

describe('BundleGrid', () => {
  const mockSearchBundles = vi.mocked(clientBundleService.searchBundles)

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful response by default
    mockSearchBundles.mockResolvedValue({
      success: true,
      data: {
        bundles: mockBundles,
        total: mockBundles.length
      }
    })
  })

  it('renders with initial bundles', async () => {
    render(
      <BundleGrid 
        initialBundles={mockBundles} 
        initialTotal={mockBundles.length}
      />
    )

    // Wait for the component to finish loading and show the bundles
    await waitFor(() => {
      expect(screen.getByTestId('bundle-card-bundle-1')).toBeInTheDocument()
    })
    
    expect(screen.getByTestId('bundle-card-bundle-2')).toBeInTheDocument()
    expect(screen.getByText('Programming Fundamentals Bundle')).toBeInTheDocument()
    expect(screen.getByText('Web Development Bundle')).toBeInTheDocument()
  })

  it('displays search bar when showSearch is true', () => {
    render(<BundleGrid showSearch={true} />)
    
    expect(screen.getByPlaceholderText('Search bundles...')).toBeInTheDocument()
  })

  it('hides search bar when showSearch is false', () => {
    render(<BundleGrid showSearch={false} />)
    
    expect(screen.queryByPlaceholderText('Search bundles...')).not.toBeInTheDocument()
  })

  it('displays pagination when showPagination is true and there are results', async () => {
    mockSearchBundles.mockResolvedValue({
      success: true,
      data: {
        bundles: mockBundles,
        total: 25 // More than itemsPerPage (12)
      }
    })

    render(<BundleGrid showPagination={true} />)
    
    await waitFor(() => {
      expect(screen.getByText(/Showing.*of.*books/)).toBeInTheDocument()
      expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
    })
  })

  it('hides pagination when showPagination is false', async () => {
    render(<BundleGrid showPagination={false} />)
    
    await waitFor(() => {
      expect(screen.queryByText(/Showing.*of.*books/)).not.toBeInTheDocument()
      expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument()
    })
  })

  it('loads bundles on mount', async () => {
    render(<BundleGrid />)

    await waitFor(() => {
      expect(mockSearchBundles).toHaveBeenCalledWith({
        query: undefined,
        limit: 12,
        offset: 0,
        sortBy: 'created_at',
        sortOrder: 'desc'
      }, true)
    })
  })

  it('handles search functionality', async () => {
    render(<BundleGrid />)

    // Find the actual search input by placeholder text
    const searchInput = screen.getByPlaceholderText('Search bundles...')
    fireEvent.change(searchInput, { target: { value: 'programming' } })

    await waitFor(() => {
      expect(mockSearchBundles).toHaveBeenCalledWith({
        query: 'programming',
        limit: 12,
        offset: 0,
        sortBy: 'created_at',
        sortOrder: 'desc'
      }, true)
    })
  })

  it('resets to first page when search changes', async () => {
    mockSearchBundles.mockResolvedValue({
      success: true,
      data: {
        bundles: mockBundles,
        total: 25
      }
    })

    render(<BundleGrid />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
    })

    // Go to page 2
    const nextButton = screen.getByLabelText('Go to next page')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(mockSearchBundles).toHaveBeenCalledWith({
        query: undefined,
        limit: 12,
        offset: 12,
        sortBy: 'created_at',
        sortOrder: 'desc'
      }, true)
    })

    // Now search - should reset to page 1
    const searchInput = screen.getByPlaceholderText('Search bundles...')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    await waitFor(() => {
      expect(mockSearchBundles).toHaveBeenCalledWith({
        query: 'test',
        limit: 12,
        offset: 0, // Back to first page
        sortBy: 'created_at',
        sortOrder: 'desc'
      }, true)
    })
  })

  it('handles pagination correctly', async () => {
    mockSearchBundles.mockResolvedValue({
      success: true,
      data: {
        bundles: mockBundles,
        total: 25
      }
    })

    render(<BundleGrid />)

    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
    })

    const nextButton = screen.getByLabelText('Go to next page')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(mockSearchBundles).toHaveBeenCalledWith({
        query: undefined,
        limit: 12,
        offset: 12, // Second page
        sortBy: 'created_at',
        sortOrder: 'desc'
      }, true)
    })
  })

  it('displays loading state', async () => {
    // Make the promise never resolve to keep loading state
    mockSearchBundles.mockImplementation(() => new Promise(() => {}))

    render(<BundleGrid />)

    // Should show loading skeletons
    const loadingElements = screen.getAllByRole('generic').filter(el => 
      el.className.includes('animate-pulse')
    )
    expect(loadingElements.length).toBeGreaterThan(0)
  })

  it('displays error state and retry functionality', async () => {
    mockSearchBundles.mockResolvedValue({
      success: false,
      error: 'Failed to load bundles'
    })

    render(<BundleGrid />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load bundles')).toBeInTheDocument()
      expect(screen.getByText('Try again')).toBeInTheDocument()
    })

    // Test retry functionality
    mockSearchBundles.mockResolvedValue({
      success: true,
      data: {
        bundles: mockBundles,
        total: mockBundles.length
      }
    })

    const retryButton = screen.getByText('Try again')
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.getByTestId('bundle-card-bundle-1')).toBeInTheDocument()
    })
  })

  it('displays empty state when no bundles found', async () => {
    mockSearchBundles.mockResolvedValue({
      success: true,
      data: {
        bundles: [],
        total: 0
      }
    })

    render(<BundleGrid />)

    await waitFor(() => {
      expect(screen.getByText('No bundles available')).toBeInTheDocument()
    })
  })

  it('displays empty state with search query', async () => {
    mockSearchBundles.mockResolvedValue({
      success: true,
      data: {
        bundles: [],
        total: 0
      }
    })

    render(<BundleGrid />)

    const searchInput = screen.getByPlaceholderText('Search bundles...')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    await waitFor(() => {
      expect(screen.getByText('No bundles found matching your search')).toBeInTheDocument()
      expect(screen.getByText('Clear search')).toBeInTheDocument()
    })

    // Test clear search functionality
    const clearButton = screen.getByText('Clear search')
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(mockSearchBundles).toHaveBeenCalledWith({
        query: undefined,
        limit: 12,
        offset: 0,
        sortBy: 'created_at',
        sortOrder: 'desc'
      }, true)
    })
  })

  it('displays search results info', async () => {
    mockSearchBundles.mockResolvedValue({
      success: true,
      data: {
        bundles: mockBundles,
        total: mockBundles.length
      }
    })

    render(<BundleGrid />)

    const searchInput = screen.getByPlaceholderText('Search bundles...')
    fireEvent.change(searchInput, { target: { value: 'programming' } })

    await waitFor(() => {
      expect(screen.getByText('Results for "programming"')).toBeInTheDocument()
    })
  })

  it('uses custom itemsPerPage', async () => {
    render(<BundleGrid itemsPerPage={6} />)

    await waitFor(() => {
      expect(mockSearchBundles).toHaveBeenCalledWith({
        query: undefined,
        limit: 6,
        offset: 0,
        sortBy: 'created_at',
        sortOrder: 'desc'
      }, true)
    })
  })

  it('applies custom className', () => {
    const { container } = render(<BundleGrid className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('scrolls to top when page changes', async () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    
    mockSearchBundles.mockResolvedValue({
      success: true,
      data: {
        bundles: mockBundles,
        total: 25
      }
    })

    render(<BundleGrid />)

    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
    })

    const nextButton = screen.getByLabelText('Go to next page')
    fireEvent.click(nextButton)

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    
    scrollToSpy.mockRestore()
  })

  it('handles service errors gracefully', async () => {
    mockSearchBundles.mockRejectedValue(new Error('Network error'))

    render(<BundleGrid />)

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
    })
  })
})