import { NextRequest } from 'next/server'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { GET } from '../route'
import { createClient } from '@/lib/supabase/server'
import { bookService } from '@/lib/services/book-service'
import { libraryService } from '@/lib/services/library-service'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/book-service')
vi.mock('@/lib/services/library-service')

const mockCreateClient = createClient as any
const mockBookService = bookService as any
const mockLibraryService = libraryService as any

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
}

describe('/api/books/[id]/content', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabase as any)
  })

  it('returns book content for authenticated user who owns the book', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }
    const mockBook = {
      id: 'book-1',
      title: 'Test Book',
      author: 'Test Author',
      is_free: false,
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockBookService.getBookById.mockResolvedValue({
      success: true,
      data: mockBook,
    })

    mockLibraryService.checkBookOwnership.mockResolvedValue({
      success: true,
      data: { owned: true },
    })

    const request = new NextRequest('http://localhost/api/books/book-1/content')
    const response = await GET(request, { params: { id: 'book-1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.content).toContain('Test Book')
    expect(data.content).toContain('Test Author')
    expect(data.book.id).toBe('book-1')
  })

  it('returns book content for free book without ownership check', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }
    const mockBook = {
      id: 'book-1',
      title: 'Free Book',
      author: 'Test Author',
      is_free: true,
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockBookService.getBookById.mockResolvedValue({
      success: true,
      data: mockBook,
    })

    const request = new NextRequest('http://localhost/api/books/book-1/content')
    const response = await GET(request, { params: { id: 'book-1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.content).toContain('Free Book')
    expect(mockLibraryService.checkBookOwnership).not.toHaveBeenCalled()
  })

  it('returns 401 for unauthenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    })

    const request = new NextRequest('http://localhost/api/books/book-1/content')
    const response = await GET(request, { params: { id: 'book-1' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
  })

  it('returns 404 for non-existent book', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockBookService.getBookById.mockResolvedValue({
      success: false,
      data: null,
    })

    const request = new NextRequest('http://localhost/api/books/book-1/content')
    const response = await GET(request, { params: { id: 'book-1' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Book not found')
  })

  it('returns 403 for paid book not owned by user', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }
    const mockBook = {
      id: 'book-1',
      title: 'Paid Book',
      author: 'Test Author',
      is_free: false,
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockBookService.getBookById.mockResolvedValue({
      success: true,
      data: mockBook,
    })

    mockLibraryService.checkBookOwnership.mockResolvedValue({
      success: true,
      data: { owned: false },
    })

    const request = new NextRequest('http://localhost/api/books/book-1/content')
    const response = await GET(request, { params: { id: 'book-1' } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('You do not own this book')
  })

  it('handles ownership check failure', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }
    const mockBook = {
      id: 'book-1',
      title: 'Paid Book',
      author: 'Test Author',
      is_free: false,
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockBookService.getBookById.mockResolvedValue({
      success: true,
      data: mockBook,
    })

    mockLibraryService.checkBookOwnership.mockResolvedValue({
      success: false,
      error: 'Database error',
    })

    const request = new NextRequest('http://localhost/api/books/book-1/content')
    const response = await GET(request, { params: { id: 'book-1' } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('You do not own this book')
  })

  it('handles server errors', async () => {
    mockSupabase.auth.getUser.mockRejectedValue(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost/api/books/book-1/content')
    const response = await GET(request, { params: { id: 'book-1' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })
})