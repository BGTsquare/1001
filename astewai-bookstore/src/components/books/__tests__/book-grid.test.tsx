import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { BookGrid } from '../book-grid'
import { clientBookService } from '@/lib/books'
import type { Book } from '@/types'

// Mock the book service
vi.mock('@/lib/books', () => ({
  clientBookService: {
    searchBooks: vi.fn(),
    getCategories: vi.fn(),
    getTags: vi.fn()
  }
}))

// Mock Next.js components
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>
}))

const mockBooks: Book[] = [
  {
    id: '1',
    title: 'Test Book 1',
    author: 'Author 1',
    description: 'Description 1',
    cover_image_url: 'https://example.com/cover1.jpg',
    content_url: 'https://example.com/content1.pdf',
    price: 19.99,
    is_free: false,
    category: 'Fiction',
    tags: ['adventure'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Test Book 2',
    author: 'Author 2',
    description: 'Description 2',
    cover_image_url: 'https://example.com/cover2.jpg',
    content_url: 'https://example.com/content2.pdf',
    price: 0,
    is_free: true,
    category: 'Non-Fiction',
    tags: ['biography'],
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
]

const mockClientBookService = clientBookService as any

describe('BookGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock responses
    mockClientBookService.searchBooks.mockResolvedValue({
      success: true,
      data: { books: mockBooks, total: 2 }
    })
    
    mockClientBookService.getCategories.mockResolvedValue({
      success: true,
      data: ['Fiction', 'Non-Fiction']
    })
    
    mockClientBookService.getTags.mockResolvedValue({
      success: true,
      data: ['adventure', 'biography']
    })
  })

  it('renders with initial books', async () => {
    render(
      <BookGrid
        initialBooks={mockBooks}
        initialTotal={2}
      />
    )

    expect(screen.getByText('Test Book 1')).toBeInTheDocument()
    expect(screen.getByText('Test Book 2')).toBeInTheDocument()
  })

  it('loads categories and tags on mount', async () => {
    render(<BookGrid />)

    await waitFor(() => {
      expect(mockClientBookService.getCategories).toHaveBeenCalled()
      expect(mockClientBookService.getTags).toHaveBeenCalled()
    })
  })

  it('searches books when search query changes', async () => {
    const user = userEvent.setup()
    render(<BookGrid />)

    // Wait for initial load
    await waitFor(() => {
      expect(mockClientBookService.searchBooks).toHaveBeenCalled()
    })

    // Clear previous calls
    mockClientBookService.searchBooks.mockClear()

    // Type in search bar
    const searchInput = screen.getByRole('textbox')
    await user.type(searchInput, 'test query')

    // Should trigger search after debounce
    await waitFor(() => {
      expect(mockClientBookService.searchBooks).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test query'
        })
      )
    }, { timeout: 1000 })
  })

  it('displays loading state', async () => {
    // Make the service return a pending promise
    mockClientBookService.searchBooks.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<BookGrid />)

    // Should show loading skeletons
    expect(screen.getAllByText('').length).toBeGreaterThan(0) // Loading skeletons
  })

  it('displays error state', async () => {
    mockClientBookService.searchBooks.mockResolvedValue({
      success: false,
      error: 'Failed to load books'
    })

    render(<BookGrid />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load books')).toBeInTheDocument()
      expect(screen.getByText('Try again')).toBeInTheDocument()
    })
  })

  it('displays empty state when no books found', async () => {
    mockClientBookService.searchBooks.mockResolvedValue({
      success: true,
      data: { books: [], total: 0 }
    })

    render(<BookGrid />)

    await waitFor(() => {
      expect(screen.getByText('No books available')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('displays empty state with search query', async () => {
    const user = userEvent.setup()
    
    // First load with books
    render(<BookGrid />)

    await waitFor(() => {
      expect(mockClientBookService.searchBooks).toHaveBeenCalled()
    })

    // Then return empty results for search
    mockClientBookService.searchBooks.mockResolvedValue({
      success: true,
      data: { books: [], total: 0 }
    })

    // Type in search bar
    const searchInput = screen.getByRole('textbox')
    await user.type(searchInput, 'no results')

    await waitFor(() => {
      expect(screen.getByText('No books found matching your criteria')).toBeInTheDocument()
      expect(screen.getByText('Clear search and filters')).toBeInTheDocument()
    })
  })

  it('clears search and filters when clear button is clicked', async () => {
    const user = userEvent.setup()
    
    // Setup empty results first
    mockClientBookService.searchBooks.mockResolvedValue({
      success: true,
      data: { books: [], total: 0 }
    })

    render(<BookGrid />)

    // Type in search bar
    const searchInput = screen.getByRole('textbox')
    await user.type(searchInput, 'no results')

    await waitFor(() => {
      expect(screen.getByText('Clear search and filters')).toBeInTheDocument()
    })

    // Click clear button
    const clearButton = screen.getByText('Clear search and filters')
    await user.click(clearButton)

    // Should trigger a new search with cleared parameters
    await waitFor(() => {
      expect(mockClientBookService.searchBooks).toHaveBeenCalledWith(
        expect.objectContaining({
          query: undefined
        })
      )
    })
  })

  it('handles pagination', async () => {
    const user = userEvent.setup()
    
    // Create more mock books for pagination
    const manyBooks = Array.from({ length: 12 }, (_, i) => ({
      ...mockBooks[0],
      id: `book-${i + 1}`,
      title: `Test Book ${i + 1}`
    }))
    
    // Mock response with pagination
    mockClientBookService.searchBooks.mockResolvedValue({
      success: true,
      data: { books: manyBooks, total: 25 } // More than one page
    })

    render(<BookGrid itemsPerPage={12} />)

    await waitFor(() => {
      expect(screen.getByText('Showing 1-12 of 25 books')).toBeInTheDocument()
    })

    // Should show pagination
    expect(screen.getByText('Next')).toBeInTheDocument()

    // Click next page
    const nextButton = screen.getByText('Next')
    await user.click(nextButton)

    // Should call searchBooks with offset
    await waitFor(() => {
      expect(mockClientBookService.searchBooks).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 12
        })
      )
    })
  })

  it('can be configured to hide components', () => {
    render(
      <BookGrid
        initialBooks={mockBooks}
        initialTotal={2}
        showFilters={false}
        showSearch={false}
        showPagination={false}
      />
    )

    // Should not show search, filters, or pagination
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByText('Filters')).not.toBeInTheDocument()
    expect(screen.queryByText('Showing')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <BookGrid
        initialBooks={mockBooks}
        initialTotal={2}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('retries loading on error', async () => {
    const user = userEvent.setup()
    
    // First call fails
    mockClientBookService.searchBooks.mockResolvedValueOnce({
      success: false,
      error: 'Network error'
    })

    // Second call succeeds
    mockClientBookService.searchBooks.mockResolvedValueOnce({
      success: true,
      data: { books: mockBooks, total: 2 }
    })

    render(<BookGrid />)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    // Click try again
    const retryButton = screen.getByText('Try again')
    await user.click(retryButton)

    // Should show books after retry
    await waitFor(() => {
      expect(screen.getByText('Test Book 1')).toBeInTheDocument()
    })
  })
})