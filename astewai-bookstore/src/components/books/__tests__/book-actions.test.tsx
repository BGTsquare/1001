import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { BookActions } from '../book-actions'
import { useAuth } from '@/contexts/auth-context'
import { useBookOwnership } from '@/hooks/use-book-ownership'
import { useBookActions } from '@/hooks/use-book-actions'
import type { Book } from '@/types'

// Mock the hooks
vi.mock('@/contexts/auth-context')
vi.mock('@/hooks/use-book-ownership')
vi.mock('@/hooks/use-book-actions')

const mockBook: Book = {
  id: 'test-book-id',
  title: 'Test Book',
  author: 'Test Author',
  description: 'Test Description',
  price: 29.99,
  is_free: false,
  category: 'Technology',
  tags: ['programming'],
  cover_image_url: null,
  content_url: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockFreeBook: Book = {
  ...mockBook,
  price: 0,
  is_free: true,
}

describe('BookActions', () => {
  const mockHandleReadNow = vi.fn()
  const mockHandleAddToLibrary = vi.fn()
  const mockHandlePurchase = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-id', email: 'test@example.com' },
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    })

    vi.mocked(useBookActions).mockReturnValue({
      isAddingToLibrary: false,
      isPurchasing: false,
      handleReadNow: mockHandleReadNow,
      handleAddToLibrary: mockHandleAddToLibrary,
      handlePurchase: mockHandlePurchase,
    })
  })

  it('shows loading state when checking ownership', () => {
    vi.mocked(useBookOwnership).mockReturnValue({
      isOwned: false,
      isLoading: true,
      error: null,
      setIsOwned: vi.fn(),
    })

    render(<BookActions book={mockBook} />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows "Read Now" button when user owns the book', () => {
    vi.mocked(useBookOwnership).mockReturnValue({
      isOwned: true,
      isLoading: false,
      error: null,
      setIsOwned: vi.fn(),
    })

    render(<BookActions book={mockBook} />)
    
    const readButton = screen.getByText('Read Now')
    expect(readButton).toBeInTheDocument()
    
    fireEvent.click(readButton)
    expect(mockHandleReadNow).toHaveBeenCalled()
  })

  it('shows "Add to Library" button for free books', () => {
    vi.mocked(useBookOwnership).mockReturnValue({
      isOwned: false,
      isLoading: false,
      error: null,
      setIsOwned: vi.fn(),
    })

    render(<BookActions book={mockFreeBook} />)
    
    const addButton = screen.getByText('Add to Library')
    expect(addButton).toBeInTheDocument()
    
    fireEvent.click(addButton)
    expect(mockHandleAddToLibrary).toHaveBeenCalled()
  })

  it('shows purchase options for paid books', () => {
    vi.mocked(useBookOwnership).mockReturnValue({
      isOwned: false,
      isLoading: false,
      error: null,
      setIsOwned: vi.fn(),
    })

    render(<BookActions book={mockBook} />)
    
    const buyButton = screen.getByText('Buy Now')
    expect(buyButton).toBeInTheDocument()
    
    fireEvent.click(buyButton)
    expect(mockHandlePurchase).toHaveBeenCalled()
  })

  it('shows loading state during purchase', () => {
    vi.mocked(useBookOwnership).mockReturnValue({
      isOwned: false,
      isLoading: false,
      error: null,
      setIsOwned: vi.fn(),
    })

    vi.mocked(useBookActions).mockReturnValue({
      isAddingToLibrary: false,
      isPurchasing: true,
      handleReadNow: mockHandleReadNow,
      handleAddToLibrary: mockHandleAddToLibrary,
      handlePurchase: mockHandlePurchase,
    })

    render(<BookActions book={mockBook} />)
    
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })
})