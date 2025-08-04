import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    }))
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      getPublicUrl: vi.fn()
    }))
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase
}))

// Mock storage utilities
vi.mock('@/lib/storage/file-validation', () => ({
  validateFile: vi.fn(() => ({ isValid: true, errors: [] })),
  generateUniqueFileName: vi.fn((name) => `unique-${name}`)
}))

vi.mock('@/lib/storage/image-processing', () => ({
  optimizeImage: vi.fn((file) => Promise.resolve(file)),
  createThumbnail: vi.fn(() => Promise.resolve(null))
}))

describe('/api/admin/books/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should upload file successfully for admin user', async () => {
    // Mock authenticated admin user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-id' } },
      error: null
    })

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { role: 'admin' },
      error: null
    })

    // Mock successful storage upload
    mockSupabase.storage.from().upload.mockResolvedValue({
      data: { path: 'covers/unique-test.jpg' },
      error: null
    })

    mockSupabase.storage.from().getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.com/covers/unique-test.jpg' }
    })

    // Create form data
    const formData = new FormData()
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
    formData.append('file', file)
    formData.append('type', 'cover')

    const request = new NextRequest('http://localhost/api/admin/books/upload', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      url: 'https://example.com/covers/unique-test.jpg',
      fileName: 'covers/unique-test.jpg',
      size: expect.any(Number),
      type: 'image/jpeg',
      thumbnailUrl: undefined,
      optimized: false,
      originalSize: expect.any(Number)
    })
  })

  it('should reject unauthenticated requests', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated')
    })

    const formData = new FormData()
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
    formData.append('file', file)
    formData.append('type', 'cover')

    const request = new NextRequest('http://localhost/api/admin/books/upload', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should reject non-admin users', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-id' } },
      error: null
    })

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { role: 'user' },
      error: null
    })

    const formData = new FormData()
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
    formData.append('file', file)
    formData.append('type', 'cover')

    const request = new NextRequest('http://localhost/api/admin/books/upload', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
  })

  it('should reject requests without file', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-id' } },
      error: null
    })

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { role: 'admin' },
      error: null
    })

    const formData = new FormData()
    formData.append('type', 'cover')

    const request = new NextRequest('http://localhost/api/admin/books/upload', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('No file provided')
  })

  it('should reject invalid file types', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-id' } },
      error: null
    })

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { role: 'admin' },
      error: null
    })

    const formData = new FormData()
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
    formData.append('file', file)
    formData.append('type', 'invalid')

    const request = new NextRequest('http://localhost/api/admin/books/upload', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid file type')
  })

  it('should handle file validation errors', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-id' } },
      error: null
    })

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { role: 'admin' },
      error: null
    })

    // Mock validation failure
    const { validateFile } = await import('@/lib/storage/file-validation')
    ;(validateFile as any).mockReturnValue({
      isValid: false,
      errors: ['File too large', 'Invalid format']
    })

    const formData = new FormData()
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
    formData.append('file', file)
    formData.append('type', 'cover')

    const request = new NextRequest('http://localhost/api/admin/books/upload', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('File validation failed: File too large, Invalid format')
  })

  it('should handle storage upload errors', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-id' } },
      error: null
    })

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { role: 'admin' },
      error: null
    })

    // Mock storage upload failure
    mockSupabase.storage.from().upload.mockResolvedValue({
      data: null,
      error: { message: 'Storage error' }
    })

    const formData = new FormData()
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
    formData.append('file', file)
    formData.append('type', 'cover')

    const request = new NextRequest('http://localhost/api/admin/books/upload', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to upload file')
  })

  it('should optimize images when requested', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-id' } },
      error: null
    })

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { role: 'admin' },
      error: null
    })

    mockSupabase.storage.from().upload.mockResolvedValue({
      data: { path: 'covers/unique-test.webp' },
      error: null
    })

    mockSupabase.storage.from().getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.com/covers/unique-test.webp' }
    })

    // Mock image optimization
    const optimizedFile = new File(['optimized'], 'test.webp', { type: 'image/webp' })
    const { optimizeImage } = await import('@/lib/storage/image-processing')
    ;(optimizeImage as any).mockResolvedValue(optimizedFile)

    const formData = new FormData()
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
    formData.append('file', file)
    formData.append('type', 'cover')
    formData.append('optimize', 'true')

    const request = new NextRequest('http://localhost/api/admin/books/upload', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.optimized).toBe(true)
    expect(optimizeImage).toHaveBeenCalledWith(file, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.8,
      format: 'webp'
    })
  })
})