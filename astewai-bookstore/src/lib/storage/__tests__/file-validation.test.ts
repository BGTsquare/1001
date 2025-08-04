import { describe, it, expect } from 'vitest'
import { validateFile, sanitizeFileName, generateUniqueFileName } from '../file-validation'
import { FileType } from '../types'

// Mock File constructor for testing
class MockFile extends File {
  constructor(
    bits: BlobPart[],
    name: string,
    options?: FilePropertyBag & { size?: number }
  ) {
    super(bits, name, options)
    if (options?.size !== undefined) {
      Object.defineProperty(this, 'size', { value: options.size })
    }
  }
}

describe('file-validation', () => {
  describe('validateFile', () => {
    it('should validate image files correctly', () => {
      const validImageFile = new MockFile(
        ['test content'],
        'test.jpg',
        { type: 'image/jpeg', size: 1024 * 1024 } // 1MB
      )

      const result = validateFile(validImageFile, 'image')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject oversized image files', () => {
      const oversizedFile = new MockFile(
        ['test content'],
        'large.jpg',
        { type: 'image/jpeg', size: 10 * 1024 * 1024 } // 10MB (over 5MB limit)
      )

      const result = validateFile(oversizedFile, 'image')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('File size must be less than 5MB')
    })

    it('should reject invalid file types for images', () => {
      const invalidFile = new MockFile(
        ['test content'],
        'test.exe',
        { type: 'application/x-executable', size: 1024 }
      )

      const result = validateFile(invalidFile, 'image')
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('not allowed'))).toBe(true)
    })

    it('should validate book files correctly', () => {
      const validBookFile = new MockFile(
        ['test content'],
        'book.pdf',
        { type: 'application/pdf', size: 10 * 1024 * 1024 } // 10MB
      )

      const result = validateFile(validBookFile, 'book')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty files', () => {
      const emptyFile = new MockFile(
        [],
        'empty.txt',
        { type: 'text/plain', size: 0 }
      )

      const result = validateFile(emptyFile, 'document')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('File cannot be empty')
    })

    it('should reject files with suspicious names', () => {
      const suspiciousFile = new MockFile(
        ['test content'],
        '../../../etc/passwd',
        { type: 'text/plain', size: 1024 }
      )

      const result = validateFile(suspiciousFile, 'document')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('File name contains suspicious characters')
    })

    it('should use custom validation options', () => {
      const file = new MockFile(
        ['test content'],
        'test.txt',
        { type: 'text/plain', size: 2 * 1024 * 1024 } // 2MB
      )

      const result = validateFile(file, 'document', {
        maxSize: 1024 * 1024, // 1MB limit
        allowedTypes: ['text/plain']
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('File size must be less than 1MB')
    })
  })

  describe('sanitizeFileName', () => {
    it('should sanitize unsafe characters', () => {
      const unsafeName = 'test<>:"|?*file.txt'
      const sanitized = sanitizeFileName(unsafeName)
      expect(sanitized).toBe('test_file.txt')
    })

    it('should handle multiple underscores', () => {
      const name = 'test___file___name.txt'
      const sanitized = sanitizeFileName(name)
      expect(sanitized).toBe('test_file_name.txt')
    })

    it('should remove leading and trailing underscores', () => {
      const name = '___test_file___.txt'
      const sanitized = sanitizeFileName(name)
      expect(sanitized).toBe('test_file.txt')
    })

    it('should convert to lowercase', () => {
      const name = 'TEST_FILE.TXT'
      const sanitized = sanitizeFileName(name)
      expect(sanitized).toBe('test_file.txt')
    })
  })

  describe('generateUniqueFileName', () => {
    it('should generate unique filename with timestamp', () => {
      const originalName = 'test.jpg'
      const uniqueName = generateUniqueFileName(originalName)
      
      expect(uniqueName).toMatch(/^\d+-[a-z0-9]+-test\.jpg$/)
    })

    it('should include folder in path', () => {
      const originalName = 'test.jpg'
      const folder = 'images'
      const uniqueName = generateUniqueFileName(originalName, folder)
      
      expect(uniqueName).toMatch(/^images\/\d+-[a-z0-9]+-test\.jpg$/)
    })

    it('should handle files without extensions', () => {
      const originalName = 'testfile'
      const uniqueName = generateUniqueFileName(originalName)
      
      expect(uniqueName).toMatch(/^\d+-[a-z0-9]+-testfile$/)
    })

    it('should sanitize the original name', () => {
      const originalName = 'test<>file.jpg'
      const uniqueName = generateUniqueFileName(originalName)
      
      expect(uniqueName).toMatch(/^\d+-[a-z0-9]+-test_file\.jpg$/)
    })
  })
})