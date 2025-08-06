import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Supabase client before importing
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({})),
          in: vi.fn(() => ({
            single: vi.fn()
          })),
          range: vi.fn(() => ({}))
        })),
        head: vi.fn()
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }))
  }))
}))

import { paymentRepository, type CreatePurchaseData } from '../payment-repository'
import { createClient } from '@/lib/supabase/server'

describe('PaymentRepository', () => {
  let mockSupabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupabase = await createClient()
  })

  describe('createPurchase', () => {
    it('should create a purchase successfully', async () => {
      const mockPurchase = {
        id: 'purchase-1',
        user_id: 'user-1',
        item_type: 'book' as const,
        item_id: 'book-1',
        amount: 29.99,
        status: 'pending' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        payment_provider_id: null
      }

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockPurchase,
        error: null
      })

      const purchaseData: CreatePurchaseData = {
        user_id: 'user-1',
        item_type: 'book',
        item_id: 'book-1',
        amount: 29.99
      }

      const result = await paymentRepository.createPurchase(purchaseData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockPurchase)
      expect(mockSupabase.from).toHaveBeenCalledWith('purchases')
    })

    it('should handle creation errors', async () => {
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const purchaseData: CreatePurchaseData = {
        user_id: 'user-1',
        item_type: 'book',
        item_id: 'book-1',
        amount: 29.99
      }

      const result = await paymentRepository.createPurchase(purchaseData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })
  })

  describe('getPurchaseById', () => {
    it('should get purchase by ID successfully', async () => {
      const mockPurchase = {
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

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockPurchase,
        error: null
      })

      const result = await paymentRepository.getPurchaseById('purchase-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockPurchase)
    })

    it('should handle not found error', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Purchase not found' }
      })

      const result = await paymentRepository.getPurchaseById('nonexistent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Purchase not found')
    })
  })

  describe('hasExistingPurchase', () => {
    it('should return existing purchase if found', async () => {
      const mockPurchase = {
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

      mockSupabase.from().select().eq().eq().eq().in().single.mockResolvedValue({
        data: mockPurchase,
        error: null
      })

      const result = await paymentRepository.hasExistingPurchase('user-1', 'book', 'book-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockPurchase)
    })

    it('should return undefined if no existing purchase', async () => {
      mockSupabase.from().select().eq().eq().eq().in().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // No rows returned
      })

      const result = await paymentRepository.hasExistingPurchase('user-1', 'book', 'book-1')

      expect(result.success).toBe(true)
      expect(result.data).toBeUndefined()
    })
  })
})