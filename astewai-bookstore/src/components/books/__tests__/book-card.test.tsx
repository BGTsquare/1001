import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils'
import { BookCard } from '../book-card'
import { createMockBook } from '@/test/utils'

// Mock the auth context
const mockUseAuth = vi.fn()
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock the book actions
const mockAddToLibrary = vi.fn()
vi.mock('@/lib/services/client-library-service', () => ({
  addBookToLibrary: mockAddToLibrary,
}))

describe('BookCard', () => {
  const mockBook = createMockBook()
  
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      profile: { id: 'user-1', role: 'user' },
      loading: false,
    })
  })

  it('renders book information correctly', () => {
    render(<BookCard book={mockBook} />)

    expect(screen.getByText(mockBook.title)).toBeInTheDocument()
    expect(screen.getByText(mockBook.author)).toBeInTheDocument()
    expect(screen.getByText(mockBook.description)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: mockBook.title })).toBeInTheDocument()
  })

  it('displays price for paid books', () => {
    const paidBook = createMockBook({ is_free: false, price: 19.99 })
    render(<BookCard book={paidBook} />)

    expect(screen.getByText('$19.99')).toBeInTheDocument()
  })

  it('displays "Free" for free books', () => {
    const freeBook = createMockBook({ is_free: true, price: 0 })
    render(<BookCard book={freeBook} />)

    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('shows "Add to Library" button for free books when user is authenticated', () => {
    const freeBook = createMockBook({ is_free: true })
    render(<BookCard book={freeBook} />)

    expect(screen.getByRole('button', { name: /add to library/i })).toBeInTheDocument()
  })

  it('shows "Buy Now" button for paid books when user is authenticated', () => {
    const paidBook = createMockBook({ is_free: false })
    render(<BookCard book={paidBook} />)

    expect(screen.getByRole('button', { name: /buy now/i })).toBeInTheDocument()
  })

  it('shows login prompt when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
    })

    render(<BookCard book={mockBook} />)

    expect(screen.getByText(/sign in to purchase/i)).toBeInTheDocument()
  })

  it('calls addToLibrary when "Add to Library" is clicked', async () => {
    const freeBook = createMockBook({ is_free: true })
    mockAddToLibrary.mockResolvedValue({ success: true })

    render(<BookCard book={freeBook} />)

    const addButton = screen.getByRole('button', { name: /add to library/i })
    fireEvent.click(addButton)

    expect(mockAddToLibrary).toHaveBeenCalledWith(freeBook.id)
  })

  it('displays book tags', () => {
    const bookWithTags = createMockBook({ tags: ['fiction', 'mystery', 'thriller'] })
    render(<BookCard book={bookWithTags} />)

    expect(screen.getByText('fiction')).toBeInTheDocument()
    expect(screen.getByText('mystery')).toBeInTheDocument()
    expect(screen.getByText('thriller')).toBeInTheDocument()
  })

  it('displays book category', () => {
    const bookWithCategory = createMockBook({ category: 'Science Fiction' })
    render(<BookCard book={bookWithCategory} />)

    expect(screen.getByText('Science Fiction')).toBeInTheDocument()
  })

  it('handles missing cover image gracefully', () => {
    const bookWithoutCover = createMockBook({ cover_image_url: null })
    render(<BookCard book={bookWithoutCover} />)

    const image = screen.getByRole('img', { name: bookWithoutCover.title })
    expect(image).toHaveAttribute('src', expect.stringContaining('placeholder'))
  })

  it('is accessible', () => {
    render(<BookCard book={mockBook} />)

    // Check for proper heading structure
    expect(screen.getByRole('heading', { name: mockBook.title })).toBeInTheDocument()
    
    // Check for proper image alt text
    const image = screen.getByRole('img', { name: mockBook.title })
    expect(image).toHaveAttribute('alt', mockBook.title)
    
    // Check for proper button labels
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveAccessibleName()
    })
  })

  it('shows loading state when adding to library', async () => {
    const freeBook = createMockBook({ is_free: true })
    mockAddToLibrary.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<BookCard book={freeBook} />)

    const addButton = screen.getByRole('button', { name: /add to library/i })
    fireEvent.click(addButton)

    expect(screen.getByText(/adding/i)).toBeInTheDocument()
    expect(addButton).toBeDisabled()
  })

  it('handles add to library error', async () => {
    const freeBook = createMockBook({ is_free: true })
    mockAddToLibrary.mockRejectedValue(new Error('Failed to add book'))

    render(<BookCard book={freeBook} />)

    const addButton = screen.getByRole('button', { name: /add to library/i })
    fireEvent.click(addButton)

    // Should show error state or toast
    expect(mockAddToLibrary).toHaveBeenCalled()
  })

  it('truncates long descriptions', () => {
    const longDescription = 'A'.repeat(200)
    const bookWithLongDescription = createMockBook({ description: longDescription })
    
    render(<BookCard book={bookWithLongDescription} />)

    const description = screen.getByText(/A+/)
    expect(description.textContent?.length).toBeLessThan(longDescription.length)
  })

  it('navigates to book detail when clicked', () => {
    render(<BookCard book={mockBook} />)

    const bookLink = screen.getByRole('link', { name: new RegExp(mockBook.title, 'i') })
    expect(bookLink).toHaveAttribute('href', `/books/${mockBook.id}`)
  })
})