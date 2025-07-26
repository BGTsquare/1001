// Book data models and operations
export { BookRepository, bookRepository, clientBookRepository } from '../repositories/book-repository'
export type { BookSearchOptions } from '../repositories/book-repository'

export { BookService, bookService, clientBookService } from '../services/book-service'
export type { BookServiceResult } from '../services/book-service'

export {
  validateBookCreate,
  validateBookUpdate,
  validateBookSearch,
  validateBookId,
  sanitizeBookData,
  BookValidationError
} from '../validation/book-validation'
export type { ValidationError, ValidationResult } from '../validation/book-validation'

// Re-export book types from main types file
export type { Book, BookFilters } from '@/types'