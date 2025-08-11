export const BOOK_CATEGORIES = [
  'Fiction',
  'Non-Fiction', 
  'Science Fiction',
  'Fantasy',
  'Mystery',
  'Romance',
  'Thriller',
  'Biography',
  'History',
  'Science',
  'Technology',
  'Business',
  'Self-Help',
  'Health',
  'Travel',
  'Cooking',
  'Art',
  'Music',
  'Sports',
  'Education'
] as const

export const ACCEPTED_IMAGE_TYPES = 'image/*'
export const ACCEPTED_CONTENT_TYPES = '.pdf,.epub,.txt,.docx'

export const UPLOAD_CONFIG = {
  OPTIMIZE: 'true',
  GENERATE_THUMBNAIL: 'true'
} as const

export const VALIDATION_RULES = {
  MIN_DISCOUNT_PERCENTAGE: 0.01, // 1% minimum discount
  MIN_BUNDLE_PRICE: 0
} as const

export const UI_CONFIG = {
  MAX_DIALOG_WIDTH: 'max-w-6xl',
  MAX_DIALOG_HEIGHT: 'max-h-[90vh]',
  COVER_PREVIEW_HEIGHT: 'h-48',
  BOOK_COVER_HEIGHT: 'h-32'
} as const