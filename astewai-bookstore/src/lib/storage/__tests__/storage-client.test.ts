import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StorageClient } from '../storage-client'
import type { FileUploadResult, FileUploadProgress } from '../types'

// Type-safe mock for Supabase storage bucket
interface MockStorageBucket {
  upload: ReturnType<typeof vi.fn>
  remove: ReturnType<typeof vi.fn>
  list: ReturnType<typeof vi.fn>
  getPublicUrl: ReturnType<typeof vi.fn>
  createSignedUrl: ReturnType<typeof vi.fn>
  move: ReturnType<typeof vi.fn>
  copy: ReturnType<typeof vi.fn>
}

// Mock Supabase storage methods
const mockStorageBucket: MockStorageBucket = {
  upload: vi.fn(),
  remove: vi.fn(),
  list: vi.fn(),
  getPublicUrl: vi.fn(),
  createSignedUrl: vi.fn(),
  move: vi.fn(),
  copy: vi.fn()
}

// Mock Supabase client
const mockSupabase = {
  storage: {
    from: vi.fn(() => mockStorageBucket)
  }
}

// Mock the Supabase client creation
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}))

describe('StorageClient', () => {
  let storageClient: StorageClient

  // Test helper functions
  const createMockFile = (name = 'test.txt', content = 'test content', type = 'text/plain') => 
    new File([content], name, { type })

  const mockSuccessfulUpload = (fileName: string, publicUrl?: string) => {
    mockStorageBucket.upload.mockResolvedValue({
      data: { path: fileName },
      error: null
    })
    mockStorageBucket.getPublicUrl.mockReturnValue({
      data: { publicUrl: publicUrl || `https://example.com/${fileName}` }
    })
  }

  const mockFailedOperation = (method: keyof MockStorageBucket, errorMessage: string) => {
    mockStorageBucket[method].mockResolvedValue({
      data: null,
      error: { message: errorMessage }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    storageClient = new StorageClient()
  })

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const mockFile = createMockFile('test.txt', 'test content', 'text/plain')
      const fileName = 'test-file.txt'

      mockSuccessfulUpload(fileName)

      const result = await storageClient.uploadFile(mockFile, fileName)

      expect(result).toEqual({
        url: `https://example.com/${fileName}`,
        fileName,
        size: mockFile.size,
        type: mockFile.type
      })

      expect(mockStorageBucket.upload).toHaveBeenCalledWith(
        fileName,
        expect.any(Uint8Array),
        {
          contentType: mockFile.type,
          upsert: false
        }
      )
    })

    it('should handle upload errors', async () => {
      const mockFile = createMockFile()
      const fileName = 'test-file.txt'

      mockFailedOperation('upload', 'Upload failed')

      await expect(storageClient.uploadFile(mockFile, fileName))
        .rejects.toThrow('File upload failed: Upload failed: Upload failed')
    })

    it('should call progress callback during upload', async () => {
      const mockFile = createMockFile()
      const fileName = 'test-file.txt'
      const progressCallback = vi.fn()

      mockSuccessfulUpload(fileName)

      await storageClient.uploadFile(mockFile, fileName, progressCallback)

      // Progress callback should be called with proper structure
      expect(progressCallback).toHaveBeenCalled()
      const lastCall = progressCallback.mock.calls[progressCallback.mock.calls.length - 1][0]
      expect(lastCall).toMatchObject({
        loaded: expect.any(Number),
        total: mockFile.size,
        percentage: expect.any(Number)
      })
    })
  })

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const fileName = 'test-file.txt'

      mockStorageBucket.remove.mockResolvedValue({
        data: null,
        error: null
      })

      await expect(storageClient.deleteFile(fileName)).resolves.toBeUndefined()

      expect(mockStorageBucket.remove).toHaveBeenCalledWith([fileName])
    })

    it('should handle delete errors', async () => {
      const fileName = 'test-file.txt'

      mockStorageBucket.remove.mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' }
      })

      await expect(storageClient.deleteFile(fileName))
        .rejects.toThrow('Delete failed: Delete failed')
    })
  })

  describe('listFiles', () => {
    it('should list files successfully', async () => {
      const mockFiles = [
        { name: 'file1.txt', created_at: '2023-01-01' },
        { name: 'file2.txt', created_at: '2023-01-02' }
      ]

      mockStorageBucket.list.mockResolvedValue({
        data: mockFiles,
        error: null
      })

      const result = await storageClient.listFiles('folder', 50)

      expect(result).toEqual(mockFiles)
      expect(mockStorageBucket.list).toHaveBeenCalledWith('folder', {
        limit: 50,
        sortBy: { column: 'created_at', order: 'desc' }
      })
    })

    it('should handle list errors', async () => {
      mockStorageBucket.list.mockResolvedValue({
        data: null,
        error: { message: 'List failed' }
      })

      await expect(storageClient.listFiles())
        .rejects.toThrow('List files failed: List failed')
    })
  })

  describe('getSignedUrl', () => {
    it('should generate signed URL successfully', async () => {
      const fileName = 'test-file.txt'
      const signedUrl = 'https://example.com/signed-url'

      mockStorageBucket.createSignedUrl.mockResolvedValue({
        data: { signedUrl },
        error: null
      })

      const result = await storageClient.getSignedUrl(fileName, 7200)

      expect(result).toBe(signedUrl)
      expect(mockStorageBucket.createSignedUrl).toHaveBeenCalledWith(fileName, 7200)
    })

    it('should handle signed URL errors', async () => {
      const fileName = 'test-file.txt'

      mockStorageBucket.createSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'Signed URL failed' }
      })

      await expect(storageClient.getSignedUrl(fileName))
        .rejects.toThrow('Get signed URL failed: Signed URL failed')
    })
  })

  describe('moveFile', () => {
    it('should move file successfully', async () => {
      const fromPath = 'old/file.txt'
      const toPath = 'new/file.txt'

      mockStorageBucket.move.mockResolvedValue({
        data: null,
        error: null
      })

      await expect(storageClient.moveFile(fromPath, toPath)).resolves.toBeUndefined()

      expect(mockStorageBucket.move).toHaveBeenCalledWith(fromPath, toPath)
    })

    it('should handle move errors', async () => {
      const fromPath = 'old/file.txt'
      const toPath = 'new/file.txt'

      mockStorageBucket.move.mockResolvedValue({
        data: null,
        error: { message: 'Move failed' }
      })

      await expect(storageClient.moveFile(fromPath, toPath))
        .rejects.toThrow('Move file failed: Move failed')
    })
  })

  describe('getStorageStats', () => {
    it('should calculate storage statistics', async () => {
      const mockFiles = [
        { 
          name: 'images/file1.jpg', 
          metadata: { size: 1024 } 
        },
        { 
          name: 'images/file2.jpg', 
          metadata: { size: 2048 } 
        },
        { 
          name: 'documents/file3.pdf', 
          metadata: { size: 4096 } 
        }
      ]

      mockStorageBucket.list.mockResolvedValue({
        data: mockFiles,
        error: null
      })

      const stats = await storageClient.getStorageStats()

      expect(stats).toEqual({
        totalFiles: 3,
        totalSize: 7168, // 1024 + 2048 + 4096
        folderStats: {
          images: { files: 2, size: 3072 },
          documents: { files: 1, size: 4096 }
        }
      })
    })

    it('should handle files without metadata', async () => {
      const mockFiles = [
        { name: 'file1.txt' }, // No metadata
        { name: 'file2.txt', metadata: { size: 1024 } }
      ]

      mockStorageBucket.list.mockResolvedValue({
        data: mockFiles,
        error: null
      })

      const stats = await storageClient.getStorageStats()

      expect(stats.totalFiles).toBe(2)
      expect(stats.totalSize).toBe(1024) // Only file with metadata counted
    })
  })

  describe('uploadFiles', () => {
    it('should upload multiple files concurrently', async () => {
      const files = [
        { file: createMockFile('file1.txt'), fileName: 'file1.txt' },
        { file: createMockFile('file2.txt'), fileName: 'file2.txt' }
      ]

      mockSuccessfulUpload('file1.txt')
      mockSuccessfulUpload('file2.txt')

      const results = await storageClient.uploadFiles(files)

      expect(results).toHaveLength(2)
      expect(mockStorageBucket.upload).toHaveBeenCalledTimes(2)
    })

    it('should handle progress callbacks for multiple files', async () => {
      const files = [
        { file: createMockFile('file1.txt'), fileName: 'file1.txt' }
      ]
      const progressCallback = vi.fn()

      mockSuccessfulUpload('file1.txt')

      await storageClient.uploadFiles(files, progressCallback)

      expect(progressCallback).toHaveBeenCalled()
    })
  })

  describe('deleteFiles', () => {
    it('should delete multiple files', async () => {
      const fileNames = ['file1.txt', 'file2.txt']

      mockStorageBucket.remove.mockResolvedValue({
        data: null,
        error: null
      })

      await expect(storageClient.deleteFiles(fileNames)).resolves.toBeUndefined()

      expect(mockStorageBucket.remove).toHaveBeenCalledWith(fileNames)
    })

    it('should handle bulk delete errors', async () => {
      const fileNames = ['file1.txt', 'file2.txt']

      mockFailedOperation('remove', 'Bulk delete failed')

      await expect(storageClient.deleteFiles(fileNames))
        .rejects.toThrow('Bulk delete failed: Bulk delete failed')
    })
  })

  describe('getFileMetadata', () => {
    it('should get file metadata successfully', async () => {
      const fileName = 'test-file.txt'
      const mockMetadata = { name: fileName, size: 1024, created_at: '2023-01-01' }

      mockStorageBucket.list.mockResolvedValue({
        data: [mockMetadata],
        error: null
      })

      const result = await storageClient.getFileMetadata(fileName)

      expect(result).toEqual(mockMetadata)
      expect(mockStorageBucket.list).toHaveBeenCalledWith('', {
        search: fileName
      })
    })

    it('should return null when file not found', async () => {
      const fileName = 'nonexistent.txt'

      mockStorageBucket.list.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await storageClient.getFileMetadata(fileName)

      expect(result).toBeNull()
    })
  })

  describe('copyFile', () => {
    it('should copy file successfully', async () => {
      const fromPath = 'source/file.txt'
      const toPath = 'destination/file.txt'

      mockStorageBucket.copy.mockResolvedValue({
        data: null,
        error: null
      })

      await expect(storageClient.copyFile(fromPath, toPath)).resolves.toBeUndefined()

      expect(mockStorageBucket.copy).toHaveBeenCalledWith(fromPath, toPath)
    })

    it('should handle copy errors', async () => {
      const fromPath = 'source/file.txt'
      const toPath = 'destination/file.txt'

      mockFailedOperation('copy', 'Copy failed')

      await expect(storageClient.copyFile(fromPath, toPath))
        .rejects.toThrow('Copy file failed: Copy failed')
    })
  })
})