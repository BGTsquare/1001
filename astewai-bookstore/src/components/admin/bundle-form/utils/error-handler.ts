import { ZodError } from 'zod'
import type { ValidationErrors } from '../types'

export class BundleFormError extends Error {
  constructor(
    message: string,
    public code: string,
    public field?: string
  ) {
    super(message)
    this.name = 'BundleFormError'
  }
}

export function handleValidationError(error: ZodError): ValidationErrors {
  const errors: ValidationErrors = {}
  
  error.errors.forEach((err) => {
    const path = err.path.join('.')
    errors[path] = err.message
  })
  
  return errors
}

export function handleUploadError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('413')) {
      return 'File too large. Please choose a smaller file.'
    }
    if (error.message.includes('415')) {
      return 'Unsupported file type. Please choose a valid file.'
    }
    if (error.message.includes('network')) {
      return 'Network error. Please check your connection and try again.'
    }
    return error.message
  }
  
  return 'An unexpected error occurred. Please try again.'
}

export function handleApiError(error: unknown): string {
  if (error instanceof Response) {
    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input.'
      case 401:
        return 'You are not authorized to perform this action.'
      case 403:
        return 'Access denied. Please contact an administrator.'
      case 413:
        return 'Request too large. Please reduce file sizes.'
      case 429:
        return 'Too many requests. Please wait and try again.'
      case 500:
        return 'Server error. Please try again later.'
      default:
        return 'An error occurred. Please try again.'
    }
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred. Please try again.'
}