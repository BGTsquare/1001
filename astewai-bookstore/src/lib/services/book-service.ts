import { BookRepository, type BookSearchOptions } from '@/lib/repositories/book-repository'
import { 
  validateBookCreate, 
  validateBookUpdate, 
  validateBookSearch, 
  validateBookId,
  sanitizeBookData
} from '@/lib/validation/book-validation'
import type { Book } from '@/types'
import type { Database } from '@/types/database'

type BookInsert = Database['public']['Tables']['books']['Insert']
type BookUpdate = Database['public']['Tables']['books']['Update']

export interface BookServiceResult<T> {
  success: boolean
  data?: T
  error?: string
  validationErrors?: Array<{ field: string; message: string }>
}

export class BookService {
  private repository: BookRepository

  constructor(isClient = false) {
    this.repository = new BookRepository(isClient)
  }

  /**
   * Create a new book with validation
   */
  async createBook(bookData: BookInsert): Promise<BookServiceResult<Book>> {
    try {
      // Sanitize input data
      const sanitizedData = sanitizeBookData(bookData) as BookInsert

      // Validate the data
      const validation = validateBookCreate(sanitizedData)
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          validationErrors: validation.errors
        }
      }

      // Create the book
      const book = await this.repository.create(sanitizedData)
      if (!book) {
        return {
          success: false,
          error: 'Failed to create book'
        }
      }

