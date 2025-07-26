import { NextRequest } from 'next/server'
import { vi } from 'vitest'
import { GET } from '../route'

// Mock the book service
const mockBookService = {
  getBookById: vi.fn()
}

vi.mock('@/lib/services/book-service', () => ({
  bookService: mockBookService
}))

const mockBook = {
  id: '1',
  title: 'Test Book',
  author: 'Test Author',
  description: 'Test description',
  content_url: 'https://example.com/content.pdf',
  price: 19.99,
  is_free: false
}

describe('/api/books/[id]/preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns preview content for valid book with content', async () => {
    mockBookService.getBookById.mockResolvedValueOnce({
      success: true,
      data: mockBook
    })

    const request = new NextRequest('http://localhost:3000/api/books/1/preview')
    const response = await GET(request, { params: { id: '1' } })
    
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('title', 'Test Book')
    expect(data).toHaveProperty('content')
    expect(data).toHaveProperty('totalPages', 250)
    expect(data).toHaveProperty('previewPages', 25)
    expect(data.content).toContain('# Test Book')
    expect(data.content).toContain('*by Test Author*')
  })

  it('returns 404 when book does not exist', async () => {
    mockBookService.getBookById.mockResolvedValueOnce({
      success: false,
      data: null
    })

    const request = new NextRequest('http://localhost:3000/api/books/999/preview')
    const response = await GET(request, { params: { id: '999' } })
    
    expect(response.status).toBe(404)
    
    const data = await response.json()
    expect(data).toEqual({ error: 'Book not found' })
  })

  it('returns 404 when book has no content URL', async () => {
    const bookWithoutContent = { ...mockBook, content_url: null }
    mockBookService.getBookById.mockResolvedValueOnce({
      success: true,
      data: bookWithoutContent
    })

    const request = new NextRequest('http://localhost:3000/api/books/1/preview')
    const response = await GET(request, { params: { id: '1' } })
    
    expect(response.status).toBe(404)
    
    const data = await response.json()
    expect(data).toEqual({ error: 'Preview not available for this book' })
  })

  it('handles service errors gracefully', async () => {
    mockBookService.getBookById.mockRejectedValueOnce(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/books/1/preview')
    const response = await GET(request, { params: { id: '1' } })
    
    expect(response.status).toBe(500)
    
    const data = await response.json()
    expect(data).toEqual({ error: 'Internal server error' })
  })

  it('generates preview content with book description', async () => {
    mockBookService.getBookById.mockResolvedValueOnce({
      success: true,
      data: mockBook
    })

    const request = new NextRequest('http://localhost:3000/api/books/1/preview')
    const response = await GET(request, { params: { id: '1' } })
    
    const data = await response.json()
    expect(data.content).toContain('Test description')
  })

  it('generates preview content without description when not available', async () => {
    const bookWithoutDescription = { ...mockBook, description: null }
    mockBookService.getBookById.mockResolvedValueOnce({
      success: true,
      data: bookWithoutDescription
    })

    const request = new NextRequest('http://localhost:3000/api/books/1/preview')
    const response = await GET(request, { params: { id: '1' } })
    
    const data = await response.json()
    expect(data.content).toContain('Welcome to this fascinating journey')
  })

  it('includes proper preview structure', async () => {
    mockBookService.getBookById.mockResolvedValueOnce({
      success: true,
      data: mockBook
    })

    const request = new NextRequest('http://localhost:3000/api/books/1/preview')
    const response = await GET(request, { params: { id: '1' } })
    
    const data = await response.json()
    
    // Check for expected sections
    expect(data.content).toContain('## Table of Contents')
    expect(data.content).toContain('## Chapter 1: Introduction')
    expect(data.content).toContain('## Chapter 2: Getting Started')
    expect(data.content).toContain('## What\'s in the Full Book')
    expect(data.content).toContain('*This preview contains approximately 10% of the full book content.*')
  })

  it('calls book service with correct ID', async () => {
    mockBookService.getBookById.mockResolvedValueOnce({
      success: true,
      data: mockBook
    })

    const request = new NextRequest('http://localhost:3000/api/books/123/preview')
    await GET(request, { params: { id: '123' } })
    
    expect(mockBookService.getBookById).toHaveBeenCalledWith('123')
  })
})