import { createClient as createClientClient } from '@/lib/supabase/client'
import type { Bundle, Book } from '@/types'
import type { Database } from '@/types/database'

type BundleInsert = Database['public']['Tables']['bundles']['Insert']
type BundleUpdate = Database['public']['Tables']['bundles']['Update']

// Standardized error types
export class BundleRepositoryError extends Error {
  constructor(message: string, public code?: string, public originalError?: unknown) {
    super(message)
    this.name = 'BundleRepositoryError'
  }
}

// Result type for better error handling
export type RepositoryResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: BundleRepositoryError
}

// Enhanced search options with validation
export interface BundleSearchOptions {
  query?: string
  priceRange?: [number, number]
  limit?: number
  offset?: number
  sortBy?: 'created_at' | 'title' | 'price'
  sortOrder?: 'asc' | 'desc'
}

// Bundle statistics interface
export interface BundleStats {
  total: number
  averagePrice: number
  priceRange: { min: number; max: number }
}

// Bundle value calculation result
export interface BundleValue {
  bundlePrice: number
  totalBookPrice: number
  savings: number
  discountPercentage: number
}

// Abstract base repository for common functionality
abstract class BaseRepository {
  protected supabase: any
  protected isClient: boolean

  constructor(isClient = false) {
    this.isClient = isClient
    if (isClient) {
      this.supabase = createClientClient()
    } else {
      this.supabase = null
    }
  }

  protected async getSupabaseClient() {
    if (this.isClient) {
      return this.supabase
    } else {
      if (!this.supabase) {
        const { createClient } = await import('@/lib/supabase/server')
        this.supabase = createClient()
      }
      return this.supabase
    }
  }

  protected handleError(error: unknown, context: string): BundleRepositoryError {
    console.error(`${context}:`, error)
    
    if (error && typeof error === 'object' && 'code' in error) {
      return new BundleRepositoryError(
        `Database error in ${context}`,
        error.code as string,
        error
      )
    }
    
    return new BundleRepositoryError(`Unexpected error in ${context}`, undefined, error)
  }
}

// Separate service for bundle-book relationships
export class BundleBookService extends BaseRepository {
  async getBundleBooks(bundleId: string): Promise<RepositoryResult<Book[]>> {
    try {
      const supabase = await this.getSupabaseClient()
      const { data, error } = await supabase
        .from('bundle_books')
        .select(`
          books (
            id, title, author, description, cover_image_url,
            content_url, price, is_free, category, tags,
            created_at, updated_at
          )
        `)
        .eq('bundle_id', bundleId)

      if (error) {
        return { success: false, error: this.handleError(error, 'getBundleBooks') }
      }

      const books = data
        .map(item => item.books)
        .filter(book => book !== null) as Book[]

      return { success: true, data: books }
    } catch (error) {
      return { success: false, error: this.handleError(error, 'getBundleBooks') }
    }
  }

  async addBooksToBundle(bundleId: string, bookIds: string[]): Promise<RepositoryResult<void>> {
    if (bookIds.length === 0) {
      return { success: true, data: undefined }
    }

    try {
      const supabase = await this.getSupabaseClient()
      
      const bundleBooks = bookIds.map(bookId => ({
        bundle_id: bundleId,
        book_id: bookId
      }))

      const { error } = await supabase
        .from('bundle_books')
        .insert(bundleBooks)

      if (error) {
        return { success: false, error: this.handleError(error, 'addBooksToBundle') }
      }

      return { success: true, data: undefined }
    } catch (error) {
      return { success: false, error: this.handleError(error, 'addBooksToBundle') }
    }
  }

  async setBundleBooks(bundleId: string, bookIds: string[]): Promise<RepositoryResult<void>> {
    try {
      const supabase = await this.getSupabaseClient()
      
      // Remove existing books
      const { error: deleteError } = await supabase
        .from('bundle_books')
        .delete()
        .eq('bundle_id', bundleId)

      if (deleteError) {
        return { success: false, error: this.handleError(deleteError, 'setBundleBooks:delete') }
      }

      // Add new books if any
      if (bookIds.length > 0) {
        return await this.addBooksToBundle(bundleId, bookIds)
      }

      return { success: true, data: undefined }
    } catch (error) {
      return { success: false, error: this.handleError(error, 'setBundleBooks') }
    }
  }
}

// Main bundle repository with focused responsibilities
export class BundleRepository extends BaseRepository {
  private bundleBookService: BundleBookService

  constructor(isClient = false) {
    super(isClient)
    this.bundleBookService = new BundleBookService(isClient)
  }

  async create(bundleData: BundleInsert): Promise<RepositoryResult<Bundle>> {
    try {
      const supabase = await this.getSupabaseClient()
      const { data, error } = await supabase
        .from('bundles')
        .insert(bundleData)
        .select()
        .single()

      if (error) {
        return { success: false, error: this.handleError(error, 'create') }
      }

      return { success: true, data: data as Bundle }
    } catch (error) {
      return { success: false, error: this.handleError(error, 'create') }
    }
  }

