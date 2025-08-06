import { describe, it, expect, beforeEach, vi } from 'vitest'
import { purchaseService } from '../purchase-service'

// Mock dependencies
vi.mock('@/lib/repositories/payment-repository', () => ({
  paymentRepository: {
    createPurchase: vi.fn(),
    hasExistingPurchase: vi.fn(),
    getPurchaseByProviderId: vi.fn(),
    updatePurchase: vi.fn(),
    getPurchasesByUserId: vi.fn()
  }
}))

vi.mock('@/lib/services/book-service', () => ({
  bookService: {
    getBookById: vi.fn()
  }
}))

vi.mock('@/lib/services/bundle-service', () => ({
  bundleService: {
    getBundleById: vi.fn()
  }
}))

vi.mock('@/lib/services/library-service', () => ({
  libraryService: {
    addBookToLibrary: vi.fn()
  }
}))

vi.mock('@/lib/services/chapa', () => ({
  chapaService: {
    generateTxRef: vi.fn(() => 'astewai_123456_abc123'),
    formatAmount: vi.fn((amount) => amount),
    initializePayment: vi.fn(),
    verifyPayment: vi.fn()
  }
}))

import { paymentRepository } from '@/lib/repositories/payment-repository'
import { bookService } from '@/lib/services/book-service'
import { bundleService } from '@/lib/services/bundle-service'
import { libraryService } from '@/lib/services/library-service'
import { chapaService } from '@/lib/services/chapa'

describe('PurchaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = 'https://astewai.com'
  })

  describe('initiatePurchase', () => {
    it('should initiate purchase for a book successfully', async () => {
      const mockBook = {
        id: 'book-1',
        title: 'Test Book',
        author: 'Test Author',
        price: 29.99,
        is_free: false,
        description: 'Test description',
        cover_image_url: null,
        content_url: null,
        category: null,
        tags: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockPurchase = {
        id: 'purchase-1',
        user_id: 'user-1',
        item_type: 'book' as const,
        item_id: 'book-1',
        amount: 29.99,
        status: 'pending' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        payment_provider_id: 'astewai_123456_abc123'
      }

      const mockChapaResponse = {
        message: 'Success',
        status: 'success',
        data: {
          checkout_url: 'https://checkout.chapa.co/checkout/payment/test'
        }
      }

      // Mock successful responses
      vi.mocked(bookService.getBookById).mockResolvedValue({
        success: true,
        data: mockBook
      })

      vi.mocked(paymentRepository.hasExistingPurchase).mockResolvedValue({
        success: true,
        data: undefined
      })

      vi.mocked(paymentRepository.createPurchase).mockResolvedValue({
        success: true,
        data: mockPurchase
      })

      vi.mocked(chapaService.initializePayment).mockResolvedValue(mockChapaResponse)

      const result = await purchaseService.initiatePurchase({
        userId: 'user-1',
        itemType: 'book',
        itemId: 'book-1',
        userEmail: 'test@example.com',
        userName: 'Test User'
      })

      expect(result.success).toBe(true)
      expect(result.data?.purchase).toEqual(mockPurchase)
      expect(result.data?.checkoutUrl).toBe(mockChapaResponse.data.checkout_url)
      expect(bookService.getBookById).toHaveBeenCalledWith('book-1')
      expect(paymentRepository.hasExistingPurchase).toHaveBeenCalledWith('user-1', 'book', 'book-1')
    })

    it('should reject free books', async () => {
      const mockFreeBook = {
        id: 'book-1',
        title: 'Free Book',
        author: 'Test Author',
        price: 0,
        is_free: true,
        description: 'Test description',
        cover_image_url: null,
        content_url: null,
        category: null,
        tags: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      vi.mocked(bookService.getBookById).mockResolvedValue({
        success: true,
        data: mockFreeBook
      })

      const result = await purchaseService.initiatePurchase({
        userId: 'user-1',
        itemType: 'book',
        itemId: 'book-1',
        userEmail: 'test@example.com',
        userName: 'Test User'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('This book is free. Use the "Add to Library" option instead.')
    })

    it('should reject if user already has purchase', async () => {
      const mockBook = {
        id: 'book-1',
        title: 'Test Book',
        author: 'Test Author',
        price: 29.99,
        is_free: false,
        description: 'Test description',
        cover_image_url: null,
        content_url: null,
        category: null,
        tags: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const existingPurchase = {
        id: 'purchase-1',
        user_id: 'user-1',
        item_type: 'book' as const,
        item_id: 'book-1',
        amount: 29.99,
        status: 'completed' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        payment_provider_id: 'chapa-123'
      }

      vi.mocked(bookService.getBookById).mockResolvedValue({
        success: true,
        data: mockBook
      })

      vi.mocked(paymentRepository.hasExistingPurchase).mockResolvedValue({
        success: true,
        data: existingPurchase
      })

      const result = await purchaseService.initiatePurchase({
        userId: 'user-1',
        itemType: 'book',
        itemId: 'book-1',
        userEmail: 'test@example.com',
        userName: 'Test User'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('You have already purchased this item')
    })
  })

  describe('completePurchase', () => {
    it('should complete purchase successfully', async () => {
      const mockPurchase = {
        id: 'purchase-1',
        user_id: 'user-1',
        item_type: 'book' as const,
        item_id: 'book-1',
        amount: 29.99,
        status: 'pending' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        payment_provider_id: 'astewai_123456_abc123'
      }

      const completedPurchase = { ...mockPurchase, status: 'completed' as const }

      const mockVerification = {
        message: 'Success',
        status: 'success',
        data: {
          id: 123,
          status: 'success',
          tx_ref: 'astewai_123456_abc123',
          amount: 29.99,
          currency: 'ETB',
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          charge: 0,
          mode: 'test',
          method: 'card',
          type: 'payment',
          reference: 'ref-123',
          customization: {
            title: 'Test',
            description: 'Test',
            logo: 'test'
          },
          meta: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      }

      vi.mocked(paymentRepository.getPurchaseByProviderId).mockResolvedValue({
        success: true,
        data: mockPurchase
      })

      vi.mocked(chapaService.verifyPayment).mockResolvedValue(mockVerification)

      vi.mocked(paymentRepository.updatePurchase).mockResolvedValue({
        success: true,
        data: completedPurchase
      })

      vi.mocked(libraryService.addBookToLibrary).mockResolvedValue({
        success: true,
        data: undefined
      })

      const result = await purchaseService.completePurchase('astewai_123456_abc123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(completedPurchase)
      expect(chapaService.verifyPayment).toHaveBeenCalledWith('astewai_123456_abc123')
      expect(paymentRepository.updatePurchase).toHaveBeenCalledWith('purchase-1', { status: 'completed' })
      expect(libraryService.addBookToLibrary).toHaveBeenCalledWith('user-1', 'book-1')
    })
  })
})