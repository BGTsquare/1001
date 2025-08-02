import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '../route'
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

const mockParams = { params: { id: 'book-1' } }

describe('/api/admin/books/[id]', () => {
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

      const request = new NextRequest('http://localhost:3000/api/admin/books/book-1')
      const response = await GET(request, mockParams)

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

      const request = new NextRequest('http://localhost:3000/api/admin/books/book-1')
      const response = await GET(request, mockParams)

      expect(response.status).toBe(403)
    })

    it('returns book for admin user', async () => {
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
      const mockGetBookById = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'book-1',
          title: 'Test Book',
          author: 'Test Author'
        }
      })
      BookService.mockImplementation(() => ({
        getBookById: mockGetBookById
      }))

      const request = new NextRequest('http://localhost:3000/api/admin/books/book-1')
      const response = await GET(request, mockParams)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.id).toBe('book-1')
      expect(mockGetBookById).toHaveBeenCalledWith('book-1')
    })

    it('returns 404 when book not found', async () => {
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
      const mockGetBookById = jest.fn().mockResolvedValue({
        success: false,
        error: 'Book not found'
      })
      BookService.mockImplementation(() => ({
        getBookById: mockGetBookById
      }))

      const request = new NextRequest('http://localhost:3000/api/admin/books/book-1')
      const response = await GET(request, mockParams)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Book not found')
    })
  })

  describe('PUT', () => {
    it('updates book for admin user', async () => {
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
      const mockUpdateBook = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'book-1',
          title: 'Updated Book',
          author: 'Test Author'
        }
      })
      BookService.mockImplementation(() => ({
        updateBook: mockUpdateBook
      }))

      const updateData = { title: 'Updated Book' }
      const request = new NextRequest('http://localhost:3000/api/admin/books/book-1', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      const response = await PUT(request, mockParams)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.title).toBe('Updated Book')
      expect(mockUpdateBook).toHaveBeenCalledWith('book-1', updateData)
    })

    it('returns 404 when book not found', async () => {
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
      const mockUpdateBook = jest.fn().mockResolvedValue({
        success: false,
        error: 'Book not found'
      })
      BookService.mockImplementation(() => ({
        updateBook: mockUpdateBook
      }))

      const request = new NextRequest('http://localhost:3000/api/admin/books/book-1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Book' })
      })
      const response = await PUT(request, mockParams)

      expect(response.status).toBe(404)
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
      const mockUpdateBook = jest.fn().mockResolvedValue({
        success: false,
        error: 'Validation failed',
        validationErrors: [{ field: 'title', message: 'Title cannot be empty' }]
      })
      BookService.mockImplementation(() => ({
        updateBook: mockUpdateBook
      }))

      const request = new NextRequest('http://localhost:3000/api/admin/books/book-1', {
        method: 'PUT',
        body: JSON.stringify({ title: '' })
      })
      const response = await PUT(request, mockParams)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation failed')
      expect(data.validationErrors).toHaveLength(1)
    })
  })

  describe('DELETE', () => {
    it('deletes book for admin user', async () => {
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
      const mockDeleteBook = jest.fn().mockResolvedValue({
        success: true,
        data: true
      })
      BookService.mockImplementation(() => ({
        deleteBook: mockDeleteBook
      }))

      const request = new NextRequest('http://localhost:3000/api/admin/books/book-1', {
        method: 'DELETE'
      })
      const response = await DELETE(request, mockParams)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toBe('Book deleted successfully')
      expect(mockDeleteBook).toHaveBeenCalledWith('book-1')
    })

    it('returns 404 when book not found', async () => {
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
      const mockDeleteBook = jest.fn().mockResolvedValue({
        success: false,
        error: 'Book not found'
      })
      BookService.mockImplementation(() => ({
        deleteBook: mockDeleteBook
      }))

      const request = new NextRequest('http://localhost:3000/api/admin/books/book-1', {
        method: 'DELETE'
      })
      const response = await DELETE(request, mockParams)

      expect(response.status).toBe(404)
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
      const mockDeleteBook = jest.fn().mockRejectedValue(new Error('Database error'))
      BookService.mockImplementation(() => ({
        deleteBook: mockDeleteBook
      }))

      const request = new NextRequest('http://localhost:3000/api/admin/books/book-1', {
        method: 'DELETE'
      })
      const response = await DELETE(request, mockParams)

      expect(response.status).toBe(500)
    })
  })
})