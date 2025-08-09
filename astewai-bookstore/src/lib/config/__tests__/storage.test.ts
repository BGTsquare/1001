import { describe, it, expect } from 'vitest'
import {
  BUCKET_CONFIGS,
  STORAGE_LIMITS,
  BUCKET_NAMES,
  MIME_TYPES,
  validateFile,
  FileUtils,
  type BucketConfig,
  type FileValidationOptions
} from '../storage'

describe('Storage Configuration', () => {
  describe('BUCKET_CONFIGS', () => {
    it('should have all required bucket configurations', () => {
      expect(BUCKET_CONFIGS.BOOK_COVERS).toBeDefined()
      expect(BUCKET_CONFIGS.BOOK_CONTENT).toBeDefined()
      expect(BUCKET_CONFIGS.BLOG_IMAGES).toBeDefined()
      expect(BUCKET_CONFIGS.AVATARS).toBeDefined()
    })

    it('should have correct bucket properties', () => {
      const bookCovers = BUCKET_CONFIGS.BOOK_COVERS
      expect(bookCovers.name).toBe('book-covers')
      expect(bookCovers.isPublic).toBe(true)
      expect(bookCovers.maxFileSize).toBe(10 * 1024 * 1024) // 10MB
      expect(bookCovers.allowedMimeTypes).toEqual(MIME_TYPES.IMAGES)
    })

    it('should have private bucket for book content', () => {
      expect(BUCKET_CONFIGS.BOOK_CONTENT.isPublic).toBe(false)
    })
  })

  describe('MIME_TYPES', () => {
    it('should contain valid image MIME types', () => {
      expect(MIME_TYPES.IMAGES).toContain('image/jpeg')
      expect(MIME_TYPES.IMAGES).toContain('image/png')
      expect(MIME_TYPES.IMAGES).toContain('image/webp')
      expect(MIME_TYPES.IMAGES).toContain('image/gif')
    })

    it('should contain valid document MIME types', () => {
      expect(MIME_TYPES.DOCUMENTS).toContain('application/pdf')
      expect(MIME_TYPES.DOCUMENTS).toContain('application/epub+zip')
    })
  })

  describe('validateFile', () => {
    const mockBucketConfig: BucketConfig = {
      name: 'test-bucket',
      isPublic: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png'],
      description: 'Test bucket'
    }

    it('should validate a valid file', () => {
      const validFile = {
        size: 2 * 1024 * 1024, // 2MB
        type: 'image/jpeg',
        name: 'test-image.jpg'
      }

      const result = validateFile({ bucketConfig: mockBucketConfig, file: validFile })
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject file that exceeds size limit', () => {
      const oversizedFile = {
        size: 10 * 1024 * 1024, // 10MB
        type: 'image/jpeg',
        name: 'large-image.jpg'
      }

      const result = validateFile({ bucketConfig: mockBucketConfig, file: oversizedFile })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('exceeds maximum allowed size'))
    })

    it('should reject file with invalid MIME type', () => {
      const invalidTypeFile = {
        size: 1 * 1024 * 1024, // 1MB
        type: 'application/pdf',
        name: 'document.pdf'
      }

      const result = validateFile({ bucketConfig: mockBucketConfig, file: invalidTypeFile })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('is not allowed'))
    })

    it('should reject file with empty name', () => {
      const noNameFile = {
        size: 1 * 1024 * 1024,
        type: 'image/jpeg',
        name: ''
      }

      const result = validateFile({ bucketConfig: mockBucketConfig, file: noNameFile })
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Filename cannot be empty')
    })
  })

  describe('FileUtils', () => {
    describe('sanitizeFilename', () => {
      it('should sanitize special characters', () => {
        expect(FileUtils.sanitizeFilename('file@#$%name.jpg')).toBe('file____name.jpg')
      })

      it('should convert to lowercase', () => {
        expect(FileUtils.sanitizeFilename('MyFile.JPG')).toBe('myfile.jpg')
      })

      it('should remove leading/trailing underscores', () => {
        expect(FileUtils.sanitizeFilename('_file_')).toBe('file')
      })

      it('should collapse multiple underscores', () => {
        expect(FileUtils.sanitizeFilename('file___name')).toBe('file_name')
      })
    })

    describe('getFileExtension', () => {
      it('should extract file extension', () => {
        expect(FileUtils.getFileExtension('image.jpg')).toBe('jpg')
        expect(FileUtils.getFileExtension('document.pdf')).toBe('pdf')
      })

      it('should handle files without extension', () => {
        expect(FileUtils.getFileExtension('filename')).toBe('')
      })

      it('should handle multiple dots', () => {
        expect(FileUtils.getFileExtension('file.name.jpg')).toBe('jpg')
      })
    })

    describe('generateUniqueFilename', () => {
      it('should generate unique filename with timestamp', () => {
        const original = 'test-file.jpg'
        const unique = FileUtils.generateUniqueFilename(original)
        
        expect(unique).toMatch(/^\d+-test-file\.jpg$/)
        expect(unique).not.toBe(original)
      })

      it('should handle files without extension', () => {
        const original = 'testfile'
        const unique = FileUtils.generateUniqueFilename(original)
        
        expect(unique).toMatch(/^\d+-testfile$/)
      })
    })

    describe('formatFileSize', () => {
      it('should format bytes correctly', () => {
        expect(FileUtils.formatFileSize(0)).toBe('0 Bytes')
        expect(FileUtils.formatFileSize(1024)).toBe('1 KB')
        expect(FileUtils.formatFileSize(1024 * 1024)).toBe('1 MB')
        expect(FileUtils.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
      })

      it('should handle decimal values', () => {
        expect(FileUtils.formatFileSize(1536)).toBe('1.5 KB') // 1.5KB
        expect(FileUtils.formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB')
      })
    })

    describe('generateStoragePath', () => {
      it('should generate organized storage path', () => {
        const path = FileUtils.generateStoragePath('books', 'covers', 'image.jpg')
        expect(path).toBe('covers/image.jpg')
      })

      it('should sanitize path components', () => {
        const path = FileUtils.generateStoragePath('books', 'Book Covers!', 'My Image@.jpg')
        expect(path).toBe('book_covers_/my_image_.jpg')
      })
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain STORAGE_LIMITS for legacy code', () => {
      expect(STORAGE_LIMITS.MAX_FILE_SIZE).toBeDefined()
      expect(STORAGE_LIMITS.MAX_COVER_SIZE).toBeDefined()
      expect(STORAGE_LIMITS.MAX_CONTENT_SIZE).toBeDefined()
      expect(STORAGE_LIMITS.MAX_AVATAR_SIZE).toBeDefined()
      expect(STORAGE_LIMITS.MAX_BLOG_IMAGE_SIZE).toBeDefined()
    })

    it('should maintain BUCKET_NAMES for legacy code', () => {
      expect(BUCKET_NAMES.BOOK_COVERS).toBe('book-covers')
      expect(BUCKET_NAMES.BOOK_CONTENT).toBe('book-content')
      expect(BUCKET_NAMES.BLOG_IMAGES).toBe('blog-images')
      expect(BUCKET_NAMES.AVATARS).toBe('avatars')
    })
  })
})