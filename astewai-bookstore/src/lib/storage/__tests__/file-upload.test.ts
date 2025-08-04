import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FileUploadService } from '../file-upload'

// Mock dependencies
vi.mock('../file-validation', () => ({
  validateFile: vi.fn(() => ({ isValid: true, errors: [] })),
  generateUniqueFileName: vi.fn((name) => `unique-${name}`)
}))

vi.mock('../image-processing', () => ({
  optimizeImage: vi.fn((file) => Promise.resolve(file)),
  createThumbnail: vi.fn((file) => Promise.resolve(new File(['thumb'], 'thumb.jpg', { type: 'image/jpeg' })))
}))

vi.mock('../storage-client', () => ({
  StorageClient: vi.fn(() => ({
    uploadFile: vi.fn(() => Promise.resolve({
      url: 'https://example.com/file.jpg',
      fileName: 'unique-file.jpg',
      size: 1024,
      type: 'image/jpeg'
    })),
    deleteFiles: vi.fn(() => Promise.resolve())
  }))
}))

describe('FileUploadService', () => {
  let fileUploadService: FileUploadService
  let mockValidateFile: any
  let mockOptimizeImage: any
  let mockCreateThumbnail: any
  let mockStorageClient: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Import mocked modules
    const { validateFile } = await import('../file-validation')
    const { optimizeImage, createThumbnail } = await import('../image-processing')
    const { StorageClient } = await import('../storage-client')
    
    mockValidateFile = validateFile as any
    mockOptimizeImage = optimizeImage as any
    mockCreateThumbnail = createThumbnail as any
    mockStorageClient = new StorageClient()
    
    fileUploadService = new FileUploadService()
  })

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      
      const result = await fileUploadService.uploadFile(mockFile, 'image')

      expect(result).toEqual({
        url: 'https://example.com/file.jpg',
        fileName: 'unique-file.jpg',
        size: 1024,
        type: 'image/jpeg'
      })

      expect(mockValidateFile).toHaveBeenCalledWith(mockFile, 'image', {
        maxSize: undefined,
        allowedTypes: undefined
      })
    })

    it('should reject invalid files', async () => {
      const mockFile = new File(['test content'], 'test.exe', { type: 'application/x-executable' })
      
      mockValidateFile.mockReturnValue({
        isValid: false,
        errors: ['File type not allowed']
      })

      await expect(fileUploadService.uploadFile(mockFile, 'image'))
        .rejects.toThrow('File validation failed: File type not allowed')
    })

    it('should optimize images when requested', async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const optimizedFile = new File(['optimized content'], 'test.webp', { type: 'image/webp' })
      
      mockOptimizeImage.mockResolvedValue(optimizedFile)

      await fileUploadService.uploadFile(mockFile, 'image', { optimizeImage: true })

      expect(mockOptimizeImage).toHaveBeenCalledWith(mockFile, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        format: 'webp'
      })
    })

    it('should generate thumbnails when requested', async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      
      await fileUploadService.uploadFile(mockFile, 'image', { generateThumbnail: true })

      expect(mockCreateThumbnail).toHaveBeenCalledWith(mockFile, 200)
    })

    it('should handle optimization errors gracefully', async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      
      mockOptimizeImage.mockRejectedValue(new Error('Optimization failed'))

      // Should not throw, should use original file
      const result = await fileUploadService.uploadFile(mockFile, 'image', { optimizeImage: true })

      expect(result).toBeDefined()
    })

    it('should call progress callback', async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const progressCallback = vi.fn()

      await fileUploadService.uploadFile(mockFile, 'image', {}, progressCallback)

      expect(mockStorageClient.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'unique-test.jpg',
        progressCallback
      )
    })

    it('should include folder in file path', async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      
      await fileUploadService.uploadFile(mockFile, 'image', { folder: 'uploads' })

      // The generateUniqueFileName mock should be called with folder
      const { generateUniqueFileName } = await import('../file-validation')
      expect(generateUniqueFileName).toHaveBeenCalledWith(mockFile.name, 'uploads')
    })
  })

  describe('uploadFiles', () => {
    it('should upload multiple files', async () => {
      const files = [
        { file: new File(['content1'], 'file1.jpg', { type: 'image/jpeg' }), fileType: 'image' as const },
        { file: new File(['content2'], 'file2.jpg', { type: 'image/jpeg' }), fileType: 'image' as const }
      ]

      const results = await fileUploadService.uploadFiles(files)

      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({
        url: 'https://example.com/file.jpg',
        fileName: 'unique-file.jpg',
        size: 1024,
        type: 'image/jpeg'
      })
    })

    it('should handle upload failures in batch', async () => {
      const files = [
        { file: new File(['content1'], 'file1.jpg', { type: 'image/jpeg' }), fileType: 'image' as const }
      ]

      mockValidateFile.mockReturnValue({
        isValid: false,
        errors: ['Invalid file']
      })

      await expect(fileUploadService.uploadFiles(files))
        .rejects.toThrow('Failed to upload file 1: File validation failed: Invalid file')
    })
  })

  describe('replaceFile', () => {
    it('should replace file successfully', async () => {
      const oldFileName = 'old-file.jpg'
      const newFile = new File(['new content'], 'new.jpg', { type: 'image/jpeg' })

      mockStorageClient.deleteFile = vi.fn()

      const result = await fileUploadService.replaceFile(oldFileName, newFile, 'image')

      expect(result).toEqual({
        url: 'https://example.com/file.jpg',
        fileName: 'unique-file.jpg',
        size: 1024,
        type: 'image/jpeg'
      })

      expect(mockStorageClient.deleteFile).toHaveBeenCalledWith(oldFileName)
    })

    it('should handle delete errors gracefully', async () => {
      const oldFileName = 'old-file.jpg'
      const newFile = new File(['new content'], 'new.jpg', { type: 'image/jpeg' })

      mockStorageClient.deleteFile = vi.fn().mockRejectedValue(new Error('Delete failed'))

      // Should still succeed even if delete fails
      const result = await fileUploadService.replaceFile(oldFileName, newFile, 'image')

      expect(result).toBeDefined()
    })
  })

  describe('deleteFile', () => {
    it('should delete file and thumbnail', async () => {
      const fileName = 'file.jpg'
      const thumbnailFileName = 'thumb.jpg'

      mockStorageClient.deleteFiles = vi.fn()

      await fileUploadService.deleteFile(fileName, thumbnailFileName)

      expect(mockStorageClient.deleteFiles).toHaveBeenCalledWith([fileName, thumbnailFileName])
    })

    it('should delete only main file when no thumbnail', async () => {
      const fileName = 'file.jpg'

      mockStorageClient.deleteFiles = vi.fn()

      await fileUploadService.deleteFile(fileName)

      expect(mockStorageClient.deleteFiles).toHaveBeenCalledWith([fileName])
    })
  })

  describe('createProgressTracker', () => {
    it('should track progress correctly', () => {
      const tracker = fileUploadService.createProgressTracker()

      const progress = { loaded: 50, total: 100, percentage: 50 }
      tracker.onProgress(progress)

      expect(tracker.getProgress()).toEqual(progress)
    })
  })
})