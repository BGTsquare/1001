import type { BundleSearchOptions } from '@/lib/repositories/bundle-repository'
import { 
  validateBundleCreate, 
  validateBundleUpdate, 
  validateBundleSearch, 
  validateBundleId,
  validateBundleBookIds,
  validateBundlePricing,
  sanitizeBundleData
} from '@/lib/validation/bundle-validation'
import type { Bundle, Book } from '@/types'
import type { Database } from '@/types/database'

type BundleInsert = Database['public']['Tables']['bundles']['Insert']
type BundleUpdate = Database['public']['Tables']['bundles']['Update']

export interface BundleServiceResult<T> {
  success: boolean
  data?: T
  error?: string
  validationErrors?: Array<{ field: string; message: string }>
}

export interface BundleWithBooks extends Bundle {
  books: Book[]
}

export interface BundleCreateData extends BundleInsert {
  bookIds: string[]
}

export interface BundleUpdateData extends BundleUpdate {
  bookIds?: string[]
}

export class BundleService {
  private repository: any
  private bookRepository: any
  private isClient: boolean

  constructor(isClient = false) {
    this.isClient = isClient
    this.repository = null
    this.bookRepository = null
  }

  private async initializeRepositories() {
    if (!this.repository) {
      const { BundleRepository } = await import('@/lib/repositories/bundle-repository')
      this.repository = new BundleRepository(this.isClient)
    }
    if (!this.bookRepository) {
      const { BookRepository } = await import('@/lib/repositories/book-repository')
      this.bookRepository = new BookRepository(this.isClient)
    }
  }

  /**
   * Create a new bundle with books and validation
   */
  async createBundle(bundleData: BundleCreateData): Promise<BundleServiceResult<BundleWithBooks>> {
    try {
      await this.initializeRepositories()
      const { bookIds, ...bundleInfo } = bundleData

      // Sanitize input data
      const sanitizedData = sanitizeBundleData(bundleInfo) as BundleInsert

      // Validate the bundle data
      const bundleValidation = validateBundleCreate(sanitizedData)
      if (!bundleValidation.isValid) {
        return {
          success: false,
          error: 'Bundle validation failed',
          validationErrors: bundleValidation.errors
        }
      }

      // Validate book IDs
      const bookIdsValidation = validateBundleBookIds(bookIds)
      if (!bookIdsValidation.isValid) {
        return {
          success: false,
          error: 'Book IDs validation failed',
          validationErrors: bookIdsValidation.errors
        }
      }

      // Verify all books exist and get their prices
      const books = await this.bookRepository.getByIds(bookIds)
      if (books.length !== bookIds.length) {
        const foundIds = books.map(book => book.id)
        const missingIds = bookIds.filter(id => !foundIds.includes(id))
        return {
          success: false,
          error: `Books not found: ${missingIds.join(', ')}`
        }
      }

      // Validate bundle pricing against book prices
      const bookPrices = books.map(book => book.price)
      const pricingValidation = validateBundlePricing(sanitizedData.price, bookPrices)
      if (!pricingValidation.isValid) {
        return {
          success: false,
          error: 'Bundle pricing validation failed',
          validationErrors: pricingValidation.errors
        }
      }

      // Create the bundle
      const bundle = await this.repository.create(sanitizedData)
      if (!bundle) {
        return {
          success: false,
          error: 'Failed to create bundle'
        }
      }

      // Add books to the bundle
      const booksAdded = await this.repository.addBooksToBundle(bundle.id, bookIds)
      if (!booksAdded) {
        // Cleanup: delete the bundle if we couldn't add books
        await this.repository.delete(bundle.id)
        return {
          success: false,
          error: 'Failed to add books to bundle'
        }
      }

      // Return the complete bundle with books
      const completeBundle = await this.repository.getById(bundle.id, true)
      if (!completeBundle) {
        return {
          success: false,
          error: 'Failed to retrieve created bundle'
        }
      }

      return {
        success: true,
        data: completeBundle as BundleWithBooks
      }
    } catch (error) {
      console.error('Error in createBundle:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while creating the bundle'
      }
    }
  }

  /**
   * Get a bundle by ID with validation
   */
  async getBundleById(id: string, includeBooks = true): Promise<BundleServiceResult<Bundle | BundleWithBooks>> {
    try {
      await this.initializeRepositories()
      // Validate the ID
      const validation = validateBundleId(id)
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid bundle ID',
          validationErrors: validation.errors
        }
      }