      return {
        success: true,
        data: book
      }
    } catch (error) {
      console.error('Error in createBook:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while creating the book'
      }
    }
  }

  /**
   * Get a book by ID with validation
   */
  async getBookById(id: string): Promise<BookServiceResult<Book>> {
    try {
      // Validate the ID
      const validation = validateBookId(id)
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid book ID',
          validationErrors: validation.errors
        }
      }

      const book = await this.repository.getById(id)
      if (!book) {
        return {
          success: false,
          error: 'Book not found'
        }
      }

      return {
        success: true,
        data: book
      }
    } catch (error) {
      console.error('Error in getBookById:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while fetching the book'
      }
    }
  }

  /**
   * Update a book with validation
   */
  async updateBook(id: string, updates: BookUpdate): Promise<BookServiceResult<Book>> {
    try {
      // Validate the ID
      const idValidation = validateBookId(id)
      if (!idValidation.isValid) {
        return {
          success: false,
          error: 'Invalid book ID',
          validationErrors: idValidation.errors
        }
      }

      // Sanitize input data
      const sanitizedData = sanitizeBookData(updates) as BookUpdate

      // Validate the update data
      const validation = validateBookUpdate(sanitizedData)
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          validationErrors: validation.errors
        }
      }

      // Check if book exists
      const existingBook = await this.repository.getById(id)
      if (!existingBook) {
        return {
          success: false,
          error: 'Book not found'
        }
      }

      // Update the book
      const updatedBook = await this.repository.update(id, sanitizedData)
      if (!updatedBook) {
        return {
          success: false,
          error: 'Failed to update book'
        }
      }

      return {
        success: true,
        data: updatedBook
      }
    } catch (error) {
      console.error('Error in updateBook:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while updating the book'
      }
    }
  }

  /**
   * Delete a book with validation
   */
  async deleteBook(id: string): Promise<BookServiceResult<boolean>> {
    try {
      // Validate the ID
      const validation = validateBookId(id)
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid book ID',
          validationErrors: validation.errors
        }
      }

      // Check if book exists
      const existingBook = await this.repository.getById(id)
      if (!existingBook) {
        return {
          success: false,
          error: 'Book not found'
        }
      }

      // Delete the book
      const deleted = await this.repository.delete(id)
      if (!deleted) {
        return {
          success: false,
          error: 'Failed to delete book'
        }
      }

      return {
        success: true,
        data: true
      }
    } catch (error) {
      console.error('Error in deleteBook:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while deleting the book'
      }
    }
  }

  /**
   * Search books with validation
   */
  async searchBooks(options: BookSearchOptions = {}): Promise<BookServiceResult<{ books: Book[]; total: number }>> {
    try {
      // Validate search parameters
      const validation = validateBookSearch(options)
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid search parameters',
          validationErrors: validation.errors
        }
      }

      // Get books and total count
      const [books, total] = await Promise.all([
        this.repository.getAll(options),
        this.repository.getCount(options)
      ])

      return {
        success: true,
        data: { books, total }
      }
    } catch (error) {
      console.error('Error in searchBooks:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while searching books'
      }
    }
  }

  /**
   * Get books by category
   */
  async getBooksByCategory(category: string, options: Omit<BookSearchOptions, 'category'> = {}): Promise<BookServiceResult<Book[]>> {
    try {
      if (!category || category.trim().length === 0) {
        return {
          success: false,
          error: 'Category is required'
        }
      }

      const books = await this.repository.getByCategory(category.trim(), options)
      return {
        success: true,
        data: books
      }
    } catch (error) {
      console.error('Error in getBooksByCategory:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while fetching books by category'
      }
    }
  }

  /**
   * Get free books
   */
  async getFreeBooks(options: Omit<BookSearchOptions, 'isFree'> = {}): Promise<BookServiceResult<Book[]>> {
    try {
      const books = await this.repository.getFreeBooks(options)
      return {
        success: true,
        data: books
      }
    } catch (error) {
      console.error('Error in getFreeBooks:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while fetching free books'
      }
    }
  }

  /**
   * Get paid books
   */
  async getPaidBooks(options: Omit<BookSearchOptions, 'isFree'> = {}): Promise<BookServiceResult<Book[]>> {
    try {
      const books = await this.repository.getPaidBooks(options)
      return {
        success: true,
        data: books
      }
    } catch (error) {
      console.error('Error in getPaidBooks:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while fetching paid books'
      }
    }
  }

  /**
   * Get books by tags
   */
  async getBooksByTags(tags: string[], options: Omit<BookSearchOptions, 'tags'> = {}): Promise<BookServiceResult<Book[]>> {
    try {
      if (!tags || tags.length === 0) {
        return {
          success: false,
          error: 'At least one tag is required'
        }
      }

      const sanitizedTags = tags.map(tag => tag.trim()).filter(tag => tag.length > 0)
      if (sanitizedTags.length === 0) {
        return {
          success: false,
          error: 'At least one valid tag is required'
        }
      }

      const books = await this.repository.getByTags(sanitizedTags, options)
      return {
        success: true,
        data: books
      }
    } catch (error) {
      console.error('Error in getBooksByTags:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while fetching books by tags'
      }
    }
  }

  /**
   * Get books in price range
   */
  async getBooksByPriceRange(minPrice: number, maxPrice: number, options: Omit<BookSearchOptions, 'priceRange'> = {}): Promise<BookServiceResult<Book[]>> {
    try {
      if (minPrice < 0 || maxPrice < 0) {
        return {
          success: false,
          error: 'Price values cannot be negative'
        }
      }

      if (minPrice > maxPrice) {
        return {
          success: false,
          error: 'Minimum price cannot be greater than maximum price'
        }
      }

      const books = await this.repository.getByPriceRange(minPrice, maxPrice, options)
      return {
        success: true,
        data: books
      }
    } catch (error) {
      console.error('Error in getBooksByPriceRange:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while fetching books by price range'
      }
    }
  }

  /**
   * Get all available categories
   */
  async getCategories(): Promise<BookServiceResult<string[]>> {
    try {
      const categories = await this.repository.getCategories()
      return {
        success: true,
        data: categories
      }
    } catch (error) {
      console.error('Error in getCategories:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while fetching categories'
      }
    }
  }

  /**
   * Get all available tags
   */
  async getTags(): Promise<BookServiceResult<string[]>> {
    try {
      const tags = await this.repository.getTags()
      return {
        success: true,
        data: tags
      }
    } catch (error) {
      console.error('Error in getTags:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while fetching tags'
      }
    }
  }

  /**
   * Check if a book exists
   */
  async bookExists(id: string): Promise<BookServiceResult<boolean>> {
    try {
      // Validate the ID
      const validation = validateBookId(id)
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid book ID',
          validationErrors: validation.errors
        }
      }

      const exists = await this.repository.exists(id)
      return {
        success: true,
        data: exists
      }
    } catch (error) {
      console.error('Error in bookExists:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while checking if book exists'
      }
    }
  }

  /**
   * Get multiple books by IDs
   */
  async getBooksByIds(ids: string[]): Promise<BookServiceResult<Book[]>> {
    try {
      if (!ids || ids.length === 0) {
        return {
          success: true,
          data: []
        }
      }

      // Validate all IDs
      const validationErrors: Array<{ field: string; message: string }> = []
      for (let i = 0; i < ids.length; i++) {
        const validation = validateBookId(ids[i])
        if (!validation.isValid) {
          validationErrors.push({
            field: `ids[${i}]`,
            message: validation.errors[0]?.message || 'Invalid ID'
          })
        }
      }

      if (validationErrors.length > 0) {
        return {
          success: false,
          error: 'Invalid book IDs',
          validationErrors
        }
      }

      const books = await this.repository.getByIds(ids)
      return {
        success: true,
        data: books
      }
    } catch (error) {
      console.error('Error in getBooksByIds:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while fetching books'
      }
    }
  }
}

// Export singleton instances for convenience
export const bookService = new BookService()
export const clientBookService = new BookService(true)