// Library data models and operations
export { LibraryRepository, libraryRepository } from '../repositories/library-repository'
export { clientLibraryRepository } from '../repositories/client-library-repository'

export { LibraryService, libraryService, clientLibraryService } from '../services/library-service'

// Export types from the shared types file
export type { LibrarySearchOptions, ReadingProgressUpdate, LibraryStats, LibraryServiceOptions } from '../types/library'

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