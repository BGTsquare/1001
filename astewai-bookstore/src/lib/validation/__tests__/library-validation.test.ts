import { describe, it, expect } from 'vitest'
import {
  validateProgress,
  validateLibraryStatus,
  validateUserLibrary,
  validateLibraryUpdate,
  LibraryValidationError
} from '../library-validation'
import type { UserLibrary } from '@/types'

describe('Library Validation', () => {
  describe('validateProgress', () => {
    it('should validate correct progress values', () => {
      const validValues = [0, 25, 50, 75, 100]
      
      validValues.forEach(progress => {
        const result = validateProgress(progress)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    it('should reject non-number values', () => {
      const result = validateProgress('50' as any)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Progress must be a number')
    })

    it('should reject negative values', () => {
      const result = validateProgress(-10)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Progress cannot be negative')
    })

    it('should reject values over 100', () => {
      const result = validateProgress(150)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Progress cannot exceed 100')
    })

    it('should reject non-integer values', () => {
      const result = validateProgress(50.5)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Progress must be a whole number')
    })

    it('should return multiple errors for invalid values', () => {
      const result = validateProgress(-10.5)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Progress cannot be negative')
      expect(result.errors).toContain('Progress must be a whole number')
    })
  })

  describe('validateLibraryStatus', () => {
    it('should validate correct status values', () => {
      const validStatuses = ['owned', 'pending', 'completed']
      
      validStatuses.forEach(status => {
        const result = validateLibraryStatus(status)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    it('should reject non-string values', () => {
      const result = validateLibraryStatus(123 as any)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Status must be a string')
    })

    it('should reject invalid status values', () => {
      const result = validateLibraryStatus('invalid')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Status must be one of: owned, pending, completed')
    })

    it('should be case sensitive', () => {
      const result = validateLibraryStatus('OWNED')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Status must be one of: owned, pending, completed')
    })
  })

  describe('validateUserLibrary', () => {
    const validLibraryEntry: Partial<UserLibrary> = {
      user_id: 'user-123',
      book_id: 'book-456',
      status: 'owned',
      progress: 50,
      last_read_position: 'chapter-3'
    }

    it('should validate complete valid library entry', () => {
      const result = validateUserLibrary(validLibraryEntry)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate minimal valid library entry', () => {
      const minimalEntry = {
        user_id: 'user-123',
        book_id: 'book-456'
      }
      const result = validateUserLibrary(minimalEntry)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should require user_id', () => {
      const entry = { ...validLibraryEntry }
      delete entry.user_id
      
      const result = validateUserLibrary(entry)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('User ID is required')
    })

    it('should require book_id', () => {
      const entry = { ...validLibraryEntry }
      delete entry.book_id
      
      const result = validateUserLibrary(entry)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Book ID is required')
    })

    it('should validate user_id is string', () => {
      const entry = { ...validLibraryEntry, user_id: 123 as any }
      
      const result = validateUserLibrary(entry)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('User ID must be a string')
    })

    it('should validate book_id is string', () => {
      const entry = { ...validLibraryEntry, book_id: 456 as any }
      
      const result = validateUserLibrary(entry)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Book ID must be a string')
    })

    it('should validate status when provided', () => {
      const entry = { ...validLibraryEntry, status: 'invalid' as any }
      
      const result = validateUserLibrary(entry)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Status must be one of: owned, pending, completed')
    })

    it('should validate progress when provided', () => {
      const entry = { ...validLibraryEntry, progress: 150 }
      
      const result = validateUserLibrary(entry)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Progress cannot exceed 100')
    })

    it('should validate last_read_position when provided', () => {
      const entry = { ...validLibraryEntry, last_read_position: 123 as any }
      
      const result = validateUserLibrary(entry)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Last read position must be a string')
    })

    it('should allow null last_read_position', () => {
      const entry = { ...validLibraryEntry, last_read_position: null }
      
      const result = validateUserLibrary(entry)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return multiple errors for multiple invalid fields', () => {
      const entry = {
        user_id: 123 as any,
        book_id: 456 as any,
        status: 'invalid' as any,
        progress: 150,
        last_read_position: 789 as any
      }
      
      const result = validateUserLibrary(entry)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      expect(result.errors).toContain('User ID must be a string')
      expect(result.errors).toContain('Book ID must be a string')
      expect(result.errors).toContain('Status must be one of: owned, pending, completed')
      expect(result.errors).toContain('Progress cannot exceed 100')
      expect(result.errors).toContain('Last read position must be a string')
    })
  })

  describe('validateLibraryUpdate', () => {
    it('should validate status update', () => {
      const update = { status: 'completed' as const }
      
      const result = validateLibraryUpdate(update)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate progress update', () => {
      const update = { progress: 75 }
      
      const result = validateLibraryUpdate(update)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate last_read_position update', () => {
      const update = { last_read_position: 'chapter-5' }
      
      const result = validateLibraryUpdate(update)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate multiple field updates', () => {
      const update = {
        status: 'completed' as const,
        progress: 100,
        last_read_position: 'end'
      }
      
      const result = validateLibraryUpdate(update)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should require at least one field for update', () => {
      const update = {}
      
      const result = validateLibraryUpdate(update)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('At least one field must be provided for update')
    })

    it('should validate status field when provided', () => {
      const update = { status: 'invalid' as any }
      
      const result = validateLibraryUpdate(update)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Status must be one of: owned, pending, completed')
    })

    it('should validate progress field when provided', () => {
      const update = { progress: -10 }
      
      const result = validateLibraryUpdate(update)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Progress cannot be negative')
    })

    it('should validate last_read_position field when provided', () => {
      const update = { last_read_position: 123 as any }
      
      const result = validateLibraryUpdate(update)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Last read position must be a string')
    })

    it('should allow null last_read_position', () => {
      const update = { last_read_position: null }
      
      const result = validateLibraryUpdate(update)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle progress value of 0', () => {
      const update = { progress: 0 }
      
      const result = validateLibraryUpdate(update)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return multiple errors for multiple invalid fields', () => {
      const update = {
        status: 'invalid' as any,
        progress: 150,
        last_read_position: 123 as any
      }
      
      const result = validateLibraryUpdate(update)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      expect(result.errors).toContain('Status must be one of: owned, pending, completed')
      expect(result.errors).toContain('Progress cannot exceed 100')
      expect(result.errors).toContain('Last read position must be a string')
    })
  })

  describe('LibraryValidationError', () => {
    it('should create error with message only', () => {
      const error = new LibraryValidationError('Test error')
      
      expect(error.message).toBe('Test error')
      expect(error.name).toBe('LibraryValidationError')
      expect(error.field).toBeUndefined()
      expect(error.code).toBeUndefined()
    })

    it('should create error with field and code', () => {
      const error = new LibraryValidationError('Test error', 'progress', 'INVALID_PROGRESS')
      
      expect(error.message).toBe('Test error')
      expect(error.name).toBe('LibraryValidationError')
      expect(error.field).toBe('progress')
      expect(error.code).toBe('INVALID_PROGRESS')
    })

    it('should be instance of Error', () => {
      const error = new LibraryValidationError('Test error')
      
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(LibraryValidationError)
    })
  })
})