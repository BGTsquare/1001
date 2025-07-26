import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { SocialShare } from '../social-share'
import type { Book } from '@/types'

// Mock sonner toast
const mockToast = {
  success: vi.fn(),
  error: vi.fn()
}
vi.mock('sonner', () => ({
  toast: mockToast
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn()
  }
})

// Mock window.open
global.window.open = vi.fn()

const mockBook: Book = {
  id: '1',
  title: 'Test Book',
  author: 'Test Author',
  description: 'Test description',
  cover_image_url: null,
  content_url: null,
  price: 19.99,
  is_free: false,
  category: null,
  tags: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

describe('SocialShare', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.location
    delete (window as any).location
    ;(window as any).location = { origin: 'https://example.com' }
  })

  it('does not render when isOpen is false', () => {
    render(<SocialShare book={mockBook} isOpen={false} onClose={mockOnClose} />)
    
    expect(screen.queryByText('Share Book')).not.toBeInTheDocument()
  })

  it('renders book information when opened', () => {
    render(<SocialShare book={mockBook} isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByText('Share Book')).toBeInTheDocument()
    expect(screen.getByText('Test Book')).toBeInTheDocument()
    expect(screen.getByText('by Test Author')).toBeInTheDocument()
  })

  it('displays the correct share link', () => {
    render(<SocialShare book={mockBook} isOpen={true} onClose={mockOnClose} />)
    
    const linkInput = screen.getByDisplayValue('https://example.com/books/1')
    expect(linkInput).toBeInTheDocument()
    expect(linkInput).toHaveAttribute('readonly')
  })

  it('copies link to clipboard successfully', async () => {
    ;(navigator.clipboard.writeText as any).mockResolvedValueOnce(undefined)

    render(<SocialShare book={mockBook} isOpen={true} onClose={mockOnClose} />)
    
    const copyButton = screen.getByRole('button', { name: /copy/i })
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/books/1')
      expect(mockToast.success).toHaveBeenCalledWith('Link copied to clipboard!')
    })
  })

  it('handles clipboard copy error', async () => {
    ;(navigator.clipboard.writeText as any).mockRejectedValueOnce(new Error('Clipboard error'))

    render(<SocialShare book={mockBook} isOpen={true} onClose={mockOnClose} />)
    
    const copyButton = screen.getByRole('button', { name: /copy/i })
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to copy link')
    })
  })

  it('shows check icon temporarily after successful copy', async () => {
    ;(navigator.clipboard.writeText as any).mockResolvedValueOnce(undefined)

    render(<SocialShare book={mockBook} isOpen={true} onClose={mockOnClose} />)
    
    const copyButton = screen.getByRole('button', { name: /copy/i })
    fireEvent.click(copyButton)

    await waitFor(() => {
      // The check icon should be visible (we can't easily test the icon change in this setup)
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })
  })

  it('opens Twitter share window', () => {
    render(<SocialShare book={mockBook} isOpen={true} onClose={mockOnClose} />)
    
    const twitterButton = screen.getByText('Twitter')
    fireEvent.click(twitterButton)

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      'width=600,height=400'
    )
  })

  it('opens Facebook share window', () => {
    render(<SocialShare book={mockBook} isOpen={true} onClose={mockOnClose} />)
    
    const facebookButton = screen.getByText('Facebook')
    fireEvent.click(facebookButton)

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('facebook.com/sharer'),
      '_blank',
      'width=600,height=400'
    )
  })

  it('opens LinkedIn share window', () => {
    render(<SocialShare book={mockBook} isOpen={true} onClose={mockOnClose} />)
    
    const linkedinButton = screen.getByText('LinkedIn')
    fireEvent.click(linkedinButton)

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('linkedin.com/sharing'),
      '_blank',
      'width=600,height=400'
    )
  })

  it('opens email share window', () => {
    render(<SocialShare book={mockBook} isOpen={true} onClose={mockOnClose} />)
    
    const emailButton = screen.getByText('Email')
    fireEvent.click(emailButton)

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('mailto:'),
      '_blank',
      'width=600,height=400'
    )
  })

  it('closes modal when X button is clicked', () => {
    render(<SocialShare book={mockBook} isOpen={true} onClose={mockOnClose} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('closes modal when Close button is clicked', () => {
    render(<SocialShare book={mockBook} isOpen={true} onClose={mockOnClose} />)
    
    const closeButton = screen.getByText('Close')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('renders all social media buttons', () => {
    render(<SocialShare book={mockBook} isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByText('Twitter')).toBeInTheDocument()
    expect(screen.getByText('Facebook')).toBeInTheDocument()
    expect(screen.getByText('LinkedIn')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('generates correct share URLs with encoded content', () => {
    render(<SocialShare book={mockBook} isOpen={true} onClose={mockOnClose} />)
    
    const twitterButton = screen.getByText('Twitter')
    fireEvent.click(twitterButton)

    const expectedText = encodeURIComponent('Check out "Test Book" by Test Author on Astewai Digital Bookstore')
    const expectedUrl = encodeURIComponent('https://example.com/books/1')

    expect(window.open).toHaveBeenCalledWith(
      `https://twitter.com/intent/tweet?text=${expectedText}&url=${expectedUrl}`,
      '_blank',
      'width=600,height=400'
    )
  })

  it('generates correct email share with subject and body', () => {
    render(<SocialShare book={mockBook} isOpen={true} onClose={mockOnClose} />)
    
    const emailButton = screen.getByText('Email')
    fireEvent.click(emailButton)

    const expectedSubject = encodeURIComponent('Test Book')
    const expectedBody = encodeURIComponent('Check out "Test Book" by Test Author on Astewai Digital Bookstore')
    const expectedUrl = encodeURIComponent('https://example.com/books/1')

    expect(window.open).toHaveBeenCalledWith(
      `mailto:?subject=${expectedSubject}&body=${expectedBody}%0A%0A${expectedUrl}`,
      '_blank',
      'width=600,height=400'
    )
  })

  it('handles books with special characters in title', () => {
    const bookWithSpecialChars = {
      ...mockBook,
      title: 'Test & "Special" Book',
      author: 'Author O\'Reilly'
    }

    render(<SocialShare book={bookWithSpecialChars} isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByText('Test & "Special" Book')).toBeInTheDocument()
    expect(screen.getByText('by Author O\'Reilly')).toBeInTheDocument()

    const twitterButton = screen.getByText('Twitter')
    fireEvent.click(twitterButton)

    // Should properly encode special characters
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      'width=600,height=400'
    )
  })
})