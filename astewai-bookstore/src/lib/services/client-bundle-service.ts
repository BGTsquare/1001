import { createClient } from '@/lib/supabase/client'
import type { Bundle, Book } from '@/types'
import type { Database } from '@/types/database'

type BundleInsert = Database['public']['Tables']['bundles']['Insert']
type BundleUpdate = Database['public']['Tables']['bundles']['Update']

export interface BundleSearchOptions {
  query?: string
  priceRange?: [number, number]
  limit?: number
  offset?: number
  sortBy?: 'created_at' | 'title' | 'price'
  sortOrder?: 'asc' | 'desc'
}

export interface BundleServiceResult<T> {
  success: boolean
  data?: T
  error?: string
  validationErrors?: Array<{ field: string; message: string }>
}

export interface BundleWithBooks extends Bundle {
  books: Book[]
}

/**
 * Client-only bundle service that uses the client Supabase instance
 * This service is designed to be used in client components only
 */
export class ClientBundleService {
  private supabase = createClient()

  /**
   * Search bundles with optional filters
   */
  async searchBundles(options: BundleSearchOptions = {}, includeBooks = true): Promise<BundleServiceResult<{ bundles: Bundle[]; total: number }>> {
    try {
      const {
        query,
        priceRange,
        limit = 12,
        offset = 0,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options

      // Build the query
      let bundleQuery = this.supabase
        .from('bundles')
        .select(includeBooks ? `
          *,
          books:bundle_books(
            book:books(*)
          )
        ` : '*')

      // Apply text search if provided
      if (query) {
        bundleQuery = bundleQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      }

      // Apply price range filter if provided
      if (priceRange) {
        bundleQuery = bundleQuery
          .gte('price', priceRange[0])
          .lte('price', priceRange[1])
      }

      // Apply sorting
      bundleQuery = bundleQuery.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      bundleQuery = bundleQuery.range(offset, offset + limit - 1)

      const { data: bundles, error } = await bundleQuery

      if (error) {
        console.error('Error searching bundles:', error)
        return {
          success: false,
          error: 'Failed to search bundles'
        }
      }

      // Get total count for pagination
      let countQuery = this.supabase
        .from('bundles')
        .select('*', { count: 'exact', head: true })

      // Apply the same filters for count
      if (query) {
        countQuery = countQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      }

      if (priceRange) {
        countQuery = countQuery
          .gte('price', priceRange[0])
          .lte('price', priceRange[1])
      }

      const { count, error: countError } = await countQuery

      if (countError) {
        console.error('Error counting bundles:', countError)
        return {
          success: false,
          error: 'Failed to count bundles'
        }
      }

      // Transform the data to match our Bundle type
      const transformedBundles = bundles?.map(bundle => {
        if (includeBooks && bundle.books) {
          return {
            ...bundle,
            books: bundle.books.map((bb: any) => bb.book).filter(Boolean)
          }
        }
        return bundle
      }) || []

      return {
        success: true,
        data: {
          bundles: transformedBundles as Bundle[],
          total: count || 0
        }
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
   * Get a bundle by ID
   */
  async getBundleById(id: string, includeBooks = true): Promise<BundleServiceResult<Bundle | BundleWithBooks>> {
    try {
      if (!id) {
        return {
          success: false,
          error: 'Bundle ID is required'
        }
      }

      const query = this.supabase
        .from('bundles')
        .select(includeBooks ? `
          *,
          books:bundle_books(
            book:books(*)
          )
        ` : '*')
        .eq('id', id)
        .single()

      const { data: bundle, error } = await query

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Bundle not found'
          }
        }
        console.error('Error getting bundle:', error)
        return {
          success: false,
          error: 'Failed to get bundle'
        }
      }

      // Transform the data to match our Bundle type
      let transformedBundle = bundle
      if (includeBooks && bundle.books) {
        transformedBundle = {
          ...bundle,
          books: bundle.books.map((bb: any) => bb.book).filter(Boolean)
        }
      }

      return {
        success: true,
        data: transformedBundle as Bundle | BundleWithBooks
      }
    } catch (error) {
      console.error('Error in getBundleById:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while getting the bundle'
      }
    }
  }

  /**
   * Get multiple bundles by IDs
   */
  async getBundlesByIds(ids: string[], includeBooks = true): Promise<BundleServiceResult<Bundle[]>> {
    try {
      if (!ids || ids.length === 0) {
        return {
          success: true,
          data: []
        }
      }

      const query = this.supabase
        .from('bundles')
        .select(includeBooks ? `
          *,
          books:bundle_books(
            book:books(*)
          )
        ` : '*')
        .in('id', ids)

      const { data: bundles, error } = await query

      if (error) {
        console.error('Error getting bundles by IDs:', error)
        return {
          success: false,
          error: 'Failed to get bundles'
        }
      }

      // Transform the data to match our Bundle type
      const transformedBundles = bundles?.map(bundle => {
        if (includeBooks && bundle.books) {
          return {
            ...bundle,
            books: bundle.books.map((bb: any) => bb.book).filter(Boolean)
          }
        }
        return bundle
      }) || []

      return {
        success: true,
        data: transformedBundles as Bundle[]
      }
    } catch (error) {
      console.error('Error in getBundlesByIds:', error)
      return {
        success: false,
        error: 'An unexpected error occurred while getting bundles'
      }
    }
  }
}

// Export singleton instance for convenience
export const clientBundleService = new ClientBundleService()