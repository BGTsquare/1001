import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { BookService } from '../book-service'
import { BookRepository } from '../../repositories/book-repository'
import type { Book } from '@/types'

// Mock the repository
vi.mock('../../repositories/book-repository')

describe('BookService', () => {
  let service: BookService
  let mockRepository: {
    create: Mock
    getById: Mock
    update: Mock
    delete: Mock
    getAll: Mock
    getCount: Mock
    exists: Mock
    getByIds: Mock
    getCategories: Mock
    getTags: Mock
    getByCategory: Mock
    getFreeBooks: Mock
    getPaidBooks: Mock
    getByTags: Mock
    getByPriceRange: Mock
  }

  const mockBook: Book = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Book',
    author: 'Test Author',
    description: 'Test Description',
    cover_image_url: 'https://example.com/cover.jpg',
    content_url: 'https://example.com/content.pdf',
    price: 9.99,
    is_free: false,
    category: 'Fiction',
    tags: ['test', 'fiction'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockRepository = {
      create: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getAll: vi.fn(),
      getCount: vi.fn(),
      exists: vi.fn(),
      getByIds: vi.fn(),
      getCategories: vi.fn(),
      getTags: vi.fn(),
      getByCategory: vi.fn(),
      getFreeBooks: vi.fn(),
      getPaidBooks: vi.fn(),
      getByTags: vi.fn(),
      getByPriceRange: vi.fn()
    }

    // Mock the BookRepository constructor
    ;(BookRepository as any).mockImplementation(() => mockRepository)
    
    service = new BookService()
  })

  describe('createBook', () => {
    it('should create a book successfully', async () => {
      const bookData = {
        title: 'New Book',
        author: 'New Author',
        price: 19.99,
        is_free: false
      }

      mockRepository.create.mockResolvedValue(mockBook)

      const result = await service.createBook(bookData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockBook)
      expect(result.error).toBeUndefined()
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Book',
          author: 'New Author',
          price: 19.99,
          is_free: false
        })
      )
    })

    it('should fail validation for invalid book data', async () => {
      const invalidBookData = {
        title: '', // Empty title should fail validation
        author: 'New Author',
        price: 19.99,
        is_free: false
      }

      const result = await service.createBook(invalidBookData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
      expect(result.validationErrors).toContainEqual({
        field: 'title',
        message: 'Title is required'
      })
      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    it('should handle repository creation failure', async () => {
      const bookData = {
        title: 'New Book',
        author: 'New Author',
        price: 19.99,
        is_free: false
      }

      mockRepository.create.mockResolvedValue(null)

      const result = await service.createBook(bookData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to create book')
      expect(result.data).toBeUndefined()
    })

    it('should handle unexpected errors', async () => {
      const bookData = {
        title: 'New Book',
        author: 'New Author',
        price: 19.99,
        is_free: false
      }

      mockRepository.create.mockRejectedValue(new Error('Unexpected error'))

      const result = await service.createBook(bookData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('An unexpected error occurred while creating the book')
    })
  })

  describe('getBookById', () => {
    it('should get a book by ID successfully', async () => {
      mockRepository.getById.mockResolvedValue(mockBook)

      const result = await service.getBookById(mockBook.id)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockBook)
      expect(mockRepository.getById).toHaveBeenCalledWith(mockBook.id)
    })

    it('should fail validation for invalid ID', async () => {
      const result = await service.getBookById('invalid-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid book ID')
      expect(result.validationErrors).toContainEqual({
        field: 'id',
        message: 'Book ID must be a valid UUID'
      })
      expect(mockRepository.getById).not.toHaveBeenCalled()
    })

    it('should handle book not found', async () => {
      mockRepository.getById.mockResolvedValue(null)

      const result = await service.getBookById(mockBook.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Book not found')
    })
  })

  describe('updateBook', () => {
    it('should update a book successfully', async () => {
      const updates = { title: 'Updated Title' }
      const updatedBook = { ...mockBook, ...updates }

      mockRepository.getById.mockResolvedValue(mockBook)
      mockRepository.update.mockResolvedValue(updatedBook)

      const result = await service.updateBook(mockBook.id, updates)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedBook)
      expect(mockRepository.getById).toHaveBeenCalledWith(mockBook.id)
      expect(mockRepository.update).toHaveBeenCalledWith(mockBook.id, updates)
    })

    it('should fail validation for invalid ID', async () => {
      const updates = { title: 'Updated Title' }

      const result = await service.updateBook('invalid-id', updates)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid book ID')
      expect(mockRepository.getById).not.toHaveBeenCalled()
    })

    it('should fail validation for invalid update data', async () => {
      const invalidUpdates = { title: '' } // Empty title

      const result = await service.updateBook(mockBook.id, invalidUpdates)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
      expect(result.validationErrors).toContainEqual({
        field: 'title',
        message: 'Title cannot be empty'
      })
    })

    it('should handle book not found', async () => {
      const updates = { title: 'Updated Title' }

      mockRepository.getById.mockResolvedValue(null)

      const result = await service.updateBook(mockBook.id, updates)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Book not found')
      expect(mockRepository.update).not.toHaveBeenCalled()
    })
  })

  describe('deleteBook', () => {
    it('should delete a book successfully', async () => {
      mockRepository.getById.mockResolvedValue(mockBook)
      mockRepository.delete.mockResolvedValue(true)

      const result = await service.deleteBook(mockBook.id)

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockRepository.getById).toHaveBeenCalledWith(mockBook.id)
      expect(mockRepository.delete).toHaveBeenCalledWith(mockBook.id)
    })

    it('should fail validation for invalid ID', async () => {
      const result = await service.deleteBook('invalid-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid book ID')
      expect(mockRepository.getById).not.toHaveBeenCalled()
    })

    it('should handle book not found', async () => {
      mockRepository.getById.mockResolvedValue(null)

      const result = await service.deleteBook(mockBook.id)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Book not found')
      expect(mockRepository.delete).not.toHaveBeenCalled()
    })
  })

  describe('searchBooks', () => {
    it('should search books successfully', async () => {
      const searchOptions = { query: 'test', limit: 10 }
      const mockBooks = [mockBook]
      const mockTotal = 1

      mockRepository.getAll.mockResolvedValue(mockBooks)
      mockRepository.getCount.mockResolvedValue(mockTotal)

      const result = await service.searchBooks(searchOptions)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ books: mockBooks, total: mockTotal })
      expect(mockRepository.getAll).toHaveBeenCalledWith(searchOptions)
      expect(mockRepository.getCount).toHaveBeenCalledWith(searchOptions)
    })

    it('should fail validation for invalid search parameters', async () => {
      const invalidOptions = { limit: 0 } // Invalid limit

      const result = await service.searchBooks(invalidOptions)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid search parameters')
      expect(result.validationErrors).toContainEqual({
        field: 'limit',
        message: 'Limit must be at least 1'
      })
    })
  })

  describe('getBooksByCategory', () => {
    it('should get books by category successfully', async () => {
      const category = 'Fiction'
      const mockBooks = [mockBook]

      mockRepository.getByCategory.mockResolvedValue(mockBooks)

      const result = await service.getBooksByCategory(category)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockBooks)
      expect(mockRepository.getByCategory).toHaveBeenCalledWith(category, {})
    })

    it('should fail for empty category', async () => {
      const result = await service.getBooksByCategory('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Category is required')
      expect(mockRepository.getByCategory).not.toHaveBeenCalled()
    })
  })

  describe('getFreeBooks', () => {
    it('should get free books successfully', async () => {
      const mockBooks = [{ ...mockBook, is_free: true, price: 0 }]

      mockRepository.getFreeBooks.mockResolvedValue(mockBooks)

      const result = await service.getFreeBooks()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockBooks)
      expect(mockRepository.getFreeBooks).toHaveBeenCalledWith({})
    })
  })

  describe('getPaidBooks', () => {
    it('should get paid books successfully', async () => {
      const mockBooks = [mockBook]

      mockRepository.getPaidBooks.mockResolvedValue(mockBooks)

      const result = await service.getPaidBooks()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockBooks)
      expect(mockRepository.getPaidBooks).toHaveBeenCalledWith({})
    })
  })

  describe('getBooksByTags', () => {
    it('should get books by tags successfully', async () => {
      const tags = ['fiction', 'adventure']
      const mockBooks = [mockBook]

      mockRepository.getByTags.mockResolvedValue(mockBooks)

      const result = await service.getBooksByTags(tags)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockBooks)
      expect(mockRepository.getByTags).toHaveBeenCalledWith(tags, {})
    })

    it('should fail for empty tags array', async () => {
      const result = await service.getBooksByTags([])

      expect(result.success).toBe(false)
      expect(result.error).toBe('At least one tag is required')
      expect(mockRepository.getByTags).not.toHaveBeenCalled()
    })

    it('should sanitize tags', async () => {
      const tags = ['  fiction  ', '', '  adventure  ']
      const mockBooks = [mockBook]

      mockRepository.getByTags.mockResolvedValue(mockBooks)

      const result = await service.getBooksByTags(tags)

      expect(result.success).toBe(true)
      expect(mockRepository.getByTags).toHaveBeenCalledWith(['fiction', 'adventure'], {})
    })
  })

  describe('getBooksByPriceRange', () => {
    it('should get books by price range successfully', async () => {
      const minPrice = 5
      const maxPrice = 15
      const mockBooks = [mockBook]

      mockRepository.getByPriceRange.mockResolvedValue(mockBooks)

      const result = await service.getBooksByPriceRange(minPrice, maxPrice)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockBooks)
      expect(mockRepository.getByPriceRange).toHaveBeenCalledWith(minPrice, maxPrice, {})
    })

    it('should fail for negative prices', async () => {
      const result = await service.getBooksByPriceRange(-5, 15)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Price values cannot be negative')
      expect(mockRepository.getByPriceRange).not.toHaveBeenCalled()
    })

    it('should fail when min price > max price', async () => {
      const result = await service.getBooksByPriceRange(15, 5)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Minimum price cannot be greater than maximum price')
      expect(mockRepository.getByPriceRange).not.toHaveBeenCalled()
    })
  })

  describe('getCategories', () => {
    it('should get categories successfully', async () => {
      const mockCategories = ['Fiction', 'Non-Fiction', 'Science']

      mockRepository.getCategories.mockResolvedValue(mockCategories)

      const result = await service.getCategories()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCategories)
      expect(mockRepository.getCategories).toHaveBeenCalled()
    })
  })

  describe('getTags', () => {
    it('should get tags successfully', async () => {
      const mockTags = ['fiction', 'adventure', 'mystery']

      mockRepository.getTags.mockResolvedValue(mockTags)

      const result = await service.getTags()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockTags)
      expect(mockRepository.getTags).toHaveBeenCalled()
    })
  })

  describe('bookExists', () => {
    it('should check if book exists successfully', async () => {
      mockRepository.exists.mockResolvedValue(true)

      const result = await service.bookExists(mockBook.id)

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockRepository.exists).toHaveBeenCalledWith(mockBook.id)
    })

    it('should fail validation for invalid ID', async () => {
      const result = await service.bookExists('invalid-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid book ID')
      expect(mockRepository.exists).not.toHaveBeenCalled()
    })
  })

  describe('getBooksByIds', () => {
    it('should get books by IDs successfully', async () => {
      const ids = [mockBook.id, '123e4567-e89b-12d3-a456-426614174001']
      const mockBooks = [mockBook]

      mockRepository.getByIds.mockResolvedValue(mockBooks)

      const result = await service.getBooksByIds(ids)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockBooks)
      expect(mockRepository.getByIds).toHaveBeenCalledWith(ids)
    })

    it('should return empty array for empty IDs', async () => {
      const result = await service.getBooksByIds([])

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
      expect(mockRepository.getByIds).not.toHaveBeenCalled()
    })

    it('should fail validation for invalid IDs', async () => {
      const ids = [mockBook.id, 'invalid-id']

      const result = await service.getBooksByIds(ids)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid book IDs')
      expect(result.validationErrors).toContainEqual({
        field: 'ids[1]',
        message: 'Book ID must be a valid UUID'
      })
      expect(mockRepository.getByIds).not.toHaveBeenCalled()
    })
  })
})