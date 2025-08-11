export const FORM_CONSTANTS = {
  // File size limits (in bytes)
  MAX_COVER_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_CONTENT_SIZE: 50 * 1024 * 1024, // 50MB
  
  // Validation limits
  MAX_TITLE_LENGTH: 200,
  MAX_AUTHOR_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_TAGS_PER_BOOK: 10,
  MAX_BOOKS_PER_BUNDLE: 20,
  
  // Pricing
  MINIMUM_DISCOUNT_PERCENTAGE: 0.01, // 1%
  MINIMUM_BUNDLE_PRICE: 0.01,
  
  // UI
  UPLOAD_PROGRESS_DELAY: 100, // ms
  FORM_RESET_DELAY: 100, // ms
  
  // API endpoints
  UPLOAD_ENDPOINT: '/api/admin/books/upload-simple',
  CREATE_BUNDLE_ENDPOINT: '/api/admin/bundles/create-with-books'
} as const

export const ACCEPTED_FILE_TYPES = {
  COVER: 'image/*',
  CONTENT: '.pdf,.epub'
} as const

export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PRICE: 'Please enter a valid price',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  UPLOAD_FAILED: 'Upload failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.'
} as const

export const SUCCESS_MESSAGES = {
  BUNDLE_CREATED: 'Bundle created successfully!',
  FILE_UPLOADED: 'File uploaded successfully!',
  FORM_SAVED: 'Form saved successfully!'
} as const