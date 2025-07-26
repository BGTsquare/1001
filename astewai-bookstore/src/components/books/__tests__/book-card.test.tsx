import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { BookCard } from '../book-card'
import type { Book } from '@/types'

// Mock Next.js components
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>
}))

const mockBook: Book = {
  id: '1',
  title: 'Test Book Title',
  author: 'Test Author',
  description: 'This is a test book description that should be displayed in the card.',
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

describe('BookCard', () => {
  it('renders book information correctly', () => {
    render(<BookCard book={mockBook} />)

    expect(screen.getByText('Test Book Title')).toBeInTheDocument()
    expect(screen.getByText('by Test Author')).toBeInTheDocument()
    expect(screen.getByText('This is a test book description that should be displayed in the card.')).toBeInTheDocument()
    expect(screen.getByText('Fiction')).toBeInTheDocument()
    expect(screen.getByText('$19.99')).toBeInTheDocument()
  })

  it('displays cover image with correct alt text', () => {
    render(<BookCard book={mockBook} />)

    const image = screen.getByAltText('Cover of Test Book Title')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/cover.jpg')
  })

  it('shows "No cover" when cover image is not available', () => {
    const bookWithoutCover = { ...mockBook, cover_image_url: null }
    render(<BookCard book={bookWithoutCover} />)

    expect(screen.getByText('No cover')).toBeInTheDocument()
  })

  it('displays tags correctly with limit', () => {
    render(<BookCard book={mockBook} />)

    expect(screen.getByText('adventure')).toBeInTheDocument()
    expect(screen.getByText('mystery')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument() // Third tag should be collapsed
  })

  it('shows "Free" for free books', () => {
    render(<BookCard book={mockFreeBook} />)

    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('Add to Library')).toBeInTheDocument()
  })

  it('shows price and "Buy Now" for paid books', () => {
    render(<BookCard book={mockBook} />)

    expect(screen.getByText('$19.99')).toBeInTheDocument()
    expect(screen.getByText('Buy Now')).toBeInTheDocument()
  })

  it('creates correct links', () => {
    render(<BookCard book={mockBook} />)

    const titleLink = screen.getByRole('link', { name: 'Test Book Title' })
    expect(titleLink).toHaveAttribute('href', '/books/1')

    const detailsLink = screen.getByRole('link', { name: 'View Details' })
    expect(detailsLink).toHaveAttribute('href', '/books/1')
  })

  it('handles missing description gracefully', () => {
    const bookWithoutDescription = { ...mockBook, description: null }
    render(<BookCard book={bookWithoutDescription} />)

    expect(screen.getByText('Test Book Title')).toBeInTheDocument()
    expect(screen.getByText('by Test Author')).toBeInTheDocument()
    // Description should not be rendered
    expect(screen.queryByText('This is a test book description')).not.toBeInTheDocument()
  })

  it('handles missing category gracefully', () => {
    const bookWithoutCategory = { ...mockBook, category: null }
    render(<BookCard book={bookWithoutCategory} />)

    expect(screen.getByText('Test Book Title')).toBeInTheDocument()
    // Category should not be rendered
    expect(screen.queryByText('Fiction')).not.toBeInTheDocument()
  })

  it('handles empty tags array', () => {
    const bookWithoutTags = { ...mockBook, tags: [] }
    render(<BookCard book={bookWithoutTags} />)

    expect(screen.getByText('Test Book Title')).toBeInTheDocument()
    // No tags should be rendered
    expect(screen.queryByText('adventure')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<BookCard book={mockBook} className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})