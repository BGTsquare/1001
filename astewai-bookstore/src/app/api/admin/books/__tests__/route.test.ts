import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

// Mock BookService
jest.mock('@/lib/services/book-service')

const mockSupabase = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
}

describe('/api/admin/books', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabase as any)
  })

  describe('GET', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost:3000/api/admin/books')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 403 when user is not admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { role: 'user' },
              error: null
            })
          }))
        }))
      })

      const request = new NextRequest('http://localhost:3000/api/admin/books')
      const response = await GET(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Forbidden')
    })

    it('returns books for admin user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          }))
        }))
      })

      // Mock BookService
      const { BookService } = require('@/lib/services/book-service')
      const mockSearchBooks = jest.fn().mockResolvedValue({
        success: true,
        data: {
          books: [
            { id: '1', title: 'Test Book', author: 'Test Author' }
          ],
          total: 1
        }
      })
      BookService.mockImplementation(() => ({
        searchBooks: mockSearchBooks
      }))

      const request = new NextRequest('http://localhost:3000/api/admin/books?search=test')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.books).toHaveLength(1)
      expect(data.total).toBe(1)
      expect(mockSearchBooks).toHaveBeenCalledWith({
        query: 'test',
        category: undefined,
        isFree: undefined,
        limit: 50,
        offset: 0,
        sortBy: 'created_at',
        sortOrder: 'desc'
      })
    })

    it('handles search parameters correctly', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          }))
        }))
      })

      const { BookService } = require('@/lib/services/book-service')
      const mockSearchBooks = jest.fn().mockResolvedValue({
        success: true,
        data: { books: [], total: 0 }
      })
      BookService.mockImplementation(() => ({
        searchBooks: mockSearchBooks
      }))

      const request = new NextRequest(
        'http://localhost:3000/api/admin/books?search=fiction&category=Fiction&is_free=true&limit=10&offset=20'
      )
      const response = await GET(request)

      expect(mockSearchBooks).toHaveBeenCalledWith({
        query: 'fiction',
        category: 'Fiction',
        isFree: true,
        limit: 10,
        offset: 20,
        sortBy: 'created_at',
        sortOrder: 'desc'
      })
    })

    it('handles service errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          }))
        }))
      })

      const { BookService } = require('@/lib/services/book-service')
      const mockSearchBooks = jest.fn().mockResolvedValue({
        success: false,
        error: 'Invalid search parameters',
        validationErrors: [{ field: 'query', message: 'Too long' }]
      })
      BookService.mockImplementation(() => ({
        searchBooks: mockSearchBooks
      }))

      const request = new NextRequest('http://localhost:3000/api/admin/books')
      const response = await GET(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid search parameters')
      expect(data.validationErrors).toEqual([{ field: 'query', message: 'Too long' }])
    })
  })

  describe('POST', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost:3000/api/admin/books', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Book', author: 'Test Author' })
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('returns 403 when user is not admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { role: 'user' },
              error: null
            })
          }))
        }))
      })

      const request = new NextRequest('http://localhost:3000/api/admin/books', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Book', author: 'Test Author' })
      })
      const response = await POST(request)

      expect(response.status).toBe(403)
    })

    it('creates book for admin user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          }))
        }))
      })

      const { BookService } = require('@/lib/services/book-service')
      const mockCreateBook = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: '1',
          title: 'Test Book',
          author: 'Test Author',
          price: 9.99,
          is_free: false
        }
      })
      BookService.mockImplementation(() => ({
        createBook: mockCreateBook
      }))

      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        price: 9.99,
        is_free: false
      }

      const request = new NextRequest('http://localhost:3000/api/admin/books', {
        method: 'POST',
        body: JSON.stringify(bookData)
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.title).toBe('Test Book')
      expect(mockCreateBook).toHaveBeenCalledWith(bookData)
    })

    it('handles validation errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          }))
        }))
      })

      const { BookService } = require('@/lib/services/book-service')
      const mockCreateBook = jest.fn().mockResolvedValue({
        success: false,
        error: 'Validation failed',
        validationErrors: [
          { field: 'title', message: 'Title is required' },
          { field: 'author', message: 'Author is required' }
        ]
      })
      BookService.mockImplementation(() => ({
        createBook: mockCreateBook
      }))

      const request = new NextRequest('http://localhost:3000/api/admin/books', {
        method: 'POST',
        body: JSON.stringify({})
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation failed')
      expect(data.validationErrors).toHaveLength(2)
    })

    it('handles service errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          }))
        }))
      })

      const { BookService } = require('@/lib/services/book-service')
      const mockCreateBook = jest.fn().mockRejectedValue(new Error('Database error'))
      BookService.mockImplementation(() => ({
        createBook: mockCreateBook
      }))

      const request = new NextRequest('http://localhost:3000/api/admin/books', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Book', author: 'Test Author' })
      })
      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })
  })
})