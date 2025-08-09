import { NextResponse } from 'next/server'

export interface ApiError {
  error: string
  details?: string
  validationErrors?: Array<{ field: string; message: string }>
}

export interface ApiSuccess<T = any> {
  data: T
  message?: string
}

/**
 * Standardized API response utilities
 */
export class ApiResponse {
  /**
   * Success response
   */
  static success<T>(data: T, message?: string, status = 200): NextResponse {
    const response: ApiSuccess<T> = { data }
    if (message) response.message = message
    
    return NextResponse.json(response, { status })
  }

  /**
   * Created response (201)
   */
  static created<T>(data: T, message?: string): NextResponse {
    return this.success(data, message, 201)
  }

  /**
   * Bad request error (400)
   */
  static badRequest(error: string, details?: string, validationErrors?: Array<{ field: string; message: string }>): NextResponse {
    const response: ApiError = { error }
    if (details) response.details = details
    if (validationErrors) response.validationErrors = validationErrors
    
    return NextResponse.json(response, { status: 400 })
  }

  /**
   * Unauthorized error (401)
   */
  static unauthorized(error = 'Unauthorized', details?: string): NextResponse {
    const response: ApiError = { error }
    if (details) response.details = details
    
    return NextResponse.json(response, { status: 401 })
  }

  /**
   * Forbidden error (403)
   */
  static forbidden(error = 'Forbidden', details?: string): NextResponse {
    const response: ApiError = { error }
    if (details) response.details = details
    
    return NextResponse.json(response, { status: 403 })
  }

  /**
   * Not found error (404)
   */
  static notFound(error = 'Not found', details?: string): NextResponse {
    const response: ApiError = { error }
    if (details) response.details = details
    
    return NextResponse.json(response, { status: 404 })
  }

  /**
   * Conflict error (409)
   */
  static conflict(error: string, details?: string): NextResponse {
    const response: ApiError = { error }
    if (details) response.details = details
    
    return NextResponse.json(response, { status: 409 })
  }

  /**
   * Internal server error (500)
   */
  static internalError(error = 'Internal server error', details?: string): NextResponse {
    const response: ApiError = { error }
    if (details) response.details = details
    
    return NextResponse.json(response, { status: 500 })
  }

  /**
   * Handle service result pattern
   */
  static fromServiceResult<T>(result: { success: boolean; data?: T; error?: string; validationErrors?: Array<{ field: string; message: string }> }): NextResponse {
    if (result.success && result.data !== undefined) {
      return this.success(result.data)
    }
    
    return this.badRequest(
      result.error || 'Operation failed',
      undefined,
      result.validationErrors
    )
  }
}

/**
 * Error handler wrapper for API routes
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      console.error('API route error:', error)
      
      if (error instanceof Error) {
        return ApiResponse.internalError('Internal server error', error.message)
      }
      
      return ApiResponse.internalError()
    }
  }
}