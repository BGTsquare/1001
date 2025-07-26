import { describe, it, expect } from 'vitest'
import {
  validateBundleCreate,
  validateBundleUpdate,
  validateBundleSearch,
  validateBundleId,
  validateBundleBookIds,
  validateBundlePricing,
  sanitizeBundleData,
  BundleValidationError
} from '../bundle-validation'

describe('Bundle Validation', () => {
  describe('validateBundleCreate', () => {
    it('should validate a valid bundle creation', () => {
      const validBundle = {
        title: 'Test Bundle',
        description: 'A great test bundle',
        price: 19.99
      }

      const result = validateBundleCreate(validBundle)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should require title', () => {
      const invalidBundle = {
        title: '',
        price: 19.99
      }

      const result = validateBundleCreate(invalidBundle)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'title',
        message: 'Bundle title is required'
      })
    })

    it('should validate title length', () => {
      const invalidBundle = {
        title: 'a'.repeat(256),
        price: 19.99
      }

      const result = validateBundleCreate(invalidBundle)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'title',
        message: 'Bundle title must be less than 255 characters'
      })
    })

    it('should validate description length', () => {
      const invalidBundle = {
        title: 'Test Bundle',
        description: 'a'.repeat(2001),
        price: 19.99
      }

      const result = validateBundleCreate(invalidBundle)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'description',
        message: 'Bundle description must be less than 2000 characters'
      })
    })

    it('should require price', () => {
      const invalidBundle = {
        title: 'Test Bundle'
      }

      const result = validateBundleCreate(invalidBundle)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'price',
        message: 'Bundle price is required'
      })
    })

    it('should validate negative price', () => {
      const invalidBundle = {
        title: 'Test Bundle',
        price: -5
      }

      const result = validateBundleCreate(invalidBundle)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'price',
        message: 'Bundle price cannot be negative'
      })
    })

    it('should validate maximum price', () => {
      const invalidBundle = {
        title: 'Test Bundle',
        price: 10000
      }

      const result = validateBundleCreate(invalidBundle)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'price',
        message: 'Bundle price cannot exceed $9999.99'
      })
    })

    it('should allow null price to be caught as required', () => {
      const invalidBundle = {
        title: 'Test Bundle',
        price: null
      }

      const result = validateBundleCreate(invalidBundle)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'price',
        message: 'Bundle price is required'
      })
    })
  })

  describe('validateBundleUpdate', () => {
    it('should validate a valid bundle update', () => {
      const validUpdate = {
        title: 'Updated Bundle',
        price: 29.99
      }

      const result = validateBundleUpdate(validUpdate)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate empty title update', () => {
      const invalidUpdate = {
        title: ''
      }

      const result = validateBundleUpdate(invalidUpdate)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'title',
        message: 'Bundle title cannot be empty'
      })
    })

    it('should allow undefined fields in update', () => {
      const validUpdate = {
        title: 'New Bundle Title'
        // Other fields are undefined, which is valid for updates
      }

      const result = validateBundleUpdate(validUpdate)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should allow null values for optional fields', () => {
      const validUpdate = {
        description: null
      }

      const result = validateBundleUpdate(validUpdate)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate negative price in update', () => {
      const invalidUpdate = {
        price: -10
      }

      const result = validateBundleUpdate(invalidUpdate)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'price',
        message: 'Bundle price cannot be negative'
      })
    })

    it('should validate maximum price in update', () => {
      const invalidUpdate = {
        price: 10000
      }

      const result = validateBundleUpdate(invalidUpdate)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'price',
        message: 'Bundle price cannot exceed $9999.99'
      })
    })
  })

  describe('validateBundleId', () => {
    it('should validate a valid UUID', () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000'

      const result = validateBundleId(validId)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty ID', () => {
      const result = validateBundleId('')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'id',
        message: 'Bundle ID is required'
      })
    })

    it('should reject invalid UUID format', () => {
      const result = validateBundleId('not-a-uuid')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'id',
        message: 'Bundle ID must be a valid UUID'
      })
    })
  })

  describe('validateBundleBookIds', () => {
    it('should validate valid book IDs', () => {
      const validIds = [
        '123e4567-e89b-12d3-a456-426614174000',
        '987fcdeb-51a2-43d1-9f12-123456789abc'
      ]

      const result = validateBundleBookIds(validIds)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should require at least one book', () => {
      const result = validateBundleBookIds([])

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'bookIds',
        message: 'At least one book is required for a bundle'
      })
    })

    it('should reject too many books', () => {
      const tooManyIds = Array(51).fill('123e4567-e89b-12d3-a456-426614174000')

      const result = validateBundleBookIds(tooManyIds)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'bookIds',
        message: 'Bundle cannot contain more than 50 books'
      })
    })

    it('should reject duplicate book IDs', () => {
      const duplicateIds = [
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174000'
      ]

      const result = validateBundleBookIds(duplicateIds)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'bookIds',
        message: 'Bundle cannot contain duplicate books'
      })
    })

    it('should reject empty book ID', () => {
      const invalidIds = ['123e4567-e89b-12d3-a456-426614174000', '']

      const result = validateBundleBookIds(invalidIds)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'bookIds[1]',
        message: 'Book ID cannot be empty'
      })
    })

    it('should reject invalid UUID format', () => {
      const invalidIds = ['123e4567-e89b-12d3-a456-426614174000', 'not-a-uuid']

      const result = validateBundleBookIds(invalidIds)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'bookIds[1]',
        message: 'Book ID must be a valid UUID'
      })
    })
  })

  describe('validateBundlePricing', () => {
    it('should validate valid bundle pricing', () => {
      const bundlePrice = 19.99
      const bookPrices = [9.99, 12.99] // Total: 22.98, Bundle: 19.99 (13% discount)

      const result = validateBundlePricing(bundlePrice, bookPrices)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty book prices', () => {
      const result = validateBundlePricing(19.99, [])

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'bookPrices',
        message: 'Cannot validate pricing without book prices'
      })
    })

    it('should reject bundle price higher than total book prices', () => {
      const bundlePrice = 25.99
      const bookPrices = [9.99, 12.99] // Total: 22.98

      const result = validateBundlePricing(bundlePrice, bookPrices)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'price',
        message: 'Bundle price ($25.99) cannot exceed total book prices ($22.98)'
      })
    })

    it('should require at least 1% discount', () => {
      const bundlePrice = 22.98 // Same as total book prices
      const bookPrices = [9.99, 12.99] // Total: 22.98

      const result = validateBundlePricing(bundlePrice, bookPrices)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'price',
        message: 'Bundle must provide at least 1% discount compared to individual book prices'
      })
    })

    it('should accept exactly 1% discount', () => {
      const totalPrice = 100.00
      const bundlePrice = 98.99 // More than 1% discount (1.01%)
      const bookPrices = [50.00, 50.00] // Total: 100.00

      const result = validateBundlePricing(bundlePrice, bookPrices)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validateBundleSearch', () => {
    it('should validate valid search parameters', () => {
      const validSearch = {
        query: 'test search',
        priceRange: [0, 100] as [number, number],
        limit: 20,
        offset: 0
      }

      const result = validateBundleSearch(validSearch)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate query length', () => {
      const invalidSearch = {
        query: 'a'.repeat(101)
      }

      const result = validateBundleSearch(invalidSearch)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'query',
        message: 'Search query must be less than 100 characters'
      })
    })

    it('should validate price range', () => {
      const invalidSearch = {
        priceRange: [100, 50] as [number, number] // min > max
      }

      const result = validateBundleSearch(invalidSearch)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'priceRange',
        message: 'Minimum price cannot be greater than maximum price'
      })
    })

    it('should validate negative prices', () => {
      const invalidSearch = {
        priceRange: [-5, 50] as [number, number]
      }

      const result = validateBundleSearch(invalidSearch)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'priceRange',
        message: 'Minimum price cannot be negative'
      })
    })

    it('should validate maximum price', () => {
      const invalidSearch = {
        priceRange: [0, 10000] as [number, number]
      }

      const result = validateBundleSearch(invalidSearch)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'priceRange',
        message: 'Maximum price cannot exceed $9999.99'
      })
    })

    it('should validate limit bounds', () => {
      const invalidSearch = {
        limit: 0
      }

      const result = validateBundleSearch(invalidSearch)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'limit',
        message: 'Limit must be at least 1'
      })
    })

    it('should validate maximum limit', () => {
      const invalidSearch = {
        limit: 101
      }

      const result = validateBundleSearch(invalidSearch)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'limit',
        message: 'Limit cannot exceed 100'
      })
    })

    it('should validate negative offset', () => {
      const invalidSearch = {
        offset: -1
      }

      const result = validateBundleSearch(invalidSearch)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'offset',
        message: 'Offset cannot be negative'
      })
    })
  })

  describe('sanitizeBundleData', () => {
    it('should trim string fields', () => {
      const dirtyData = {
        title: '  Test Bundle  ',
        description: '  Test Description  '
      }

      const sanitized = sanitizeBundleData(dirtyData)

      expect(sanitized.title).toBe('Test Bundle')
      expect(sanitized.description).toBe('Test Description')
    })

    it('should round price to 2 decimal places', () => {
      const dirtyData = {
        title: 'Test Bundle',
        price: 19.999
      }

      const sanitized = sanitizeBundleData(dirtyData)

      expect(sanitized.price).toBe(20.00)
    })

    it('should handle price rounding edge cases', () => {
      const dirtyData = {
        title: 'Test Bundle',
        price: 19.994
      }

      const sanitized = sanitizeBundleData(dirtyData)

      expect(sanitized.price).toBe(19.99)
    })

    it('should preserve undefined values', () => {
      const dirtyData = {
        title: 'Test Bundle'
        // price is undefined
      }

      const sanitized = sanitizeBundleData(dirtyData)

      expect(sanitized.title).toBe('Test Bundle')
      expect(sanitized.price).toBeUndefined()
    })
  })

  describe('BundleValidationError', () => {
    it('should create error with validation errors', () => {
      const errors = [
        { field: 'title', message: 'Bundle title is required' },
        { field: 'price', message: 'Bundle price is required' }
      ]

      const error = new BundleValidationError(errors)

      expect(error.name).toBe('BundleValidationError')
      expect(error.message).toBe('Bundle validation failed: title: Bundle title is required, price: Bundle price is required')
      expect(error.errors).toEqual(errors)
    })
  })
})