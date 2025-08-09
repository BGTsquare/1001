import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'
import { StorageService } from '@/lib/services/storage-service'
import { BUCKET_CONFIGS } from '@/lib/config/storage'

// Mock the dependencies
vi.mock('@/lib/services/storage-service')
vi.mock('@/lib/middleware/auth-middleware', () => ({
  withAdminAuth: (handler: any) => handler
}))

const mockStorageService = {
  setupBucket: vi.fn()
}

vi.mocked(StorageService.create).mockResolvedValue(mockStorageService as any)

describe('/api/admin/setup/storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockRequest = (overrides = {}) => ({
    user: { id: 'admin-user-id' },
    profile: { role: 'admin' },
    ...overrides
  }) as any

  describe('POST', () => {
    it('should create new bucket successfully', async () => {
      const mockResult = {
        created: true,
        message: "Bucket 'books' created successfully",
        bucket: { id: 'books', name: 'books' }
      }

      mockStorageService.setupBucket.mockResolvedValue(mockResult)

      const request = createMockRequest()
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(mockResult)
      expect(mockStorageService.setupBucket).toHaveBeenCalledWith(BUCKET_CONFIGS.BOOKS)
    })

    it('should return 200 when bucket already exists', async () => {
      const mockResult = {
        created: false,
        message: "Bucket 'books' already exists",
        bucket: { id: 'books', name: 'books' }
      }

      mockStorageService.setupBucket.mockResolvedValue(mockResult)

      const request = createMockRequest()
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockResult)
    })

    it('should handle storage service errors', async () => {
      const errorMessage = 'Failed to create bucket: Permission denied'
      mockStorageService.setupBucket.mockRejectedValue(new Error(errorMessage))

      const request = createMockRequest()
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Failed to setup storage bucket',
        details: errorMessage
      })
    })

    it('should handle unknown errors gracefully', async () => {
      mockStorageService.setupBucket.mockRejectedValue('Unknown error')

      const request = createMockRequest()
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Failed to setup storage bucket',
        details: 'Unknown error'
      })
    })

    it('should log successful operations', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      
      const mockResult = {
        created: true,
        message: "Bucket 'books' created successfully",
        bucket: { id: 'books' }
      }

      mockStorageService.setupBucket.mockResolvedValue(mockResult)

      const request = createMockRequest()
      await POST(request)

      expect(consoleSpy).toHaveBeenCalledWith('Storage setup completed:', expect.objectContaining({
        bucketId: 'books',
        created: true,
        adminUserId: 'admin-user-id'
      }))

      consoleSpy.mockRestore()
    })

    it('should log errors with context', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Test error')
      
      mockStorageService.setupBucket.mockRejectedValue(error)

      const request = createMockRequest()
      await POST(request)

      expect(consoleSpy).toHaveBeenCalledWith('Storage setup failed:', expect.objectContaining({
        error: 'Test error',
        bucketId: 'books',
        adminUserId: 'admin-user-id'
      }))

      consoleSpy.mockRestore()
    })
  })
})