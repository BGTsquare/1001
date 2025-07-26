import type { Database } from '@/types/database'

type BookInsert = Database['public']['Tables']['books']['Insert']
type BookUpdate = Database['public']['Tables']['books']['Update']

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

/**
 * Validate book data for creation
 */
export function validateBookCreate(data: BookInsert): ValidationResult {
  const errors: ValidationError[] = []

  // Required fields validation
  if (!data.title || data.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title is required' })
  } else if (data.title.length > 255) {
    errors.push({ field: 'title', message: 'Title must be less than 255 characters' })
  }

  if (!data.author || data.author.trim().length === 0) {
    errors.push({ field: 'author', message: 'Author is required' })
  } else if (data.author.length > 255) {
    errors.push({ field: 'author', message: 'Author must be less than 255 characters' })
  }

  // Optional fields validation
  if (data.description && data.description.length > 2000) {
    errors.push({ field: 'description', message: 'Description must be less than 2000 characters' })
  }

  if (data.category && data.category.length > 100) {
    errors.push({ field: 'category', message: 'Category must be less than 100 characters' })
  }

  // Price validation
  if (data.price !== undefined) {
    if (data.price < 0) {
      errors.push({ field: 'price', message: 'Price cannot be negative' })
    } else if (data.price > 999.99) {
      errors.push({ field: 'price', message: 'Price cannot exceed $999.99' })
    }
  }

  // Free book logic validation
  if (data.is_free === true && data.price && data.price > 0) {
    errors.push({ field: 'price', message: 'Free books cannot have a price greater than 0' })
  }

  if (data.is_free === false && (!data.price || data.price <= 0)) {
    errors.push({ field: 'price', message: 'Paid books must have a price greater than 0' })
  }

  // URL validation
  if (data.cover_image_url && !isValidUrl(data.cover_image_url)) {
    errors.push({ field: 'cover_image_url', message: 'Cover image URL is not valid' })
  }

  if (data.content_url && !isValidUrl(data.content_url)) {
    errors.push({ field: 'content_url', message: 'Content URL is not valid' })
  }

  // Tags validation
  if (data.tags) {
    if (data.tags.length > 10) {
      errors.push({ field: 'tags', message: 'Cannot have more than 10 tags' })
    }

    for (const tag of data.tags) {
      if (tag.length > 50) {
        errors.push({ field: 'tags', message: 'Each tag must be less than 50 characters' })
        break
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate book data for updates
 */
export function validateBookUpdate(data: BookUpdate): ValidationResult {
  const errors: ValidationError[] = []

  // Only validate fields that are being updated
  if (data.title !== undefined) {
    if (!data.title || data.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title cannot be empty' })
    } else if (data.title.length > 255) {
      errors.push({ field: 'title', message: 'Title must be less than 255 characters' })
    }
  }

  if (data.author !== undefined) {
    if (!data.author || data.author.trim().length === 0) {
      errors.push({ field: 'author', message: 'Author cannot be empty' })
    } else if (data.author.length > 255) {
      errors.push({ field: 'author', message: 'Author must be less than 255 characters' })
    }
  }

  if (data.description !== undefined && data.description !== null && data.description.length > 2000) {
    errors.push({ field: 'description', message: 'Description must be less than 2000 characters' })
  }

  if (data.category !== undefined && data.category !== null && data.category.length > 100) {
    errors.push({ field: 'category', message: 'Category must be less than 100 characters' })
  }

  if (data.price !== undefined) {
    if (data.price < 0) {
      errors.push({ field: 'price', message: 'Price cannot be negative' })
    } else if (data.price > 999.99) {
      errors.push({ field: 'price', message: 'Price cannot exceed $999.99' })
    }
  }

  // URL validation
  if (data.cover_image_url !== undefined && data.cover_image_url !== null && !isValidUrl(data.cover_image_url)) {
    errors.push({ field: 'cover_image_url', message: 'Cover image URL is not valid' })
  }

  if (data.content_url !== undefined && data.content_url !== null && !isValidUrl(data.content_url)) {
    errors.push({ field: 'content_url', message: 'Content URL is not valid' })
  }

  // Tags validation
  if (data.tags !== undefined) {
    if (data.tags && data.tags.length > 10) {
      errors.push({ field: 'tags', message: 'Cannot have more than 10 tags' })
    }

    if (data.tags) {
      for (const tag of data.tags) {
        if (tag.length > 50) {
          errors.push({ field: 'tags', message: 'Each tag must be less than 50 characters' })
          break
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate search parameters
 */
export function validateBookSearch(params: {
  query?: string
  category?: string
  tags?: string[]
  priceRange?: [number, number]
  limit?: number
  offset?: number
}): ValidationResult {
  const errors: ValidationError[] = []

  if (params.query !== undefined && params.query.length > 100) {
    errors.push({ field: 'query', message: 'Search query must be less than 100 characters' })
  }

  if (params.category !== undefined && params.category.length > 100) {
    errors.push({ field: 'category', message: 'Category must be less than 100 characters' })
  }

  if (params.tags !== undefined) {
    if (params.tags.length > 10) {
      errors.push({ field: 'tags', message: 'Cannot filter by more than 10 tags' })
    }

    for (const tag of params.tags) {
      if (tag.length > 50) {
        errors.push({ field: 'tags', message: 'Each tag must be less than 50 characters' })
        break
      }
    }
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

    if (maxPrice > 999.99) {
      errors.push({ field: 'priceRange', message: 'Maximum price cannot exceed $999.99' })
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
 * Validate book ID format
 */
export function validateBookId(id: string): ValidationResult {
  const errors: ValidationError[] = []

  if (!id || id.trim().length === 0) {
    errors.push({ field: 'id', message: 'Book ID is required' })
  } else if (!isValidUuid(id)) {
    errors.push({ field: 'id', message: 'Book ID must be a valid UUID' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Sanitize book data before saving
 */
export function sanitizeBookData(data: BookInsert | BookUpdate): BookInsert | BookUpdate {
  const sanitized = { ...data }

  // Trim string fields
  if (sanitized.title) {
    sanitized.title = sanitized.title.trim()
  }

  if (sanitized.author) {
    sanitized.author = sanitized.author.trim()
  }

  if (sanitized.description) {
    sanitized.description = sanitized.description.trim()
  }

  if (sanitized.category) {
    sanitized.category = sanitized.category.trim()
  }

  // Sanitize tags
  if (sanitized.tags) {
    sanitized.tags = sanitized.tags
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, 10) // Limit to 10 tags
  }

  // Ensure price consistency with is_free flag
  if (sanitized.is_free === true) {
    sanitized.price = 0
  }

  return sanitized
}

/**
 * Helper function to validate URLs
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Helper function to validate UUID format
 */
function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Custom error class for book validation errors
 */
export class BookValidationError extends Error {
  public errors: ValidationError[]

  constructor(errors: ValidationError[]) {
    const message = errors.map(e => `${e.field}: ${e.message}`).join(', ')
    super(`Validation failed: ${message}`)
    this.name = 'BookValidationError'
    this.errors = errors
  }
}