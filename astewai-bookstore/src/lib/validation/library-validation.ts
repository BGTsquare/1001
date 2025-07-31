import type { UserLibrary } from '@/types'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface ValidationError extends Error {
  field?: string | undefined
  code?: string | undefined
}

export class LibraryValidationError extends Error implements ValidationError {
  field?: string | undefined
  code?: string | undefined

  constructor(message: string, field?: string, code?: string) {
    super(message)
    this.name = 'LibraryValidationError'
    this.field = field
    this.code = code
  }
}

/**
 * Validate reading progress value
 */
export function validateProgress(progress: number): ValidationResult {
  const errors: string[] = []

  if (typeof progress !== 'number') {
    errors.push('Progress must be a number')
  } else {
    if (progress < 0) {
      errors.push('Progress cannot be negative')
    }
    if (progress > 100) {
      errors.push('Progress cannot exceed 100')
    }
    if (!Number.isInteger(progress)) {
      errors.push('Progress must be a whole number')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate library status
 */
export function validateLibraryStatus(status: string): ValidationResult {
  const errors: string[] = []
  const validStatuses = ['owned', 'pending', 'completed']

  if (typeof status !== 'string') {
    errors.push('Status must be a string')
  } else if (!validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate user library entry
 */
export function validateUserLibrary(library: Partial<UserLibrary>): ValidationResult {
  const errors: string[] = []

  // Validate required fields
  if (!library.user_id) {
    errors.push('User ID is required')
  } else if (typeof library.user_id !== 'string') {
    errors.push('User ID must be a string')
  }

  if (!library.book_id) {
    errors.push('Book ID is required')
  } else if (typeof library.book_id !== 'string') {
    errors.push('Book ID must be a string')
  }

  // Validate status if provided
  if (library.status !== undefined) {
    const statusValidation = validateLibraryStatus(library.status)
    if (!statusValidation.isValid) {
      errors.push(...statusValidation.errors)
    }
  }

  // Validate progress if provided
  if (library.progress !== undefined) {
    const progressValidation = validateProgress(library.progress)
    if (!progressValidation.isValid) {
      errors.push(...progressValidation.errors)
    }
  }

  // Validate last_read_position if provided
  if (library.last_read_position !== undefined && library.last_read_position !== null) {
    if (typeof library.last_read_position !== 'string') {
      errors.push('Last read position must be a string')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate library update data
 */
export function validateLibraryUpdate(updates: Partial<Pick<UserLibrary, 'status' | 'progress' | 'last_read_position'>>): ValidationResult {
  const errors: string[] = []

  // At least one field must be provided for update
  if (!updates.status && updates.progress === undefined && updates.last_read_position === undefined) {
    errors.push('At least one field must be provided for update')
  }

  // Validate individual fields if provided
  if (updates.status !== undefined) {
    const statusValidation = validateLibraryStatus(updates.status)
    if (!statusValidation.isValid) {
      errors.push(...statusValidation.errors)
    }
  }

  if (updates.progress !== undefined) {
    const progressValidation = validateProgress(updates.progress)
    if (!progressValidation.isValid) {
      errors.push(...progressValidation.errors)
    }
  }

  if (updates.last_read_position !== undefined && updates.last_read_position !== null) {
    if (typeof updates.last_read_position !== 'string') {
      errors.push('Last read position must be a string')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}