import { NextRequest } from 'next/server'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { PUT } from '../route'
import { createClient } from '@/lib/supabase/server'
import { libraryService } from '@/lib/services/library-service'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/library-service')

const mockCreateClient = createClient as any
const mockLibraryService = libraryService as any

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
}

describe('/api/library/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabase as any)
  })

  it('updates reading progress successfully', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }
    const mockLibraryItem = {
      id: 'library-1',
      user_id: 'user-1',
      book_id: 'book-1',
      status: 'owned',
      progress: 50,
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockLibraryService.updateReadingProgress.mockResolvedValue({
      success: true,
      data: mockLibraryItem,
      statusChanged: false,
    })

    const requestBody = {
      bookId: 'book-1',
      progress: 50,
      lastReadPosition: '{"scrollTop": 500, "scrollHeight": 1000}',
    }

    const request = new NextRequest('http://localhost/api/library/progress', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockLibraryItem)
    expect(data.statusChanged).toBe(false)
    expect(mockLibraryService.updateReadingProgress).toHaveBeenCalledWith(
      'user-1',
      'book-1',
      50,
      '{"scrollTop": 500, "scrollHeight": 1000}'
    )
  })

  it('handles book completion status change', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }
    const mockLibraryItem = {
      id: 'library-1',
      user_id: 'user-1',
      book_id: 'book-1',
      status: 'completed',
      progress: 100,
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockLibraryService.updateReadingProgress.mockResolvedValue({
      success: true,
      data: mockLibraryItem,
      statusChanged: true,
    })

    const requestBody = {
      bookId: 'book-1',
      progress: 100,
      lastReadPosition: '{"scrollTop": 1000, "scrollHeight": 1000}',
    }

    const request = new NextRequest('http://localhost/api/library/progress', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.statusChanged).toBe(true)
    expect(data.data.status).toBe('completed')
  })

  it('returns 401 for unauthenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    })

    const requestBody = {
      bookId: 'book-1',
      progress: 50,
    }

    const request = new NextRequest('http://localhost/api/library/progress', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
  })

  it('returns 400 for missing bookId', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const requestBody = {
      progress: 50,
    }

    const request = new NextRequest('http://localhost/api/library/progress', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Book ID is required')
  })

  it('returns 400 for missing progress', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const requestBody = {
      bookId: 'book-1',
    }

    const request = new NextRequest('http://localhost/api/library/progress', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Progress is required')
  })

  it('returns 400 for invalid progress value', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Mock validation to return invalid
    vi.doMock('@/lib/validation/library-validation', () => ({
      validateProgress: vi.fn().mockReturnValue({
        isValid: false,
        error: 'Progress must be between 0 and 100',
      }),
    }))

    const requestBody = {
      bookId: 'book-1',
      progress: 150, // Invalid progress
    }

    const request = new NextRequest('http://localhost/api/library/progress', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Progress must be between 0 and 100')
  })

  it('handles library service errors', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockLibraryService.updateReadingProgress.mockResolvedValue({
      success: false,
      error: 'Book not found in library',
    })

    const requestBody = {
      bookId: 'book-1',
      progress: 50,
    }

    const request = new NextRequest('http://localhost/api/library/progress', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Book not found in library')
  })

  it('handles server errors', async () => {
    mockSupabase.auth.getUser.mockRejectedValue(new Error('Database connection failed'))

    const requestBody = {
      bookId: 'book-1',
      progress: 50,
    }

    const request = new NextRequest('http://localhost/api/library/progress', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })
})