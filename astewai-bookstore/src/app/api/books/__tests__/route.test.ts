import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../route'
import { createMockRequest, createMockSupabaseResponse } from '@/test/test-helpers'
import { createMockBook } from '@/test/utils'

// Mock the Supabase server client
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabaseClient,
}))

// Mock the book service
const mockBookService = {
  getAllBooks: vi.fn(),
  createBook: vi.fn(),
  searchBooks: vi.fn(),
}

vi.mock('@/lib/services/book-service', () => ({
  BookService: vi.fn(() => mockBookService),
}))

describe('/api/books', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns all books successfully', async () => {
      const mockBooks = [
        createMockBook({ id: '1', title: 'Book 1' }),
        createMockBook({ id: '2', title: 'Book 2' }),
      ]

      mockBookService.getAllBooks.mockResolvedValue(mockBooks)

      const request = createMockRequest('GET', 'http://localhost:3000/api/books')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ books: mockBooks })
      expect(mockBookService.getAllBooks).toHaveBeenCalled()
    })

    it('handles search query parameter', async () => {
      const mockBooks = [createMockBook({ title: 'Searched Book' })]
      mockBookService.searchBooks.mockResolvedValue(mockBooks)

      const request = createMockRequest('GET', 'http://localhost:3000/api/books?search=test')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ books: mockBooks })
      expect(mockBookService.searchBooks).toHaveBeenCalledWith('test')
    })

    it('handles category filter', async () => {
      const mockBooks = [createMockBook({ category: 'Fiction' })]
      mockBookService.getAllBooks.mockResolvedValue(mockBooks)

      const request = createMockRequest('GET', 'http://localhost:3000/api/books?category=Fiction')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockBookService.getAllBooks).toHaveBeenCalledWith({ category: 'Fiction' })
    })

    it('handles pagination parameters', async () => {
      const mockBooks = [createMockBook()]
      mockBookService.getAllBooks.mockResolvedValue(mockBooks)

      const request = createMockRequest('GET', 'http://localhost:3000/api/books?page=2&limit=10')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockBookService.getAllBooks).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
      })
    })

    it('returns 500 when service throws error', async () => {
      mockBookService.getAllBooks.mockRejectedValue(new Error('Database error'))

      const request = createMockRequest('GET', 'http://localhost:3000/api/books')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch books' })
    })

    it('handles empty results', async () => {
      mockBookService.getAllBooks.mockResolvedValue([])

      const request = createMockRequest('GET', 'http://localhost:3000/api/books')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ books: [] })
    })
  })

  describe('POST', () => {
    const mockUser = { id: 'user-1', email: 'admin@example.com' }
    const mockProfile = { id: 'user-1', role: 'admin' }

    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      })
    })

    it('creates a new book successfully for admin user', async () => {
      const newBook = createMockBook({ title: 'New Book' })
      const bookData = {
        title: 'New Book',
        author: 'Test Author',
        description: 'Test description',
        price: 19.99,
        is_free: false,
        category: 'Fiction',
        tags: ['test'],
      }

      mockBookService.createBook.mockResolvedValue(newBook)

      const request = createMockRequest('POST', 'http://localhost:3000/api/books', bookData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual({ book: newBook })
      expect(mockBookService.createBook).toHaveBeenCalledWith(bookData)
    })

    it('returns 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = createMockRequest('POST', 'http://localhost:3000/api/books', {})
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('returns 403 when user is not admin', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockProfile, role: 'user' },
              error: null,
            }),
          }),
        }),
      })

      const request = createMockRequest('POST', 'http://localhost:3000/api/books', {})
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toEqual({ error: 'Forbidden' })
    })

    it('validates required fields', async () => {
      const invalidData = {
        title: '', // Empty title
        author: 'Test Author',
      }

      const request = createMockRequest('POST', 'http://localhost:3000/api/books', invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('validation')
    })

    it('handles service errors', async () => {
      const bookData = {
        title: 'New Book',
        author: 'Test Author',
        description: 'Test description',
        price: 19.99,
        is_free: false,
        category: 'Fiction',
        tags: ['test'],
      }

      mockBookService.createBook.mockRejectedValue(new Error('Database error'))

      const request = createMockRequest('POST', 'http://localhost:3000/api/books', bookData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to create book' })
    })

    it('handles malformed JSON', async () => {
      const request = new Request('http://localhost:3000/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid JSON')
    })

    it('sanitizes input data', async () => {
      const bookData = {
        title: '<script>alert("xss")</script>Clean Title',
        author: 'Test Author',
        description: 'Clean description',
        price: 19.99,
        is_free: false,
        category: 'Fiction',
        tags: ['test'],
      }

      const sanitizedBook = createMockBook({ title: 'Clean Title' })
      mockBookService.createBook.mockResolvedValue(sanitizedBook)

      const request = createMockRequest('POST', 'http://localhost:3000/api/books', bookData)
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(mockBookService.createBook).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.not.stringContaining('<script>'),
        })
      )
    })
  })
})