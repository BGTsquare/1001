import { NextResponse } from 'next/server'

/**
 * Standardized API error handler
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  console.error(`Error ${context}:`, error)
  
  // Handle known error types
  if (error instanceof Error) {
    // Check for specific error types that should return different status codes
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    if (error.name === 'NotFoundError') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }
    
    if (error.name === 'UnauthorizedError') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
  }

  // Default to 500 for unknown errors
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}

/**
 * Standardized success response helper
 */
export function createSuccessResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

/**
 * Standardized error response helper
 */
export function createErrorResponse(
  error: string, 
  status = 400, 
  validationErrors?: Array<{ field: string; message: string }>
): NextResponse {
  const response: any = { error }
  
  if (validationErrors) {
    response.validationErrors = validationErrors
  }
  
  return NextResponse.json(response, { status })
}

/**
 * Parse and validate JSON request body
 */
export async function parseRequestBody<T>(request: Request): Promise<T> {
  try {
    const body = await request.json()
    return body as T
  } catch (error) {
    throw new Error('Invalid JSON in request body')
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  data: Record<string, any>, 
  requiredFields: string[]
): Array<{ field: string; message: string }> {
  const errors: Array<{ field: string; message: string }> = []
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push({
        field,
        message: `${field} is required`
      })
    }
  }
  
  return errors
}