import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StorageService } from '../storage-service'
import { createClient } from '@/lib/supabase/server'
import type { StorageBucketConfig } from '../storage-service'

// Mock Supabase client
vi.mock('@/lib/supabase/server')

const mockSupabaseClient = {
  storage: {
    listBuckets: vi.fn(),
    createBucket: vi.fn(),
    deleteBucket: vi.fn(),
    from: vi.fn()
  }
}

vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as any)

describe('StorageService', () => {
  let storageService: StorageService

  beforeEach(() => {
    vi.clearAllMocks()
    storageService = new StorageService(mockSupabaseClient as any)
  })

  describe('bucketExists', () => {
    it('should return bucket if it exists', async () => {
      const mockBuckets = [
        { id: 'books', name: 'books' },
        { id: 'avatars', name: 'avatars' }
      ]

      mockSupabaseClient.storage.listBuckets.mockResolvedValue({
        data: mockBuckets,
        error: null
      })

      const result = await storageService.bucketExists('books')

      expect(result).toEqual({ id: 'books', name: 'books' })
      expect(mockSupabaseClient.storage.listBuckets).toHaveBeenCalledOnce()
    })

    it('should return undefined if bucket does not exist', async () => {
      const mockBuckets = [
        { id: 'avatars', name: 'avatars' }
      ]

      mockSupabaseClient.storage.listBuckets.mockResolvedValue({
        data: mockBuckets,
        error: null
      })

      const result = await storageService.bucketExists('books')

      expect(result).toBeUndefined()
    })

    it('should throw error if listBuckets fails', async () => {
      mockSupabaseClient.storage.listBuckets.mockResolvedValue({
        data: null,
        error: { message: 'Permission denied' }
      })

      await expect(storageService.bucketExists('books')).rejects.toThrow(
        'Failed to list buckets: Permission denied'
      )
    })
  })

  describe('createBucket', () => {
    const mockConfig: StorageBucketConfig = {
      id: 'test-bucket',
      public: true,
      fileSizeLimit: 1000000,
      allowedMimeTypes: ['image/jpeg', 'image/png']
    }

    it('should create bucket successfully', async () => {
      const mockBucket = { id: 'test-bucket', name: 'test-bucket' }

      mockSupabaseClient.storage.createBucket.mockResolvedValue({
        data: mockBucket,
        error: null
      })

      const result = await storageService.createBucket(mockConfig)

      expect(result).toEqual(mockBucket)
      expect(mockSupabaseClient.storage.createBucket).toHaveBeenCalledWith('test-bucket', {
        public: true,
        fileSizeLimit: 1000000,
        allowedMimeTypes: ['image/jpeg', 'image/png']
      })
    })

    it('should throw error if createBucket fails', async () => {
      mockSupabaseClient.storage.createBucket.mockResolvedValue({
        data: null,
        error: { message: 'Bucket already exists' }
      })

      await expect(storageService.createBucket(mockConfig)).rejects.toThrow(
        "Failed to create bucket 'test-bucket': Bucket already exists"
      )
    })
  })

  describe('setupBucket', () => {
    const mockConfig: StorageBucketConfig = {
      id: 'test-bucket',
      public: true,
      fileSizeLimit: 1000000,
      allowedMimeTypes: ['image/jpeg']
    }

    it('should return existing bucket if it exists', async () => {
      const existingBucket = { id: 'test-bucket', name: 'test-bucket' }

      mockSupabaseClient.storage.listBuckets.mockResolvedValue({
        data: [existingBucket],
        error: null
      })

      const result = await storageService.setupBucket(mockConfig)

      expect(result).toEqual({
        created: false,
        message: "Bucket 'test-bucket' already exists",
        bucket: existingBucket
      })
      expect(mockSupabaseClient.storage.createBucket).not.toHaveBeenCalled()
    })

    it('should create new bucket if it does not exist', async () => {
      const newBucket = { id: 'test-bucket', name: 'test-bucket' }

      mockSupabaseClient.storage.listBuckets.mockResolvedValue({
        data: [],
        error: null
      })

      mockSupabaseClient.storage.createBucket.mockResolvedValue({
        data: newBucket,
        error: null
      })

      const result = await storageService.setupBucket(mockConfig)

      expect(result).toEqual({
        created: true,
        message: "Bucket 'test-bucket' created successfully",
        bucket: newBucket
      })
      expect(mockSupabaseClient.storage.createBucket).toHaveBeenCalledWith('test-bucket', {
        public: true,
        fileSizeLimit: 1000000,
        allowedMimeTypes: ['image/jpeg']
      })
    })
  })

  describe('deleteBucket', () => {
    it('should delete bucket successfully', async () => {
      mockSupabaseClient.storage.deleteBucket.mockResolvedValue({
        error: null
      })

      await expect(storageService.deleteBucket('test-bucket')).resolves.toBeUndefined()
      expect(mockSupabaseClient.storage.deleteBucket).toHaveBeenCalledWith('test-bucket')
    })

    it('should throw error if deleteBucket fails', async () => {
      mockSupabaseClient.storage.deleteBucket.mockResolvedValue({
        error: { message: 'Bucket not found' }
      })

      await expect(storageService.deleteBucket('test-bucket')).rejects.toThrow(
        "Failed to delete bucket 'test-bucket': Bucket not found"
      )
    })
  })

  describe('static create', () => {
    it('should create instance with server client', async () => {
      const instance = await StorageService.create()
      
      expect(instance).toBeInstanceOf(StorageService)
      expect(createClient).toHaveBeenCalledOnce()
    })
  })

  describe('getPublicUrl', () => {
    it('should return public URL for file', () => {
      const mockBucket = {
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/file.jpg' }
        })
      }

      mockSupabaseClient.storage.from.mockReturnValue(mockBucket)

      const url = storageService.getPublicUrl('books', 'covers/book1.jpg')

      expect(url).toBe('https://example.com/file.jpg')
      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('books')
      expect(mockBucket.getPublicUrl).toHaveBeenCalledWith('covers/book1.jpg')
    })
  })
})