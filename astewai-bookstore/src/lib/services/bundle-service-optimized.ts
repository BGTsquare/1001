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

// Repository factory pattern for better testability and dependency injection
interface RepositoryFactory {
  createBundleRepository: (isClient?: boolean) => Promise<any>
  createBookRepository: (isClient?: boolean) => Promise<any>
}

class DefaultRepositoryFactory implements RepositoryFactory {
  async createBundleRepository(isClient = false) {
    const { BundleRepository } = await import('@/lib/repositories/bundle-repository')
    return new BundleRepository(isClient)
  }

  async createBookRepository(isClient = false) {
    const { BookRepository } = await import('@/lib/repositories/book-repository')
    return new BookRepository(isClient)
  }
}

export class BundleService {
  private bundleRepository: any = null
  private bookRepository: any = null
  private readonly isClient: boolean
  private readonly repositoryFactory: RepositoryFactory

  constructor(isClient = false, repositoryFactory?: RepositoryFactory) {
    this.isClient = isClient
    this.repositoryFactory = repositoryFactory || new DefaultRepositoryFactory()
  }

  private async ensureRepositories() {
    if (!this.bundleRepository) {
      this.bundleRepository = await this.repositoryFactory.createBundleRepository(this.isClient)
    }
    if (!this.bookRepository) {
      this.bookRepository = await this.repositoryFactory.createBookRepository(this.isClient)
    }
  }

  /**
   * Get a bundle by ID with validation and caching support
   */
  async getBundleById(id: string, includeBooks = true): Promise<BundleServiceResult<Bundle | BundleWithBooks>> {
    try {
      // Early validation to avoid unnecessary repository initialization
      const validation = validateBundleId(id)
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid bundle ID',
          validationErrors: validation.errors
        }
      }

      await this.ensureRepositories()
      
      const bundle = await this.bundleRepository.getById(id, includeBooks)
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
   * Search bundles with optimized validation and pagination
   */
  async searchBundles(
    options: BundleSearchOptions = {}, 
    includeBooks = true
  ): Promise<BundleServiceResult<{ bundles: Bundle[]; total: number }>> {
    try {
      // Validate search parameters early
      const validation = validateBundleSearch(options)
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid search parameters',
          validationErrors: validation.errors
        }
      }

      await this.ensureRepositories()

      // Use Promise.all for concurrent execution
      const [bundles, total] = await Promise.all([
        this.bundleRepository.getAll(options, includeBooks),
        this.bundleRepository.getCount(options)
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

  // ... other methods with similar optimizations
}

// Singleton pattern with proper cleanup
class BundleServiceManager {
  private static serverInstance: BundleService | null = null
  private static clientInstance: BundleService | null = null

  static getServerInstance(): BundleService {
    if (!this.serverInstance) {
      this.serverInstance = new BundleService(false)
    }
    return this.serverInstance
  }

  static getClientInstance(): BundleService {
    if (!this.clientInstance) {
      this.clientInstance = new BundleService(true)
    }
    return this.clientInstance
  }

  static cleanup() {
    this.serverInstance = null
    this.clientInstance = null
  }
}

// Export optimized instances
export const bundleService = BundleServiceManager.getServerInstance()
export const clientBundleService = BundleServiceManager.getClientInstance()