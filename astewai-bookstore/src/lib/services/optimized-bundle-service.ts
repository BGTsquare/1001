import type { BundleServiceResult, BundleWithBooks, BundleCreateData } from './bundle-service'
import { createClient } from '@/lib/supabase/server'

/**
 * Optimized bundle service with better performance patterns
 */
export class OptimizedBundleService {
  private supabase: any

  constructor() {
    this.supabase = null
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Create bundle with books in a single optimized operation
   */
  async createBundleWithBooks(data: {
    title: string
    description?: string
    price: number
    cover_image_url?: string
    books: Array<{
      title: string
      author: string
      cover_image_url: string
      content_url: string
      price?: number
    }>
  }): Promise<BundleServiceResult<BundleWithBooks>> {
    try {
      const supabase = await this.getSupabase()

      // Use a single RPC call for atomic operation
      const { data: result, error } = await supabase.rpc('create_bundle_with_books', {
        bundle_data: {
          title: data.title,
          description: data.description,
          price: data.price,
          cover_image_url: data.cover_image_url
        },
        books_data: data.books
      })

      if (error) {
        console.error('Error creating bundle with books:', error)
        return {
          success: false,
          error: 'Failed to create bundle with books'
        }
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Error in createBundleWithBooks:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }

  /**
   * Batch fetch bundles with books using a single query
   */
  async getBundlesWithBooks(bundleIds: string[]): Promise<BundleServiceResult<BundleWithBooks[]>> {
    try {
      const supabase = await this.getSupabase()

      // Single query with joins instead of multiple queries
      const { data: bundles, error } = await supabase
        .from('bundles')
        .select(`
          *,
          bundle_books!inner(
            books(*)
          )
        `)
        .in('id', bundleIds)

      if (error) {
        console.error('Error fetching bundles with books:', error)
        return {
          success: false,
          error: 'Failed to fetch bundles'
        }
      }

      // Transform the data to match expected format
      const transformedBundles = bundles.map(bundle => ({
        ...bundle,
        books: bundle.bundle_books.map((bb: any) => bb.books)
      }))

      return {
        success: true,
        data: transformedBundles
      }
    } catch (error) {
      console.error('Error in getBundlesWithBooks:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }
}