      const bundle = await this.repository.getById(id, includeBooks)
      if (!bundle) {
        return {
          success: false,
          error: 'Bundle not found'
        }
      }

      return {
        success: true,
        data: bundle
      }
    } catch (error) {
      console.error('Error in getBundleById:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while fetching the bundle'
      }
    }
  }

  /**
   * Update a bundle with validation
   */
  async updateBundle(id: string, updates: BundleUpdateData): Promise<BundleServiceResult<BundleWithBooks>> {
    try {
      await this.initializeRepositories()
      // Validate the ID
      const idValidation = validateBundleId(id)
      if (!idValidation.isValid) {
        return {
          success: false,
          error: 'Invalid bundle ID',
          validationErrors: idValidation.errors
        }
      }

      const { bookIds, ...bundleUpdates } = updates

      // Sanitize input data
      const sanitizedData = sanitizeBundleData(bundleUpdates) as BundleUpdate

      // Validate the update data
      const validation = validateBundleUpdate(sanitizedData)
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Bundle validation failed',
          validationErrors: validation.errors
        }
      }

      // Check if bundle exists
      const existingBundle = await this.repository.getById(id, true)
      if (!existingBundle) {
        return {
          success: false,
          error: 'Bundle not found'
        }
      }

      // If updating books, validate them
      if (bookIds !== undefined) {
        const bookIdsValidation = validateBundleBookIds(bookIds)
        if (!bookIdsValidation.isValid) {
          return {
            success: false,
            error: 'Book IDs validation failed',
            validationErrors: bookIdsValidation.errors
          }
        }

        // Verify all books exist
        const books = await this.bookRepository.getByIds(bookIds)
        if (books.length !== bookIds.length) {
          const foundIds = books.map(book => book.id)
          const missingIds = bookIds.filter(id => !foundIds.includes(id))
          return {
            success: false,
            error: `Books not found: ${missingIds.join(', ')}`
          }
        }

        // If price is being updated or books are changing, validate pricing
        const finalPrice = sanitizedData.price ?? existingBundle.price
        const bookPrices = books.map(book => book.price)
        const pricingValidation = validateBundlePricing(finalPrice, bookPrices)
        if (!pricingValidation.isValid) {
          return {
            success: false,
            error: 'Bundle pricing validation failed',
            validationErrors: pricingValidation.errors
          }
        }
      } else if (sanitizedData.price !== undefined && existingBundle.books) {
        // If only price is being updated, validate against existing books
        const bookPrices = existingBundle.books.map(book => book.price)
        const pricingValidation = validateBundlePricing(sanitizedData.price, bookPrices)
        if (!pricingValidation.isValid) {
          return {
            success: false,
            error: 'Bundle pricing validation failed',
            validationErrors: pricingValidation.errors
          }
        }
      }

      // Update the bundle
      const updatedBundle = await this.repository.update(id, sanitizedData)
      if (!updatedBundle) {
        return {
          success: false,
          error: 'Failed to update bundle'
        }
      }

      // Update books if provided
      if (bookIds !== undefined) {
        const booksUpdated = await this.repository.setBundleBooks(id, bookIds)
        if (!booksUpdated) {
          return {
            success: false,
            error: 'Failed to update bundle books'
          }
        }
      }

      // Return the complete updated bundle with books
      const completeBundle = await this.repository.getById(id, true)
      if (!completeBundle) {
        return {
          success: false,
          error: 'Failed to retrieve updated bundle'
        }
      }

      return {
        success: true,
        data: completeBundle as BundleWithBooks
      }
    } catch (error) {
      console.error('Error in updateBundle:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while updating the bundle'
      }
    }
  }

  /**
   * Delete a bundle with validation
   */
  async deleteBundle(id: string): Promise<BundleServiceResult<boolean>> {
    try {
      await this.initializeRepositories()
      // Validate the ID
      const validation = validateBundleId(id)
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid bundle ID',
          validationErrors: validation.errors
        }
      }

      // Check if bundle exists
      const existingBundle = await this.repository.getById(id, false)
      if (!existingBundle) {
        return {
          success: false,
          error: 'Bundle not found'
        }
      }

      // Delete the bundle
      const deleted = await this.repository.delete(id)
      if (!deleted) {
        return {
          success: false,
          error: 'Failed to delete bundle'
        }
      }

      return {
        success: true,
        data: true
      }
    } catch (error) {
      console.error('Error in deleteBundle:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while deleting the bundle'
      }
    }
  }

  /**
   * Search bundles with validation
   */
  async searchBundles(options: BundleSearchOptions = {}, includeBooks = true): Promise<BundleServiceResult<{ bundles: Bundle[]; total: number }>> {
    try {
      await this.initializeRepositories()
      // Validate search parameters
      const validation = validateBundleSearch(options)
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid search parameters',
          validationErrors: validation.errors
        }
      }

      // Get bundles and total count
      const [bundles, total] = await Promise.all([
        this.repository.getAll(options, includeBooks),
        this.repository.getCount(options)
      ])

      return {
        success: true,
        data: { bundles, total }
      }
    } catch (error) {
      console.error('Error in searchBundles:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while searching bundles'
      }
    }
  }

  /**
   * Get bundles in price range
   */
  async getBundlesByPriceRange(minPrice: number, maxPrice: number, options: Omit<BundleSearchOptions, 'priceRange'> = {}, includeBooks = true): Promise<BundleServiceResult<Bundle[]>> {
    try {
      await this.initializeRepositories()
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

      const bundles = await this.repository.getByPriceRange(minPrice, maxPrice, options, includeBooks)
      return {
        success: true,
        data: bundles
      }
    } catch (error) {
      console.error('Error in getBundlesByPriceRange:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while fetching bundles by price range'
      }
    }
  }

  /**
   * Check if a bundle exists
   */
  async bundleExists(id: string): Promise<BundleServiceResult<boolean>> {
    try {
      await this.initializeRepositories()
      // Validate the ID
      const validation = validateBundleId(id)
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid bundle ID',
          validationErrors: validation.errors
        }
      }

      const exists = await this.repository.exists(id)
      return {
        success: true,
        data: exists
      }
    } catch (error) {
      console.error('Error in bundleExists:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while checking if bundle exists'
      }
    }
  }

  /**
   * Get multiple bundles by IDs
   */
  async getBundlesByIds(ids: string[], includeBooks = true): Promise<BundleServiceResult<Bundle[]>> {
    try {
      await this.initializeRepositories()
      if (!ids || ids.length === 0) {
        return {
          success: true,
          data: []
        }
      }

      // Validate all IDs
      const validationErrors: Array<{ field: string; message: string }> = []
      for (let i = 0; i < ids.length; i++) {
        const validation = validateBundleId(ids[i])
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
          error: 'Invalid bundle IDs',
          validationErrors
        }
      }

      const bundles = await this.repository.getByIds(ids, includeBooks)
      return {
        success: true,
        data: bundles
      }
    } catch (error) {
      console.error('Error in getBundlesByIds:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while fetching bundles'
      }
    }
  }

  /**
   * Calculate bundle value and savings
   */
  async calculateBundleValue(id: string): Promise<BundleServiceResult<{
    bundlePrice: number
    totalBookPrice: number
    savings: number
    discountPercentage: number
  }>> {
    try {
      await this.initializeRepositories()
      // Validate the ID
      const validation = validateBundleId(id)
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid bundle ID',
          validationErrors: validation.errors
        }
      }

      const value = await this.repository.calculateBundleValue(id)
      if (!value) {
        return {
          success: false,
          error: 'Bundle not found or has no books'
        }
      }

      return {
        success: true,
        data: value
      }
    } catch (error) {
      console.error('Error in calculateBundleValue:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while calculating bundle value'
      }
    }
  }

  /**
   * Get bundles that contain a specific book
   */
  async getBundlesContainingBook(bookId: string): Promise<BundleServiceResult<Bundle[]>> {
    try {
      await this.initializeRepositories()
      // Validate the book ID (using bundle ID validation since format is the same)
      const validation = validateBundleId(bookId)
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid book ID',
          validationErrors: validation.errors
        }
      }

      const bundles = await this.repository.getBundlesContainingBook(bookId)
      return {
        success: true,
        data: bundles
      }
    } catch (error) {
      console.error('Error in getBundlesContainingBook:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while fetching bundles containing book'
      }
    }
  }

  /**
   * Add books to an existing bundle
   */
  async addBooksToBundle(bundleId: string, bookIds: string[]): Promise<BundleServiceResult<BundleWithBooks>> {
    try {
      await this.initializeRepositories()
      // Validate bundle ID
      const bundleIdValidation = validateBundleId(bundleId)
      if (!bundleIdValidation.isValid) {
        return {
          success: false,
          error: 'Invalid bundle ID',
          validationErrors: bundleIdValidation.errors
        }
      }

      // Validate book IDs
      const bookIdsValidation = validateBundleBookIds(bookIds)
      if (!bookIdsValidation.isValid) {
        return {
          success: false,
          error: 'Book IDs validation failed',
          validationErrors: bookIdsValidation.errors
        }
      }

      // Check if bundle exists and get current books
      const existingBundle = await this.repository.getById(bundleId, true)
      if (!existingBundle) {
        return {
          success: false,
          error: 'Bundle not found'
        }
      }

      // Check for duplicate books
      const existingBookIds = existingBundle.books?.map(book => book.id) || []
      const duplicateIds = bookIds.filter(id => existingBookIds.includes(id))
      if (duplicateIds.length > 0) {
        return {
          success: false,
          error: `Books already in bundle: ${duplicateIds.join(', ')}`
        }
      }

      // Verify all new books exist
      const newBooks = await this.bookRepository.getByIds(bookIds)
      if (newBooks.length !== bookIds.length) {
        const foundIds = newBooks.map(book => book.id)
        const missingIds = bookIds.filter(id => !foundIds.includes(id))
        return {
          success: false,
          error: `Books not found: ${missingIds.join(', ')}`
        }
      }

      // Add books to bundle
      const booksAdded = await this.repository.addBooksToBundle(bundleId, bookIds)
      if (!booksAdded) {
        return {
          success: false,
          error: 'Failed to add books to bundle'
        }
      }

      // Return updated bundle
      const updatedBundle = await this.repository.getById(bundleId, true)
      if (!updatedBundle) {
        return {
          success: false,
          error: 'Failed to retrieve updated bundle'
        }
      }

      return {
        success: true,
        data: updatedBundle as BundleWithBooks
      }
    } catch (error) {
      console.error('Error in addBooksToBundle:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while adding books to bundle'
      }
    }
  }

  /**
   * Remove books from an existing bundle
   */
  async removeBooksFromBundle(bundleId: string, bookIds: string[]): Promise<BundleServiceResult<BundleWithBooks>> {
    try {
      await this.initializeRepositories()
      // Validate bundle ID
      const bundleIdValidation = validateBundleId(bundleId)
      if (!bundleIdValidation.isValid) {
        return {
          success: false,
          error: 'Invalid bundle ID',
          validationErrors: bundleIdValidation.errors
        }
      }

      // Validate book IDs format (but allow empty array for removing all)
      if (bookIds.length > 0) {
        const bookIdsValidation = validateBundleBookIds(bookIds)
        if (!bookIdsValidation.isValid) {
          return {
            success: false,
            error: 'Book IDs validation failed',
            validationErrors: bookIdsValidation.errors
          }
        }
      }

      // Check if bundle exists
      const existingBundle = await this.repository.getById(bundleId, true)
      if (!existingBundle) {
        return {
          success: false,
          error: 'Bundle not found'
        }
      }

      // Check if removing all books would leave bundle empty
      const existingBookIds = existingBundle.books?.map(book => book.id) || []
      const remainingBookIds = existingBookIds.filter(id => !bookIds.includes(id))
      
      if (remainingBookIds.length === 0) {
        return {
          success: false,
          error: 'Cannot remove all books from bundle. Bundle must contain at least one book.'
        }
      }

      // Remove books from bundle
      const booksRemoved = await this.repository.removeBooksFromBundle(bundleId, bookIds)
      if (!booksRemoved) {
        return {
          success: false,
          error: 'Failed to remove books from bundle'
        }
      }

      // Return updated bundle
      const updatedBundle = await this.repository.getById(bundleId, true)
      if (!updatedBundle) {
        return {
          success: false,
          error: 'Failed to retrieve updated bundle'
        }
      }

      return {
        success: true,
        data: updatedBundle as BundleWithBooks
      }
    } catch (error) {
      console.error('Error in removeBooksFromBundle:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while removing books from bundle'
      }
    }
  }
}

// Export singleton instances for convenience
export const bundleService = new BundleService()
export const clientBundleService = new BundleService(true)