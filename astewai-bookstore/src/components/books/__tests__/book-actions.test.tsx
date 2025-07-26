import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { BookActions } from '../book-actions'
import type { Book } from '@/types'

// Mock the auth context
const mockUser = { id: '1', email: 'test@example.com' }
const mockUseAuth = vi.fn()

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockUseAuth()
}))

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock sonner toast
const mockToast = {
  success: vi.fn(),
  error: vi.fn()
}
vi.mock('sonner', () => ({
  toast: mockToast
}))

// Mock fetch
global.fetch = vi.fn()

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

const mockFreeBook: Book = {
  ...mockBook,
  id: '2',
  title: 'Free Test Book',
  price: 0,
  is_free: true
}

describe('BookActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: mockUser })
  })

  describe('Free Books', () => {
    it('shows "Add to Library" button for free books', () => {
      render(<BookActions book={mockFreeBook} />)
      
      expect(screen.getByText('Add to Library')).toBeInTheDocument()
      expect(screen.queryByText('Buy Now')).not.toBeInTheDocument()
    })

    it('adds free book to library successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ message: 'Book added to your library successfully!' })
      }
      ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

      render(<BookActions book={mockFreeBook} />)
      
      const addButton = screen.getByText('Add to Library')
      fireEvent.click(addButton)

      expect(screen.getByText('Adding...')).toBeInTheDocument()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/library/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookId: '2',
          }),
        })
      })

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Book added to your library!')
        expect(mockPush).toHaveBeenCalledWith('/library')
      })
    })

    it('handles add to library error', async () => {
      const mockResponse = {
        ok: false,
        json: () => Promise.resolve({ error: 'Book is already in your library' })
      }
      ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

      render(<BookActions book={mockFreeBook} />)
      
      const addButton = screen.getByText('Add to Library')
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Book is already in your library')
      })
    })

    it('redirects to login when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({ user: null })
      
      render(<BookActions book={mockFreeBook} />)
      
      const addButton = screen.getByText('Add to Library')
      fireEvent.click(addButton)

      expect(mockPush).toHaveBeenCalledWith('/auth/login?redirect=/books/2')
    })
  })

  describe('Paid Books', () => {
    it('shows both "Buy Now" and "Add to Wishlist" buttons for paid books', () => {
      render(<BookActions book={mockBook} />)
      
      expect(screen.getByText('Buy Now')).toBeInTheDocument()
      expect(screen.getByText('Add to Wishlist')).toBeInTheDocument()
    })

    it('initiates purchase successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ 
          message: 'Purchase request created successfully.',
          checkoutUrl: 'https://checkout.stripe.com/test'
        })
      }
      ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

      // Mock window.location.href
      delete (window as any).location
      ;(window as any).location = { href: '' }

      render(<BookActions book={mockBook} />)
      
      const buyButton = screen.getByText('Buy Now')
      fireEvent.click(buyButton)

      expect(screen.getByText('Processing...')).toBeInTheDocument()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/purchases/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemType: 'book',
            itemId: '1',
            amount: 19.99,
          }),
        })
      })

      await waitFor(() => {
        expect(window.location.href).toBe('https://checkout.stripe.com/test')
      })
    })

    it('handles manual approval flow', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ 
          message: 'Purchase request submitted for approval!'
        })
      }
      ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

      render(<BookActions book={mockBook} />)
      
      const buyButton = screen.getByText('Buy Now')
      fireEvent.click(buyButton)

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Purchase request submitted for approval!')
        expect(mockPush).toHaveBeenCalledWith('/profile?tab=purchases')
      })
    })

    it('handles purchase error', async () => {
      const mockResponse = {
        ok: false,
        json: () => Promise.resolve({ error: 'You have already purchased this item' })
      }
      ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

      render(<BookActions book={mockBook} />)
      
      const buyButton = screen.getByText('Buy Now')
      fireEvent.click(buyButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('You have already purchased this item')
      })
    })

    it('adds paid book to wishlist', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ message: 'Book added to your wishlist!' })
      }
      ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

      render(<BookActions book={mockBook} />)
      
      const wishlistButton = screen.getByText('Add to Wishlist')
      fireEvent.click(wishlistButton)

      expect(screen.getByText('Adding...')).toBeInTheDocument()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/library/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookId: '1',
          }),
        })
      })

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Book added to your library!')
        expect(mockPush).toHaveBeenCalledWith('/library')
      })
    })

    it('redirects to login when user is not authenticated for purchase', () => {
      mockUseAuth.mockReturnValue({ user: null })
      
      render(<BookActions book={mockBook} />)
      
      const buyButton = screen.getByText('Buy Now')
      fireEvent.click(buyButton)

      expect(mockPush).toHaveBeenCalledWith('/auth/login?redirect=/books/1')
    })

    it('redirects to login when user is not authenticated for wishlist', () => {
      mockUseAuth.mockReturnValue({ user: null })
      
      render(<BookActions book={mockBook} />)
      
      const wishlistButton = screen.getByText('Add to Wishlist')
      fireEvent.click(wishlistButton)

      expect(mockPush).toHaveBeenCalledWith('/auth/login?redirect=/books/1')
    })
  })

  describe('Loading States', () => {
    it('shows loading state during add to library', async () => {
      const mockResponse = {
        ok: true,
        json: () => new Promise(resolve => setTimeout(() => resolve({ message: 'Success' }), 100))
      }
      ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

      render(<BookActions book={mockFreeBook} />)
      
      const addButton = screen.getByText('Add to Library')
      fireEvent.click(addButton)

      expect(screen.getByText('Adding...')).toBeInTheDocument()
      expect(addButton).toBeDisabled()
    })

    it('shows loading state during purchase', async () => {
      const mockResponse = {
        ok: true,
        json: () => new Promise(resolve => setTimeout(() => resolve({ message: 'Success' }), 100))
      }
      ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

      render(<BookActions book={mockBook} />)
      
      const buyButton = screen.getByText('Buy Now')
      fireEvent.click(buyButton)

      expect(screen.getByText('Processing...')).toBeInTheDocument()
      expect(buyButton).toBeDisabled()
    })
  })
})