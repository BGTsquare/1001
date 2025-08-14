/**
 * Standardized error handling utilities for the application
 */

export interface ServiceError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

export interface ServiceResult<T = any> {
  success: boolean
  data?: T
  error?: ServiceError
}

export class DatabaseError extends Error {
  public readonly code: string
  public readonly details?: any

  constructor(code: string, message: string, details?: any) {
    super(message)
    this.name = 'DatabaseError'
    this.code = code
    this.details = details
  }
}

export class ValidationError extends Error {
  public readonly field?: string
  public readonly details?: any

  constructor(message: string, field?: string, details?: any) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
    this.details = details
  }
}

/**
 * Creates a success result
 */
export function createSuccessResult<T>(data: T): ServiceResult<T> {
  return {
    success: true,
    data
  }
}

/**
 * Creates an error result
 */
export function createErrorResult(code: string, message: string, details?: any): ServiceResult {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date()
    }
  }
}

/**
 * Handles database errors and converts them to ServiceResult
 */
export function handleDatabaseError(error: any, operation: string): ServiceResult {
  console.error(`Database error in ${operation}:`, error)

  // Handle specific Supabase error codes
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116':
        return createErrorResult('NOT_FOUND', 'Resource not found')
      case '23505':
        return createErrorResult('DUPLICATE_KEY', 'Resource already exists')
      case '23503':
        return createErrorResult('FOREIGN_KEY_VIOLATION', 'Referenced resource does not exist')
      case '42501':
        return createErrorResult('INSUFFICIENT_PRIVILEGE', 'Insufficient permissions')
      default:
        return createErrorResult('DATABASE_ERROR', error.message || 'Database operation failed', error)
    }
  }

  // Handle generic errors
  if (error instanceof DatabaseError) {
    return createErrorResult(error.code, error.message, error.details)
  }

  if (error instanceof ValidationError) {
    return createErrorResult('VALIDATION_ERROR', error.message, { field: error.field, details: error.details })
  }

  // Fallback for unknown errors
  return createErrorResult('UNKNOWN_ERROR', 'An unexpected error occurred', error)
}

/**
 * Wraps async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<ServiceResult<T>> {
  try {
    const result = await operation()
    return createSuccessResult(result)
  } catch (error) {
    return handleDatabaseError(error, operationName)
  }
}

/**
 * Validates required fields
 */
export function validateRequired(data: Record<string, any>, requiredFields: string[]): void {
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new ValidationError(`${field} is required`, field)
    }
  }
}

/**
 * Validates UUID format
 */
export function validateUUID(value: string, fieldName: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(value)) {
    throw new ValidationError(`${fieldName} must be a valid UUID`, fieldName)
  }
}

/**
 * Validates email format
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email')
  }
}

/**
 * Logs errors with context
 */
export function logError(error: any, context: string, additionalData?: any): void {
  const errorInfo = {
    context,
    error: {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    },
    timestamp: new Date().toISOString(),
    ...additionalData
  }

  console.error('Application Error:', JSON.stringify(errorInfo, null, 2))
}