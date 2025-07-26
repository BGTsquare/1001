import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { BookDetail } from '../book-detail'
import type { Book } from '@/types'

// Mock the child components
vi.mock('../book-actions', () => ({
  BookActions: ({ book }: { book: Book }) => (
    <div data-testid="book-actions">Book Actions for {book.title}</div>
  )
}))

vi.mock('../book-preview', () => ({
  BookPreview: ({ book, isOpen, onClose }: { book: Book; isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
      <div data-testid="book-preview">
        <div>Preview for {book.title}</div>
        <button onClick={onClose}>Close Preview</button>
      </div>
    ) : null
  )
}))

vi.mock('../social-share', () => ({
  SocialShare: ({ book, isOpen, onClose }: { book: Book; isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
      <div data-testid="social-share">
        <div>Share {book.title}</div>
        <button onClick={onClose}>Close Share</button>
      </div>
    ) : null
  )
}))

// Mock Next.js components
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  )
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  )
}))

const mockBook: Book = {
  id: '1',
  title: 'Test Book',
  author: 'Test Author',
  description: 'This is a test book description.\nIt has multiple paragraphs.',
  cover_image_url: 'https://example.com/cover.jpg',
  content_url: 'https://example.com/content.pdf',
  price: 19.99,
  is_free: false,
  category: 'Fiction',
  tags: ['adventure', 'mystery', 'thriller'],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockFreeBook: Book = {
  ...mockBook,
  id: '2',
  title: 'Free Test Book',
  price: 0,
  is_free: true
}

describe('BookDetail', () => {
  it('renders book information correctly', () => {
    render(<BookDetail book={mockBook} />)
    
    expect(screen.getByText('Test Book')).toBeInTheDocument()
    expect(screen.getByText('by Test Author')).toBeInTheDocument()
    expect(screen.getByText('This is a test book description.')).toBeInTheDocument()
    expect(screen.getByText('It has multiple paragraphs.')).toBeInTheDocument()
    expect(screen.getByText('$19.99')).toBeInTheDocument()
    expect(screen.getByText('Fiction')).toBeInTheDocument()
  })

  it('displays tags correctly', () => {
    render(<BookDetail book={mockBook} />)
    
    expect(screen.getByText('adventure')).toBeInTheDocument()
    expect(screen.getByText('mystery')).toBeInTheDocument()
    expect(screen.getByText('thriller')).toBeInTheDocument()
  })

  it('shows free pricing for free books', () => {
    render(<BookDetail book={mockFreeBook} />)
    
    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.queryByText('$')).not.toBeInTheDocument()
  })

  it('displays book cover image when available', () => {
    render(<BookDetail book={mockBook} />)
    
    const coverImage = screen.getByAltText('Cover of Test Book')
    expect(coverImage).toBeInTheDocument()
    expect(coverImage).toHaveAttribute('src', 'https://example.com/cover.jpg')
  })

  it('shows placeholder when no cover image', () => {
    const bookWithoutCover = { ...mockBook, cover_image_url: null }
    render(<BookDetail book={bookWithoutCover} />)
    
    expect(screen.queryByAltText('Cover of Test Book')).not.toBeInTheDocument()
  })

  it('shows preview button when content is available', () => {
    render(<BookDetail book={mockBook} />)
    
    expect(screen.getByText('Preview Book')).toBeInTheDocument()
  })

  it('hides preview button when no content available', () => {
    const bookWithoutContent = { ...mockBook, content_url: null }
    render(<BookDetail book={bookWithoutContent} />)
    
    expect(screen.queryByText('Preview Book')).not.toBeInTheDocument()
  })

  it('opens preview modal when preview button is clicked', async () => {
    render(<BookDetail book={mockBook} />)
    
    const previewButton = screen.getByText('Preview Book')
    fireEvent.click(previewButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('book-preview')).toBeInTheDocument()
      expect(screen.getByText('Preview for Test Book')).toBeInTheDocument()
    })
  })

  it('closes preview modal when close button is clicked', async () => {
    render(<BookDetail book={mockBook} />)
    
    // Open preview
    const previewButton = screen.getByText('Preview Book')
    fireEvent.click(previewButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('book-preview')).toBeInTheDocument()
    })
    
    // Close preview
    const closeButton = screen.getByText('Close Preview')
    fireEvent.click(closeButton)
    
    await waitFor(() => {
      expect(screen.queryByTestId('book-preview')).not.toBeInTheDocument()
    })
  })

  it('opens share modal when share button is clicked', async () => {
    render(<BookDetail book={mockBook} />)
    
    const shareButton = screen.getByText('Share')
    fireEvent.click(shareButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('social-share')).toBeInTheDocument()
      expect(screen.getByText('Share Test Book')).toBeInTheDocument()
    })
  })

  it('closes share modal when close button is clicked', async () => {
    render(<BookDetail book={mockBook} />)
    
    // Open share
    const shareButton = screen.getByText('Share')
    fireEvent.click(shareButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('social-share')).toBeInTheDocument()
    })
    
    // Close share
    const closeButton = screen.getByText('Close Share')
    fireEvent.click(closeButton)
    
    await waitFor(() => {
      expect(screen.queryByTestId('social-share')).not.toBeInTheDocument()
    })
  })

  it('renders book actions component', () => {
    render(<BookDetail book={mockBook} />)
    
    expect(screen.getByTestId('book-actions')).toBeInTheDocument()
    expect(screen.getByText('Book Actions for Test Book')).toBeInTheDocument()
  })

  it('displays back to books link', () => {
    render(<BookDetail book={mockBook} />)
    
    const backLink = screen.getByText('Back to Books')
    expect(backLink).toBeInTheDocument()
    expect(backLink.closest('a')).toHaveAttribute('href', '/books')
  })

  it('displays book details section', () => {
    render(<BookDetail book={mockBook} />)
    
    expect(screen.getByText('Book Details')).toBeInTheDocument()
    expect(screen.getByText('Test Author')).toBeInTheDocument()
    expect(screen.getByText('Fiction')).toBeInTheDocument()
  })

  it('displays reviews section placeholder', () => {
    render(<BookDetail book={mockBook} />)
    
    expect(screen.getByText('Reviews')).toBeInTheDocument()
    expect(screen.getByText('Reviews will be available soon. Be the first to review this book!')).toBeInTheDocument()
  })

  it('handles book without description', () => {
    const bookWithoutDescription = { ...mockBook, description: null }
    render(<BookDetail book={bookWithoutDescription} />)
    
    expect(screen.getByText('Test Book')).toBeInTheDocument()
    expect(screen.queryByText('About This Book')).not.toBeInTheDocument()
  })

  it('handles book without category', () => {
    const bookWithoutCategory = { ...mockBook, category: null }
    render(<BookDetail book={bookWithoutCategory} />)
    
    expect(screen.getByText('Test Book')).toBeInTheDocument()
    // Category should not appear in the metadata or details
    expect(screen.queryByText('Fiction')).not.toBeInTheDocument()
  })

  it('handles book without tags', () => {
    const bookWithoutTags = { ...mockBook, tags: null }
    render(<BookDetail book={bookWithoutTags} />)
    
    expect(screen.getByText('Test Book')).toBeInTheDocument()
    expect(screen.queryByText('adventure')).not.toBeInTheDocument()
  })
})