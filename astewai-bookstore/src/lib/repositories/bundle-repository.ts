import { createClient as createClientClient } from '@/lib/supabase/client'
import type { Bundle, Book } from '@/types'
import type { Database } from '@/types/database'

type BundleInsert = Database['public']['Tables']['bundles']['Insert']
type BundleUpdate = Database['public']['Tables']['bundles']['Update']
type BundleBooksInsert = Database['public']['Tables']['bundle_books']['Insert']

export interface BundleSearchOptions {
  query?: string
  priceRange?: [number, number]
  limit?: number
  offset?: number
  sortBy?: 'created_at' | 'title' | 'price'
  sortOrder?: 'asc' | 'desc'
}

export class BundleRepository {
  private supabase: any
  private isClient: boolean

  constructor(isClient = false) {
    this.isClient = isClient
    if (isClient) {
      this.supabase = createClientClient()
    } else {
      // For server-side, we'll initialize lazily to avoid import issues
      this.supabase = null
    }
  }

  /**
   * Create a new bundle
   */
  async create(bundleData: BundleInsert): Promise<Bundle | null> {
    try {
      const supabase = await this.getSupabaseClient()
      const { data, error } = await supabase
        .from('bundles')
        .insert(bundleData)
        .select()
        .single()

      if (error) {
        console.error('Error creating bundle:', error)
        return null
      }

      return data as Bundle
    } catch (error) {
      console.error('Unexpected error creating bundle:', error)
      return null
    }
  }

