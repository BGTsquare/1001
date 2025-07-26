import { describe, it, expect } from 'vitest'
import {
  validateBookCreate,
  validateBookUpdate,
  validateBookSearch,
  validateBookId,
  sanitizeBookData,
  BookValidationError
} from '../book-validation'

describe('Book Validation', () => {
  describe('validateBookCreate', () => {
    it('should validate a valid book creation', () => {
      const validBook = {
        title: 'Test Book',
        author: 'Test Author',
        description: 'A great test book',
        price: 9.99,
        is_free: false,
        category: 'Fiction',
        tags: ['test', 'fiction']
      }

      const result = validateBookCreate(validBook)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should require title', () => {
      const invalidBook = {
        title: '',
        author: 'Test Author',
        price: 9.99,
        is_free: false
      }

      const result = validateBookCreate(invalidBook)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'title',
        message: 'Title is required'
      })
    })

    it('should require author', () => {
      const invalidBook = {
        title: 'Test Book',
        author: '',
        price: 9.99,
        is_free: false
      }

      const result = validateBookCreate(invalidBook)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'author',
        message: 'Author is required'
      })
    })

    it('should validate title length', () => {
      const invalidBook = {
        title: 'a'.repeat(256),
        author: 'Test Author',
        price: 9.99,
        is_free: false
      }

      const result = validateBookCreate(invalidBook)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'title',
        message: 'Title must be less than 255 characters'
      })
    })

    it('should validate author length', () => {
      const invalidBook = {
        title: 'Test Book',
        author: 'a'.repeat(256),
        price: 9.99,
        is_free: false
      }

      const result = validateBookCreate(invalidBook)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'author',
        message: 'Author must be less than 255 characters'
      })
    })

    it('should validate description length', () => {
      const invalidBook = {
        title: 'Test Book',
        author: 'Test Author',
        description: 'a'.repeat(2001),
        price: 9.99,
        is_free: false
      }

      const result = validateBookCreate(invalidBook)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'description',
        message: 'Description must be less than 2000 characters'
      })
    })

    it('should validate category length', () => {
      const invalidBook = {
        title: 'Test Book',
        author: 'Test Author',
        category: 'a'.repeat(101),
        price: 9.99,
        is_free: false
      }

      const result = validateBookCreate(invalidBook)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'category',
        message: 'Category must be less than 100 characters'
      })
    })

    it('should validate negative price', () => {
      const invalidBook = {
        title: 'Test Book',
        author: 'Test Author',
        price: -5,
        is_free: false
      }

      const result = validateBookCreate(invalidBook)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'price',
        message: 'Price cannot be negative'
      })
    })

    it('should validate maximum price', () => {
      const invalidBook = {
        title: 'Test Book',
        author: 'Test Author',
        price: 1000,
        is_free: false
      }

      const result = validateBookCreate(invalidBook)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'price',
        message: 'Price cannot exceed $999.99'
      })
    })

    it('should validate free book with price', () => {
      const invalidBook = {
        title: 'Test Book',
        author: 'Test Author',
        price: 9.99,
        is_free: true
      }

      const result = validateBookCreate(invalidBook)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'price',
        message: 'Free books cannot have a price greater than 0'
      })
    })

    it('should validate paid book without price', () => {
      const invalidBook = {
        title: 'Test Book',
        author: 'Test Author',
        price: 0,
        is_free: false
      }

      const result = validateBookCreate(invalidBook)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'price',
        message: 'Paid books must have a price greater than 0'
      })
    })

    it('should validate invalid cover image URL', () => {
      const invalidBook = {
        title: 'Test Book',
        author: 'Test Author',
        cover_image_url: 'not-a-url',
        price: 9.99,
        is_free: false
      }

      const result = validateBookCreate(invalidBook)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'cover_image_url',
        message: 'Cover image URL is not valid'
      })
    })

    it('should validate invalid content URL', () => {
      const invalidBook = {
        title: 'Test Book',
        author: 'Test Author',
        content_url: 'not-a-url',
        price: 9.99,
        is_free: false
      }

      const result = validateBookCreate(invalidBook)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'content_url',
        message: 'Content URL is not valid'
      })
    })

    it('should validate too many tags', () => {
      const invalidBook = {
        title: 'Test Book',
        author: 'Test Author',
        tags: Array(11).fill('tag'),
        price: 9.99,
        is_free: false
      }

      const result = validateBookCreate(invalidBook)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'tags',
        message: 'Cannot have more than 10 tags'
      })
    })

    it('should validate tag length', () => {
      const invalidBook = {
        title: 'Test Book',
        author: 'Test Author',
        tags: ['a'.repeat(51)],
        price: 9.99,
        is_free: false
      }

      const result = validateBookCreate(invalidBook)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'tags',
        message: 'Each tag must be less than 50 characters'
      })
    })
  })

  describe('validateBookUpdate', () => {
    it('should validate a valid book update', () => {
      const validUpdate = {
        title: 'Updated Title',
        price: 19.99
      }

      const result = validateBookUpdate(validUpdate)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate empty title update', () => {
      const invalidUpdate = {
        title: ''
      }

      const result = validateBookUpdate(invalidUpdate)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'title',
        message: 'Title cannot be empty'
      })
    })

    it('should validate empty author update', () => {
      const invalidUpdate = {
        author: ''
      }

      const result = validateBookUpdate(invalidUpdate)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'author',
        message: 'Author cannot be empty'
      })
    })

    it('should allow undefined fields in update', () => {
      const validUpdate = {
        title: 'New Title'
        // Other fields are undefined, which is valid for updates
      }

      const result = validateBookUpdate(validUpdate)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should allow null values for optional fields', () => {
      const validUpdate = {
        description: null,
        category: null,
        cover_image_url: null,
        content_url: null,
        tags: null
      }

      const result = validateBookUpdate(validUpdate)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validateBookSearch', () => {
    it('should validate valid search parameters', () => {
      const validSearch = {
        query: 'test search',
        category: 'Fiction',
        tags: ['fiction', 'adventure'],
        priceRange: [0, 50] as [number, number],
        limit: 20,
        offset: 0
      }

      const result = validateBookSearch(validSearch)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate query length', () => {
      const invalidSearch = {
        query: 'a'.repeat(101)
      }

      const result = validateBookSearch(invalidSearch)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'query',
        message: 'Search query must be less than 100 characters'
      })
    })

    it('should validate price range', () => {
      const invalidSearch = {
        priceRange: [50, 10] as [number, number] // min > max
      }

      const result = validateBookSearch(invalidSearch)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'priceRange',
        message: 'Minimum price cannot be greater than maximum price'
      })
    })

    it('should validate negative prices', () => {
      const invalidSearch = {
        priceRange: [-5, 10] as [number, number]
      }

      const result = validateBookSearch(invalidSearch)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'priceRange',
        message: 'Minimum price cannot be negative'
      })
    })

    it('should validate limit bounds', () => {
      const invalidSearch = {
        limit: 0
      }

      const result = validateBookSearch(invalidSearch)

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

      const result = validateBookSearch(invalidSearch)

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

      const result = validateBookSearch(invalidSearch)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'offset',
        message: 'Offset cannot be negative'
      })
    })
  })

  describe('validateBookId', () => {
    it('should validate a valid UUID', () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000'

      const result = validateBookId(validId)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty ID', () => {
      const result = validateBookId('')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'id',
        message: 'Book ID is required'
      })
    })

    it('should reject invalid UUID format', () => {
      const result = validateBookId('not-a-uuid')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'id',
        message: 'Book ID must be a valid UUID'
      })
    })
  })

  describe('sanitizeBookData', () => {
    it('should trim string fields', () => {
      const dirtyData = {
        title: '  Test Book  ',
        author: '  Test Author  ',
        description: '  Test Description  ',
        category: '  Fiction  '
      }

      const sanitized = sanitizeBookData(dirtyData)

      expect(sanitized.title).toBe('Test Book')
      expect(sanitized.author).toBe('Test Author')
      expect(sanitized.description).toBe('Test Description')
      expect(sanitized.category).toBe('Fiction')
    })

    it('should sanitize tags', () => {
      const dirtyData = {
        title: 'Test Book',
        author: 'Test Author',
        tags: ['  tag1  ', '', '  tag2  ', '   ', 'tag3']
      }

      const sanitized = sanitizeBookData(dirtyData)

      expect(sanitized.tags).toEqual(['tag1', 'tag2', 'tag3'])
    })

    it('should limit tags to 10', () => {
      const dirtyData = {
        title: 'Test Book',
        author: 'Test Author',
        tags: Array(15).fill('tag')
      }

      const sanitized = sanitizeBookData(dirtyData)

      expect(sanitized.tags).toHaveLength(10)
    })

    it('should set price to 0 for free books', () => {
      const dirtyData = {
        title: 'Test Book',
        author: 'Test Author',
        price: 9.99,
        is_free: true
      }

      const sanitized = sanitizeBookData(dirtyData)

      expect(sanitized.price).toBe(0)
    })
  })

  describe('BookValidationError', () => {
    it('should create error with validation errors', () => {
      const errors = [
        { field: 'title', message: 'Title is required' },
        { field: 'author', message: 'Author is required' }
      ]

      const error = new BookValidationError(errors)

      expect(error.name).toBe('BookValidationError')
      expect(error.message).toBe('Validation failed: title: Title is required, author: Author is required')
      expect(error.errors).toEqual(errors)
    })
  })
})