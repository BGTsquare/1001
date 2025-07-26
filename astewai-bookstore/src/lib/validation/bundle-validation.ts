import type { Database } from '@/types/database'

type BundleInsert = Database['public']['Tables']['bundles']['Insert']
type BundleUpdate = Database['public']['Tables']['bundles']['Update']

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

/**
 * Validate bundle data for creation
 */
export function validateBundleCreate(data: BundleInsert): ValidationResult {
  const errors: ValidationError[] = []

  // Required fields validation
  if (!data.title || data.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Bundle title is required' })
  } else if (data.title.length > 255) {
    errors.push({ field: 'title', message: 'Bundle title must be less than 255 characters' })
  }

  // Optional fields validation
  if (data.description && data.description.length > 2000) {
    errors.push({ field: 'description', message: 'Bundle description must be less than 2000 characters' })
  }

  // Price validation
  if (data.price === undefined || data.price === null) {
    errors.push({ field: 'price', message: 'Bundle price is required' })
  } else if (data.price < 0) {
    errors.push({ field: 'price', message: 'Bundle price cannot be negative' })
  } else if (data.price > 9999.99) {
    errors.push({ field: 'price', message: 'Bundle price cannot exceed $9999.99' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate bundle data for updates
 */
export function validateBundleUpdate(data: BundleUpdate): ValidationResult {
  const errors: ValidationError[] = []

  // Only validate fields that are being updated
  if (data.title !== undefined) {
    if (!data.title || data.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Bundle title cannot be empty' })
    } else if (data.title.length > 255) {
      errors.push({ field: 'title', message: 'Bundle title must be less than 255 characters' })
    }
  }

  if (data.description !== undefined && data.description !== null && data.description.length > 2000) {
    errors.push({ field: 'description', message: 'Bundle description must be less than 2000 characters' })
  }

  if (data.price !== undefined) {
    if (data.price < 0) {
      errors.push({ field: 'price', message: 'Bundle price cannot be negative' })
    } else if (data.price > 9999.99) {
      errors.push({ field: 'price', message: 'Bundle price cannot exceed $9999.99' })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate bundle ID format
 */
export function validateBundleId(id: string): ValidationResult {
  const errors: ValidationError[] = []

  if (!id || id.trim().length === 0) {
    errors.push({ field: 'id', message: 'Bundle ID is required' })
  } else if (!isValidUuid(id)) {
    errors.push({ field: 'id', message: 'Bundle ID must be a valid UUID' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate book IDs for bundle association
 */
export function validateBundleBookIds(bookIds: string[]): ValidationResult {
  const errors: ValidationError[] = []

  if (!bookIds || bookIds.length === 0) {
    errors.push({ field: 'bookIds', message: 'At least one book is required for a bundle' })
  } else if (bookIds.length > 50) {
    errors.push({ field: 'bookIds', message: 'Bundle cannot contain more than 50 books' })
  } else {
    // Check for duplicates
    const uniqueIds = new Set(bookIds)
    if (uniqueIds.size !== bookIds.length) {
      errors.push({ field: 'bookIds', message: 'Bundle cannot contain duplicate books' })
    }

    // Validate each book ID format
    for (let i = 0; i < bookIds.length; i++) {
      const bookId = bookIds[i]
      if (!bookId || bookId.trim().length === 0) {
        errors.push({ field: `bookIds[${i}]`, message: 'Book ID cannot be empty' })
      } else if (!isValidUuid(bookId)) {
        errors.push({ field: `bookIds[${i}]`, message: 'Book ID must be a valid UUID' })
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate bundle pricing against included books
 */
export function validateBundlePricing(bundlePrice: number, bookPrices: number[]): ValidationResult {
  const errors: ValidationError[] = []

  if (bookPrices.length === 0) {
    errors.push({ field: 'bookPrices', message: 'Cannot validate pricing without book prices' })
    return { isValid: false, errors }
  }

  const totalBookPrice = bookPrices.reduce((sum, price) => sum + price, 0)

  // Bundle price should be less than or equal to total book prices (discount logic)
  if (bundlePrice > totalBookPrice) {
    errors.push({ 
      field: 'price', 
      message: `Bundle price ($${bundlePrice.toFixed(2)}) cannot exceed total book prices ($${totalBookPrice.toFixed(2)})` 
    })
  }

  // Bundle should provide some value (at least 1% discount)
  const minimumDiscount = totalBookPrice * 0.01
  if (bundlePrice >= totalBookPrice - minimumDiscount) {
    errors.push({ 
      field: 'price', 
      message: 'Bundle must provide at least 1% discount compared to individual book prices' 
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate bundle search parameters
 */
export function validateBundleSearch(params: {
  query?: string
  priceRange?: [number, number]
  limit?: number
  offset?: number
}): ValidationResult {
  const errors: ValidationError[] = []

  if (params.query !== undefined && params.query.length > 100) {
    errors.push({ field: 'query', message: 'Search query must be less than 100 characters' })
  }

  if (params.priceRange !== undefined) {
    const [minPrice, maxPrice] = params.priceRange
    
    if (minPrice < 0) {
      errors.push({ field: 'priceRange', message: 'Minimum price cannot be negative' })
    }

    if (maxPrice < 0) {
      errors.push({ field: 'priceRange', message: 'Maximum price cannot be negative' })
    }

    if (minPrice > maxPrice) {
      errors.push({ field: 'priceRange', message: 'Minimum price cannot be greater than maximum price' })
    }

    if (maxPrice > 9999.99) {
      errors.push({ field: 'priceRange', message: 'Maximum price cannot exceed $9999.99' })
    }
  }

  if (params.limit !== undefined) {
    if (params.limit < 1) {
      errors.push({ field: 'limit', message: 'Limit must be at least 1' })
    } else if (params.limit > 100) {
      errors.push({ field: 'limit', message: 'Limit cannot exceed 100' })
    }
  }

  if (params.offset !== undefined && params.offset < 0) {
    errors.push({ field: 'offset', message: 'Offset cannot be negative' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Sanitize bundle data before saving
 */
export function sanitizeBundleData(data: BundleInsert | BundleUpdate): BundleInsert | BundleUpdate {
  const sanitized = { ...data }

  // Trim string fields
  if (sanitized.title) {
    sanitized.title = sanitized.title.trim()
  }

  if (sanitized.description) {
    sanitized.description = sanitized.description.trim()
  }

  // Round price to 2 decimal places
  if (sanitized.price !== undefined) {
    sanitized.price = Math.round(sanitized.price * 100) / 100
  }

  return sanitized
}

/**
 * Helper function to validate UUID format
 */
function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Custom error class for bundle validation errors
 */
export class BundleValidationError extends Error {
  public errors: ValidationError[]

  constructor(errors: ValidationError[]) {
    const message = errors.map(e => `${e.field}: ${e.message}`).join(', ')
    super(`Bundle validation failed: ${message}`)
    this.name = 'BundleValidationError'
    this.errors = errors
  }
}