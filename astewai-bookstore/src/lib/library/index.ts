// Library data models and operations
export { LibraryRepository, libraryRepository, clientLibraryRepository } from '../repositories/library-repository'
export type { LibrarySearchOptions, ReadingProgressUpdate } from '../repositories/library-repository'

export { LibraryService, libraryService, clientLibraryService } from '../services/library-service'
export type { LibraryStats, LibraryServiceOptions } from '../services/library-service'

// Library validation functions
export {
  validateProgress,
  validateLibraryStatus,
  validateUserLibrary,
  validateLibraryUpdate,
  LibraryValidationError
} from '../validation/library-validation'
export type { ValidationResult, ValidationError } from '../validation/library-validation'

// Re-export library types from main types file
export type { UserLibrary } from '@/types'