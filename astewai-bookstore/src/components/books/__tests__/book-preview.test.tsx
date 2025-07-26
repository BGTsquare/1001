import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { BookPreview } from '../book-preview'
import type { Book } from '@/types'

// Mock fetch
global.fetch = vi.fn()

const mockBook: Book = {
  id: '1',
  title: 'Test Book',
  author: 'Test Author',
  description: 'Test description',
  cover_image_url: null,
  content_url: 'https://example.com/content.pdf',
  price: 19.99,
  is_free: false,
  category: null,
  tags: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockPreviewContent = {
  title: 'Test Book',
  content: `# Test Book
*by Test Author*

---

## Chapter 1: Introduction

This is the introduction to the test book.

## What You'll Find in the Full Book

- Comprehensive coverage
- Detailed examples
- Practical exercises

---

*This is a limited preview.*`,
  totalPages: 250,
  previewPages: 25
}

describe('BookPreview', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render when isOpen is false', () => {
    render(<BookPreview book={mockBook} isOpen={false} onClose={mockOnClose} />)
    
    expect(screen.queryByText('Book Preview: Test Book')).not.toBeInTheDocument()
  })

  it('renders loading state initially when opened', () => {
    render(<BookPreview book={mockBook} isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByText('Book Preview: Test Book')).toBeInTheDocument()
    expect(screen.getByText('Loading preview...')).toBeInTheDocument()
  })

  it('fetches and displays preview content successfully', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve(mockPreviewContent)
    }
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    render(<BookPreview book={mockBook} isOpen={true} onClose={mockOnClose} />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/books/1/preview')
    })

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument()
      expect(screen.getByText('by Test Author')).toBeInTheDocument()
      expect(screen.getByText('Chapter 1: Introduction')).toBeInTheDocument()
      expect(screen.getByText('This is the introduction to the test book.')).toBeInTheDocument()
    })
  })

  it('displays preview info with page counts', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve(mockPreviewContent)
    }
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    render(<BookPreview book={mockBook} isOpen={true} onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('Preview: 25 of 250 pages')).toBeInTheDocument()
    })
  })

  it('handles API error and shows fallback content', async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to load preview' })
    }
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    render(<BookPreview book={mockBook} isOpen={true} onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load preview')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    // Should still show fallback content
    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument()
    })
  })

  it('allows retry when preview fails to load', async () => {
    const mockErrorResponse = {
      ok: false,
      json: () => Promise.resolve({ error: 'Network error' })
    }
    const mockSuccessResponse = {
      ok: true,
      json: () => Promise.resolve(mockPreviewContent)
    }
    
    ;(global.fetch as any)
      .mockResolvedValueOnce(mockErrorResponse)
      .mockResolvedValueOnce(mockSuccessResponse)

    render(<BookPreview book={mockBook} isOpen={true} onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    const retryButton = screen.getByText('Try Again')
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    await waitFor(() => {
      expect(screen.getByText('Chapter 1: Introduction')).toBeInTheDocument()
    })
  })

  it('closes modal when close button is clicked', () => {
    render(<BookPreview book={mockBook} isOpen={true} onClose={mockOnClose} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('closes modal when "Close Preview" button is clicked', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve(mockPreviewContent)
    }
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    render(<BookPreview book={mockBook} isOpen={true} onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('Close Preview')).toBeInTheDocument()
    })

    const closePreviewButton = screen.getByText('Close Preview')
    fireEvent.click(closePreviewButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('shows appropriate action button for free books', async () => {
    const freeBook = { ...mockBook, is_free: true }
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve(mockPreviewContent)
    }
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    render(<BookPreview book={freeBook} isOpen={true} onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('Add to Library')).toBeInTheDocument()
    })
  })

  it('shows appropriate action button for paid books', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve(mockPreviewContent)
    }
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    render(<BookPreview book={mockBook} isOpen={true} onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('Buy Now')).toBeInTheDocument()
    })
  })

  it('renders markdown-like content correctly', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve(mockPreviewContent)
    }
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    render(<BookPreview book={mockBook} isOpen={true} onClose={mockOnClose} />)

    await waitFor(() => {
      // Check that headers are rendered as headers
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('Test Book')
      
      const h2 = screen.getByRole('heading', { level: 2 })
      expect(h2).toHaveTextContent('Chapter 1: Introduction')
    })
  })

  it('handles network errors gracefully', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    render(<BookPreview book={mockBook} isOpen={true} onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load preview')).toBeInTheDocument()
    })

    // Should still show fallback content
    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument()
    })
  })

  it('only fetches content when modal is opened', () => {
    const { rerender } = render(<BookPreview book={mockBook} isOpen={false} onClose={mockOnClose} />)
    
    expect(global.fetch).not.toHaveBeenCalled()

    rerender(<BookPreview book={mockBook} isOpen={true} onClose={mockOnClose} />)
    
    expect(global.fetch).toHaveBeenCalledWith('/api/books/1/preview')
  })

  it('generates fallback content when API fails', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('API Error'))

    render(<BookPreview book={mockBook} isOpen={true} onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument()
      expect(screen.getByText('by Test Author')).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()
    })
  })
})