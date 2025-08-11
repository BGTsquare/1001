import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BundleRepository, BundleRepositoryError } from '../improved-bundle-repository'
import type { Bundle } from '@/types'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => mockSupabaseClient),
  select: vi.fn(() => mockSupabaseClient),
  insert: vi.fn(() => mockSupabaseClient),
  update: vi.fn(() => mockSupabaseClient),
  delete: vi.fn(() => mockSupabaseClient),
  eq: vi.fn(() => mockSupabaseClient),
  gte: vi.fn(() => mockSupabaseClient),
  lte: vi.fn(() => mockSupabaseClient),
  or: vi.fn(() => mockSupabaseClient),
  order: vi.fn(() => mockSupabaseClient),
  limit: vi.fn(() => mockSupabaseClient),
  range: vi.fn(() => mockSupabaseClient),
  single: vi.fn(),
  then: vi.fn()
}

// Mock the Supabase client creation
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabaseClient
}))

describe('BundleRepository', () => {
  let repository: BundleRepository

  beforeEach(() => {
    repository = new BundleRepository(true) // Use client mode for testing
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('create', () => {
    it('should create a bundle successfully', async () => {
      const bundleData = {
        title: 'Test Bundle',
        description: 'Test Description',
        price: 29.99
      }

      const expectedBundle: Bundle = {
        id: '123',
        ...bundleData,
        cover_image_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabaseClient.single.mockResolvedValue({
        data: expectedBundle,
        error: null
      })

      const result = await repository.create(bundleData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(expectedBundle)
      }
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('bundles')
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(bundleData)
    })

    it('should handle creation errors', async () => {
      const bundleData = {
        title: 'Test Bundle',
        description: 'Test Description',
        price: 29.99
      }

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' }
      })

      const result = await repository.create(bundleData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(BundleRepositoryError)
        expect(result.error.code).toBe('DB_ERROR')
      }
    })
  })

  describe('getById', () => {
    it('should get bundle by ID without books', async () => {
      const bundleId = '123'
      const expectedBundle: Bundle = {
        id: bundleId,
        title: 'Test Bundle',
        description: 'Test Description',
        price: 29.99,
        cover_image_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabaseClient.single.mockResolvedValue({
        data: expectedBundle,
        error: null
      })

      const result = await repository.getById(bundleId, false)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(expectedBundle)
      }
    })

    it('should handle bundle not found', async () => {
      const bundleId = '999'

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' }
      })

      const result = await repository.getById(bundleId)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND')
        expect(result.error.message).toBe('Bundle not found')
      }
    })
  })

  describe('getAll', () => {
    it('should validate search options', async () => {
      const invalidOptions = {
        limit: 150, // Exceeds maximum
        offset: -1   // Negative offset
      }

      const result = await repository.getAll(invalidOptions)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain('Limit must be between 1 and 100')
      }
    })

    it('should apply filters correctly', async () => {
      const options = {
        query: 'programming',
        priceRange: [10, 50] as [number, number],
        sortBy: 'title' as const,
        sortOrder: 'asc' as const,
        limit: 10,
        offset: 0
      }

      mockSupabaseClient.then.mockResolvedValue({
        data: [],
        error: null
      })

      await repository.getAll(options, false)

      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('price', 10)
      expect(mockSupabaseClient.lte).toHaveBeenCalledWith('price', 50)
      expect(mockSupabaseClient.or).toHaveBeenCalledWith('title.ilike.%programming%,description.ilike.%programming%')
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('title', { ascending: true })
      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(10)
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(0, 9)
    })
  })

  describe('validation', () => {
    it('should validate price range', async () => {
      const invalidPriceRange = {
        priceRange: [100, 50] as [number, number] // min > max
      }

      const result = await repository.getAll(invalidPriceRange)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe('Invalid price range')
      }
    })

    it('should validate negative prices', async () => {
      const invalidPriceRange = {
        priceRange: [-10, 50] as [number, number]
      }

      const result = await repository.getAll(invalidPriceRange)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe('Invalid price range')
      }
    })
  })

  describe('error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockSupabaseClient.single.mockRejectedValue(new Error('Network error'))

      const result = await repository.getById('123')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(BundleRepositoryError)
        expect(result.error.message).toContain('Unexpected error in getById')
      }
    })
  })
})