  async getById(id: string, includeBooks = true): Promise<RepositoryResult<Bundle>> {
    try {
      const supabase = await this.getSupabaseClient()
      const { data, error } = await supabase
        .from('bundles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { 
            success: false, 
            error: new BundleRepositoryError('Bundle not found', 'NOT_FOUND') 
          }
        }
        return { success: false, error: this.handleError(error, 'getById') }
      }

      const bundle = data as Bundle

      if (includeBooks) {
        const booksResult = await this.bundleBookService.getBundleBooks(id)
        if (booksResult.success) {
          bundle.books = booksResult.data
        } else {
          // Log warning but don't fail the entire operation
          console.warn('Failed to fetch books for bundle:', booksResult.error.message)
          bundle.books = []
        }
      }

      return { success: true, data: bundle }
    } catch (error) {
      return { success: false, error: this.handleError(error, 'getById') }
    }
  }

  async update(id: string, updates: BundleUpdate): Promise<RepositoryResult<Bundle>> {
    try {
      const supabase = await this.getSupabaseClient()
      const { data, error } = await supabase
        .from('bundles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { success: false, error: this.handleError(error, 'update') }
      }

      return { success: true, data: data as Bundle }
    } catch (error) {
      return { success: false, error: this.handleError(error, 'update') }
    }
  }

  async delete(id: string): Promise<RepositoryResult<void>> {
    try {
      const supabase = await this.getSupabaseClient()
      const { error } = await supabase
        .from('bundles')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: this.handleError(error, 'delete') }
      }

      return { success: true, data: undefined }
    } catch (error) {
      return { success: false, error: this.handleError(error, 'delete') }
    }
  }

  private validateSearchOptions(options: BundleSearchOptions): BundleRepositoryError | null {
    if (options.limit && (options.limit < 1 || options.limit > 100)) {
      return new BundleRepositoryError('Limit must be between 1 and 100')
    }
    
    if (options.offset && options.offset < 0) {
      return new BundleRepositoryError('Offset must be non-negative')
    }
    
    if (options.priceRange) {
      const [min, max] = options.priceRange
      if (min < 0 || max < 0 || min > max) {
        return new BundleRepositoryError('Invalid price range')
      }
    }
    
    return null
  }

  async getAll(options: BundleSearchOptions = {}, includeBooks = true): Promise<RepositoryResult<Bundle[]>> {
    const validationError = this.validateSearchOptions(options)
    if (validationError) {
      return { success: false, error: validationError }
    }

    try {
      const supabase = await this.getSupabaseClient()
      let query = supabase.from('bundles').select('*')

      // Apply filters
      if (options.priceRange) {
        const [minPrice, maxPrice] = options.priceRange
        query = query.gte('price', minPrice).lte('price', maxPrice)
      }

      if (options.query) {
        query = query.or(`title.ilike.%${options.query}%,description.ilike.%${options.query}%`)
      }

      // Apply sorting
      const sortBy = options.sortBy || 'created_at'
      const sortOrder = options.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        const limit = options.limit || 10
        query = query.range(options.offset, options.offset + limit - 1)
      }

      const { data, error } = await query

      if (error) {
        return { success: false, error: this.handleError(error, 'getAll') }
      }

      const bundles = data as Bundle[]

      // Fetch books concurrently if requested
      if (includeBooks && bundles.length > 0) {
        const bundlesWithBooks = await Promise.all(
          bundles.map(async (bundle) => {
            const booksResult = await this.bundleBookService.getBundleBooks(bundle.id)
            return {
              ...bundle,
              books: booksResult.success ? booksResult.data : []
            }
          })
        )
        return { success: true, data: bundlesWithBooks }
      }

      return { success: true, data: bundles }
    } catch (error) {
      return { success: false, error: this.handleError(error, 'getAll') }
    }
  }

  async getCount(filters: Omit<BundleSearchOptions, 'limit' | 'offset' | 'sortBy' | 'sortOrder'> = {}): Promise<RepositoryResult<number>> {
    try {
      const supabase = await this.getSupabaseClient()
      let query = supabase.from('bundles').select('*', { count: 'exact', head: true })

      if (filters.priceRange) {
        const [minPrice, maxPrice] = filters.priceRange
        query = query.gte('price', minPrice).lte('price', maxPrice)
      }

      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
      }

      const { count, error } = await query

      if (error) {
        return { success: false, error: this.handleError(error, 'getCount') }
      }

      return { success: true, data: count || 0 }
    } catch (error) {
      return { success: false, error: this.handleError(error, 'getCount') }
    }
  }

  // Delegate bundle-book operations to the service
  async addBooksToBundle(bundleId: string, bookIds: string[]): Promise<RepositoryResult<void>> {
    return this.bundleBookService.addBooksToBundle(bundleId, bookIds)
  }

  async setBundleBooks(bundleId: string, bookIds: string[]): Promise<RepositoryResult<void>> {
    return this.bundleBookService.setBundleBooks(bundleId, bookIds)
  }
}

// Factory for dependency injection
export class BundleRepositoryFactory {
  static create(isClient = false): BundleRepository {
    return new BundleRepository(isClient)
  }
}

// Export singleton instances
export const bundleRepository = BundleRepositoryFactory.create()
export const clientBundleRepository = BundleRepositoryFactory.create(true)