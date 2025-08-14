/**
 * Tests for TelegramPurchaseService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TelegramPurchaseService } from '../telegram-purchase-service'
import { paymentConfigService } from '../payment-config-service'
import { createClient } from '@/lib/supabase/server'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('../payment-config-service')

const mockSupabase = {
  rpc: vi.fn()
}

const mockCreateClient = vi.mocked(createClient)
const mockPaymentConfigService = vi.mocked(paymentConfigService)

describe('TelegramPurchaseService', () => {
  let service: TelegramPurchaseService

  beforeEach(() => {
    service = new TelegramPurchaseService()
    mockCreateClient.mockResolvedValue(mockSupabase as any)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getPurchaseInfo', () => {
    const mockPurchaseData = [{
      purchase_id: 'test-purchase-id',
      user_id: 'test-user-id',
      user_email: 'test@example.com',
      user_name: 'Test User',
      item_type: 'book',
      item_id: 'test-book-id',
      item_title: 'Test Book',
      amount: 29.99,
      status: 'pending_verification',
      transaction_reference: 'AST-TEST-123',
      created_at: '2025-01-01T00:00:00Z'
    }]

    const mockPaymentOptions = [
      {
        id: 'payment-1',
        type: 'bank_account' as const,
        provider: 'Test Bank',
        accountNumber: '123456789',
        accountName: 'Test Account',
        instructions: 'Test instructions'
      }
    ]

    it('should return purchase info successfully', async () => {
      // Setup mocks
      mockSupabase.rpc.mockResolvedValue({
        data: mockPurchaseData,
        error: null
      })

      mockPaymentConfigService.getActivePaymentMethods.mockResolvedValue({
        success: true,
        data: mockPaymentOptions
      })

      // Execute
      const result = await service.getPurchaseInfo('valid-token')

      // Verify
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.purchase.id).toBe('test-purchase-id')
      expect(result.data!.purchase.itemTitle).toBe('Test Book')
      expect(result.data!.purchase.amountInBirr).toBe(3599) // 29.99 * 120
      expect(result.data!.paymentOptions).toHaveLength(1)
      expect(result.data!.paymentOptions[0].providerName).toBe('Test Bank')
    })

    it('should handle missing token', async () => {
      const result = await service.getPurchaseInfo('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Missing or invalid initiation token')
      expect(result.code).toBe('INVALID_TOKEN')
    })

    it('should handle invalid token', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await service.getPurchaseInfo('invalid-token')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid or expired token')
      expect(result.code).toBe('TOKEN_NOT_FOUND')
    })

    it('should handle database errors', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const result = await service.getPurchaseInfo('valid-token')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to fetch purchase information')
      expect(result.code).toBe('DATABASE_ERROR')
    })

    it('should continue with empty payment options if payment service fails', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: mockPurchaseData,
        error: null
      })

      mockPaymentConfigService.getActivePaymentMethods.mockResolvedValue({
        success: false,
        error: 'Payment service error'
      })

      const result = await service.getPurchaseInfo('valid-token')

      expect(result.success).toBe(true)
      expect(result.data!.paymentOptions).toHaveLength(0)
    })
  })

  describe('validateBotAuth', () => {
    const originalEnv = process.env.TELEGRAM_BOT_SECRET

    afterEach(() => {
      process.env.TELEGRAM_BOT_SECRET = originalEnv
    })

    it('should validate correct token', async () => {
      process.env.TELEGRAM_BOT_SECRET = 'test-secret'
      
      const result = await service.validateBotAuth('Bearer test-secret')
      
      expect(result).toBe(true)
    })

    it('should reject incorrect token', async () => {
      process.env.TELEGRAM_BOT_SECRET = 'test-secret'
      
      const result = await service.validateBotAuth('Bearer wrong-secret')
      
      expect(result).toBe(false)
    })

    it('should reject missing auth header', async () => {
      const result = await service.validateBotAuth(null)
      
      expect(result).toBe(false)
    })

    it('should reject when secret not configured', async () => {
      delete process.env.TELEGRAM_BOT_SECRET
      
      const result = await service.validateBotAuth('Bearer any-token')
      
      expect(result).toBe(false)
    })
  })

  describe('updateCurrencyRate', () => {
    it('should accept valid rate', async () => {
      const result = await service.updateCurrencyRate(125.5)
      
      expect(result.success).toBe(true)
    })

    it('should reject invalid rates', async () => {
      const result1 = await service.updateCurrencyRate(0)
      const result2 = await service.updateCurrencyRate(-10)
      
      expect(result1.success).toBe(false)
      expect(result1.code).toBe('INVALID_RATE')
      expect(result2.success).toBe(false)
      expect(result2.code).toBe('INVALID_RATE')
    })
  })
})