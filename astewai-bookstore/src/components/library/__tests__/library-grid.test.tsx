import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { LibraryGrid } from '../library-grid'
import type { UserLibrary } from '@/types'

// Mock Next.js components
vi.mock('next/image', () => ({
  default: function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />
  }
}))

vi.mock('next/link', () => ({
  default: function MockLink({ href, children, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
}))

const mockBook: UserLibrary = {
  id: '1',
  user_id: 'user1',
  book_id: 'book1',
  status: 'owned',
  progress: 45,
  last_read_position: 'chapter-3',
  added_at: '2024-01-01T00:00:00Z',
  book: {
    id: 'book1',
    title: 'Test Book',
    author: 'Test Author',
    description: 'A test book description',
    cover_image_url: 'https://example.com/cover.jpg',
    content_url: 'https://example.com/content.pdf',
    price: 9.99,
    is_free: false,
    category: 'Fiction',
    tags: ['adventure', 'mystery'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
}

const mockOnProgressUpdate = vi.fn()
const mockOnStatusUpdate = vi.fn()
const mockOnRemoveBook = vi.fn()

const defaultProps = {
  books: [mockBook],
  onProgressUpdate: mockOnProgressUpdate,
  onStatusUpdate: mockOnStatusUpdate,
  onRemoveBook: mockOnRemoveBook
}

describe('LibraryGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading skeleton when isLoading is true', () => {
    const { container } = render(<LibraryGrid books={[]} isLoading={true} />)
    
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(8)
  })

  it('renders empty state when no books', () => {
    render(<LibraryGrid books={[]} />)
    
    expect(screen.getByText('No books in your library')).toBeInTheDocument()
    expect(screen.getByText('Browse Books')).toBeInTheDocument()
  })

  it('renders book cards correctly', () => {
    render(<LibraryGrid {...defaultProps} />)
    
    expect(screen.getByText('Test Book')).toBeInTheDocument()
    expect(screen.getByText('by Test Author')).toBeInTheDocument()
    expect(screen.getByText('Fiction')).toBeInTheDocument()
    expect(screen.getByText('adventure')).toBeInTheDocument()
  })

  it('shows progress bar for books with progress', () => {
    render(<LibraryGrid {...defaultProps} />)
    
    expect(screen.getByText('45% complete')).toBeInTheDocument()
  })

  it('shows correct action button based on progress', () => {
    const { rerender } = render(<LibraryGrid {...defaultProps} />)
    
    // Book with progress should show "Continue Reading"
    expect(screen.getByText('Continue Reading')).toBeInTheDocument()

    // Book without progress should show "Start Reading"
    const bookWithoutProgress = {
      ...mockBook,
      progress: 0
    }
    rerender(<LibraryGrid books={[bookWithoutProgress]} />)
    expect(screen.getByText('Start Reading')).toBeInTheDocument()

    // Completed book should show "Read Again"
    const completedBook = {
      ...mockBook,
      status: 'completed' as const,
      progress: 100
    }
    rerender(<LibraryGrid books={[completedBook]} />)
    expect(screen.getByText('Read Again')).toBeInTheDocument()
  })

  it('calls onStatusUpdate when mark complete is clicked', async () => {
    render(<LibraryGrid {...defaultProps} />)
    
    const markCompleteButton = screen.getByText('Mark Complete')
    fireEvent.click(markCompleteButton)
    
    await waitFor(() => {
      expect(mockOnStatusUpdate).toHaveBeenCalledWith('book1', 'completed')
    })
  })

  it('calls onRemoveBook when remove is clicked', async () => {
    render(<LibraryGrid {...defaultProps} />)
    
    const removeButton = screen.getByText('Remove')
    fireEvent.click(removeButton)
    
    await waitFor(() => {
      expect(mockOnRemoveBook).toHaveBeenCalledWith('book1')
    })
  })

  it('does not show mark complete button for completed books', () => {
    const completedBook = {
      ...mockBook,
      status: 'completed' as const,
      progress: 100
    }
    
    render(<LibraryGrid books={[completedBook]} />)
    
    expect(screen.queryByText('Mark Complete')).not.toBeInTheDocument()
  })

  it('shows book status badge', () => {
    render(<LibraryGrid {...defaultProps} />)
    
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('handles books without cover images', () => {
    const bookWithoutCover = {
      ...mockBook,
      book: {
        ...mockBook.book!,
        cover_image_url: null
      }
    }
    
    render(<LibraryGrid books={[bookWithoutCover]} />)
    
    expect(screen.getByText('No cover')).toBeInTheDocument()
  })

  it('shows added date', () => {
    render(<LibraryGrid {...defaultProps} />)
    
    expect(screen.getByText(/Added/)).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <LibraryGrid {...defaultProps} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})