  /**
   * Get a bundle by ID with associated books
   */
  async getById(id: string, includeBooks = true): Promise<Bundle | null> {
    try {
      const supabase = await this.getSupabaseClient()
      const { data, error } = await supabase
        .from('bundles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null
        }
        console.error('Error fetching bundle:', error)
        return null
      }

      const bundle = data as Bundle

      // Fetch associated books if requested
      if (includeBooks) {
        const books = await this.getBundleBooks(id)
        bundle.books = books
      }

      return bundle
    } catch (error) {
      console.error('Unexpected error fetching bundle:', error)
      return null
    }
  }

  /**
   * Update a bundle
   */
  async update(id: string, updates: BundleUpdate): Promise<Bundle | null> {
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
        console.error('Error updating bundle:', error)
        return null
      }

      return data as Bundle
    } catch (error) {
      console.error('Unexpected error updating bundle:', error)
      return null
    }
  }

  /**
   * Delete a bundle and its book associations
   */
  async delete(id: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabaseClient()
      
      // Delete bundle (cascade will handle bundle_books)
      const { error } = await supabase
        .from('bundles')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting bundle:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Unexpected error deleting bundle:', error)
      return false
    }
  }

  /**
   * Get all bundles with optional filtering and pagination
   */
  async getAll(options: BundleSearchOptions = {}, includeBooks = true): Promise<Bundle[]> {
    try {
      const supabase = await this.getSupabaseClient()
      let query = supabase.from('bundles').select('*')

      // Apply filters
      if (options.priceRange) {
        const [minPrice, maxPrice] = options.priceRange
        query = query.gte('price', minPrice).lte('price', maxPrice)
      }

      // Apply search query
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
        console.error('Error fetching bundles:', error)
        return []
      }

      const bundles = data as Bundle[]

      // Fetch associated books for each bundle if requested
      if (includeBooks && bundles.length > 0) {
        const bundlesWithBooks = await Promise.all(
          bundles.map(async (bundle) => {
            const books = await this.getBundleBooks(bundle.id)
            return { ...bundle, books }
          })
        )
        return bundlesWithBooks
      }

      return bundles
    } catch (error) {
      console.error('Unexpected error fetching bundles:', error)
      return []
    }
  }

  /**
   * Search bundles
   */
  async search(searchTerm: string, options: Omit<BundleSearchOptions, 'query'> = {}, includeBooks = true): Promise<Bundle[]> {
    return this.getAll({ ...options, query: searchTerm }, includeBooks)
  }

  /**
   * Get bundles in price range
   */
  async getByPriceRange(minPrice: number, maxPrice: number, options: Omit<BundleSearchOptions, 'priceRange'> = {}, includeBooks = true): Promise<Bundle[]> {
    return this.getAll({ ...options, priceRange: [minPrice, maxPrice] }, includeBooks)
  }

  /**
   * Get total count of bundles (for pagination)
   */
  async getCount(filters: Omit<BundleSearchOptions, 'limit' | 'offset' | 'sortBy' | 'sortOrder'> = {}): Promise<number> {
    try {
      const supabase = await this.getSupabaseClient()
      let query = supabase.from('bundles').select('*', { count: 'exact', head: true })

      // Apply same filters as getAll but without pagination
      if (filters.priceRange) {
        const [minPrice, maxPrice] = filters.priceRange
        query = query.gte('price', minPrice).lte('price', maxPrice)
      }

      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
      }

      const { count, error } = await query

      if (error) {
        console.error('Error counting bundles:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Unexpected error counting bundles:', error)
      return 0
    }
  }

  /**
   * Check if a bundle exists
   */
  async exists(id: string): Promise<boolean> {
    const bundle = await this.getById(id, false)
    return bundle !== null
  }

  /**
   * Get bundles by multiple IDs
   */
  async getByIds(ids: string[], includeBooks = true): Promise<Bundle[]> {
    if (ids.length === 0) return []

    try {
      const supabase = await this.getSupabaseClient()
      const { data, error } = await supabase
        .from('bundles')
        .select('*')
        .in('id', ids)

      if (error) {
        console.error('Error fetching bundles by IDs:', error)
        return []
      }

      const bundles = data as Bundle[]

      // Fetch associated books for each bundle if requested
      if (includeBooks && bundles.length > 0) {
        const bundlesWithBooks = await Promise.all(
          bundles.map(async (bundle) => {
            const books = await this.getBundleBooks(bundle.id)
            return { ...bundle, books }
          })
        )
        return bundlesWithBooks
      }

      return bundles
    } catch (error) {
      console.error('Unexpected error fetching bundles by IDs:', error)
      return []
    }
  }

  /**
   * Get books associated with a bundle
   */
  async getBundleBooks(bundleId: string): Promise<Book[]> {
    try {
      const supabase = await this.getSupabaseClient()
      const { data, error } = await supabase
        .from('bundle_books')
        .select(`
          books (
            id,
            title,
            author,
            description,
            cover_image_url,
            content_url,
            price,
            is_free,
            category,
            tags,
            created_at,
            updated_at
          )
        `)
        .eq('bundle_id', bundleId)

      if (error) {
        console.error('Error fetching bundle books:', error)
        return []
      }

      // Extract books from the nested structure
      const books = data
        .map(item => item.books)
        .filter(book => book !== null) as Book[]

      return books
    } catch (error) {
      console.error('Unexpected error fetching bundle books:', error)
      return []
    }
  }

  /**
   * Add books to a bundle
   */
  async addBooksToBundle(bundleId: string, bookIds: string[]): Promise<boolean> {
    if (bookIds.length === 0) return true

    try {
      const supabase = await this.getSupabaseClient()
      
      // Create bundle_books associations
      const bundleBooks: BundleBooksInsert[] = bookIds.map(bookId => ({
        bundle_id: bundleId,
        book_id: bookId
      }))

      const { error } = await supabase
        .from('bundle_books')
        .insert(bundleBooks)

      if (error) {
        console.error('Error adding books to bundle:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Unexpected error adding books to bundle:', error)
      return false
    }
  }

  /**
   * Remove books from a bundle
   */
  async removeBooksFromBundle(bundleId: string, bookIds: string[]): Promise<boolean> {
    if (bookIds.length === 0) return true

    try {
      const supabase = await this.getSupabaseClient()
      
      const { error } = await supabase
        .from('bundle_books')
        .delete()
        .eq('bundle_id', bundleId)
        .in('book_id', bookIds)

      if (error) {
        console.error('Error removing books from bundle:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Unexpected error removing books from bundle:', error)
      return false
    }
  }

  /**
   * Replace all books in a bundle
   */
  async setBundleBooks(bundleId: string, bookIds: string[]): Promise<boolean> {
    try {
      const supabase = await this.getSupabaseClient()
      
      // Start a transaction-like operation
      // First, remove all existing books
      const { error: deleteError } = await supabase
        .from('bundle_books')
        .delete()
        .eq('bundle_id', bundleId)

      if (deleteError) {
        console.error('Error removing existing books from bundle:', deleteError)
        return false
      }

      // Then add the new books
      if (bookIds.length > 0) {
        return await this.addBooksToBundle(bundleId, bookIds)
      }

      return true
    } catch (error) {
      console.error('Unexpected error setting bundle books:', error)
      return false
    }
  }

  /**
   * Calculate bundle pricing statistics
   */
  async calculateBundleValue(bundleId: string): Promise<{
    bundlePrice: number
    totalBookPrice: number
    savings: number
    discountPercentage: number
  } | null> {
    try {
      const bundle = await this.getById(bundleId, true)
      if (!bundle || !bundle.books) {
        return null
      }

      const bundlePrice = bundle.price
      const totalBookPrice = bundle.books.reduce((sum, book) => sum + book.price, 0)
      const savings = totalBookPrice - bundlePrice
      const discountPercentage = totalBookPrice > 0 ? (savings / totalBookPrice) * 100 : 0

      return {
        bundlePrice,
        totalBookPrice,
        savings,
        discountPercentage
      }
    } catch (error) {
      console.error('Unexpected error calculating bundle value:', error)
      return null
    }
  }

  /**
   * Get bundles that contain a specific book
   */
  async getBundlesContainingBook(bookId: string): Promise<Bundle[]> {
    try {
      const supabase = await this.getSupabaseClient()
      const { data, error } = await supabase
        .from('bundle_books')
        .select(`
          bundles (
            id,
            title,
            description,
            price,
            created_at,
            updated_at
          )
        `)
        .eq('book_id', bookId)

      if (error) {
        console.error('Error fetching bundles containing book:', error)
        return []
      }

      // Extract bundles from the nested structure
      const bundles = data
        .map(item => item.bundles)
        .filter(bundle => bundle !== null) as Bundle[]

      return bundles
    } catch (error) {
      console.error('Unexpected error fetching bundles containing book:', error)
      return []
    }
  }

  private async getSupabaseClient() {
    if (this.isClient) {
      return this.supabase
    } else {
      // Lazy initialization for server client to avoid import issues
      if (!this.supabase) {
        const { createClient } = await import('@/lib/supabase/server')
        this.supabase = createClient()
      }
      return this.supabase
    }
  }
}

// Export singleton instances for convenience
export const bundleRepository = new BundleRepository()
export const clientBundleRepository = new BundleRepository(true)