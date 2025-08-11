import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateBundleWithBooksCommand } from '../create-bundle-with-books-command'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}))

vi.mock('@/lib/services/bundle-service', () => ({
  bundleService: {
    createBundle: vi.fn()
  }
}))

describe('CreateBundleWithBooksCommand', () => {
  let command: CreateBundleWithBooksCommand
  let mockSupabase: any

  beforeEach(() => {
    command = new CreateBundleWithBooksCommand()
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis()
    }

    vi.clearAllMocks()
  })

  describe('Input Validation', () => {
    it('should reject empty title', async () => {
      const data = {
        title: '',
        price: 10,
        books: [
          {
            title: 'Test Book',
            author: 'Test Author',
            cover_image_url: 'http://example.com/cover.jpg',
            content_url: 'http://example.com/content.pdf'
          }
        ]
      }

      const result = await command.execute(data)

      expect(result.success).toBe(false)
      expect(result.validationErrors).toContainEqual({
        field: 'title',
        message: 'Title is required'
      })
    })

    it('should reject negative price', async () => {
      const data = {
        title: 'Test Bundle',
        price: -5,
        books: [
          {
            title: 'Test Book',
            author: 'Test Author',
            cover_image_url: 'http://example.com/cover.jpg',
            content_url: 'http://example.com/content.pdf'
          }
        ]
      }

      const result = await command.execute(data)

      expect(result.success).toBe(false)
      expect(result.validationErrors).toContainEqual({
        field: 'price',
        message: 'Valid price is required'
      })
    })

    it('should reject empty books array', async () => {
      const data = {
        title: 'Test Bundle',
        price: 10,
        books: []
      }

      const result = await command.execute(data)

      expect(result.success).toBe(false)
      expect(result.validationErrors).toContainEqual({
        field: 'books',
        message: 'At least one book is required'
      })
    })

    it('should validate individual book fields', async () => {
      const data = {
        title: 'Test Bundle',
        price: 10,
        books: [
          {
            title: '',
            author: 'Test Author',
            cover_image_url: 'http://example.com/cover.jpg',
            content_url: 'http://example.com/content.pdf'
          }
        ]
      }

      const result = await command.execute(data)

      expect(result.success).toBe(false)
      expect(result.validationErrors).toContainEqual({
        field: 'books[0].title',
        message: 'Book title is required'
      })
    })
  })

  describe('Successful Execution', () => {
    it('should create bundle with books successfully', async () => {
      const data = {
        title: 'Test Bundle',
        description: 'Test Description',
        price: 15.99,
        cover_image_url: 'http://example.com/bundle-cover.jpg',
        books: [
          {
            title: 'Test Book 1',
            author: 'Test Author 1',
            cover_image_url: 'http://example.com/cover1.jpg',
            content_url: 'http://example.com/content1.pdf'
          },
          {
            title: 'Test Book 2',
            author: 'Test Author 2',
            cover_image_url: 'http://example.com/cover2.jpg',
            content_url: 'http://example.com/content2.pdf'
          }
        ]
      }

      // Mock successful book creation
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [
              { id: 'book-1', title: 'Test Book 1', author: 'Test Author 1', price: 10 },
              { id: 'book-2', title: 'Test Book 2', author: 'Test Author 2', price: 8 }
            ],
            error: null
          })
        })
      })

      // Mock successful bundle creation
      const { bundleService } = await import('@/lib/services/bundle-service')
      vi.mocked(bundleService.createBundle).mockResolvedValue({
        success: true,
        data: {
          id: 'bundle-1',
          title: 'Test Bundle',
          description: 'Test Description',
          price: 15.99,
          books: [
            { id: 'book-1', title: 'Test Book 1', author: 'Test Author 1', price: 10 },
            { id: 'book-2', title: 'Test Book 2', author: 'Test Author 2', price: 8 }
          ]
        }
      })

      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const result = await command.execute(data)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(bundleService.createBundle).toHaveBeenCalledWith({
        title: 'Test Bundle',
        description: 'Test Description',
        price: 15.99,
        cover_image_url: 'http://example.com/bundle-cover.jpg',
        bookIds: ['book-1', 'book-2']
      })
    })
  })

  describe('Error Handling', () => {
    it('should cleanup books when bundle creation fails', async () => {
      const data = {
        title: 'Test Bundle',
        price: 10,
        books: [
          {
            title: 'Test Book',
            author: 'Test Author',
            cover_image_url: 'http://example.com/cover.jpg',
            content_url: 'http://example.com/content.pdf'
          }
        ]
      }

      // Mock successful book creation
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [{ id: 'book-1', title: 'Test Book', author: 'Test Author', price: 10 }],
            error: null
          })
        }),
        delete: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ error: null })
        })
      })

      // Mock failed bundle creation
      const { bundleService } = await import('@/lib/services/bundle-service')
      vi.mocked(bundleService.createBundle).mockResolvedValue({
        success: false,
        error: 'Bundle creation failed'
      })

      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValue(mockSupabase)

      const result = await command.execute(data)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Bundle creation failed')
      
      // Verify cleanup was called
      expect(mockSupabase.from).toHaveBeenCalledWith('books')
    })
  })
})