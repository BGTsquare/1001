import { createClient } from '@/lib/supabase/client'
import type { Book } from '@/types'
import type { Database } from '@/types/database'

type BookInsert = Database['public']['Tables']['books']['Insert']
type BookUpdate = Database['public']['Tables']['books']['Update']

export interface BookSearchOptions {
  query?: string
  category?: string
  tags?: string[]
  priceRange?: [number, number]
  isFree?: boolean
  limit?: number
  offset?: number
  sortBy?: 'created_at' | 'title' | 'author' | 'price' | 'relevance'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchResult extends Book {
  search_rank?: number
}

export interface SearchSuggestion {
  suggestion: string
  frequency: number
}

export interface PopularSearch {
  search_query: string
  search_count: number
  avg_results: number
}

export class ClientBookRepository {
  private supabase = createClient()

  /**
   * Create a new book
   */
  async create(bookData: BookInsert): Promise<Book | null> {
    try {
      const { data, error } = await this.supabase
        .from('books')
        .insert(bookData)
        .select()
        .single()

      if (error) {
        console.error('Error creating book:', error)
        return null
      }

      return data as Book
    } catch (error) {
      console.error('Unexpected error creating book:', error)
      return null
    }
  }

  /**
   * Get a book by ID
   */
  async getById(id: string): Promise<Book | null> {
    try {
      const { data, error } = await this.supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null
        }
        console.error('Error fetching book:', error)
        return null
      }

      return data as Book
    } catch (error) {
      console.error('Unexpected error fetching book:', error)
      return null
    }
  }

  /**
   * Update a book
   */
  async update(id: string, updates: BookUpdate): Promise<Book | null> {
    try {
      const { data, error } = await this.supabase
        .from('books')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating book:', error)
        return null
      }

      return data as Book
    } catch (error) {
      console.error('Unexpected error updating book:', error)
      return null
    }
  }

  /**
   * Delete a book
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('books')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting book:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Unexpected error deleting book:', error)
      return false
    }
  }

  /**
   * Get all books with optional filtering and pagination
   */
  async getAll(options: BookSearchOptions = {}): Promise<SearchResult[]> {
    // Try advanced search first, fallback to basic search if it fails
    try {
      const { data, error } = await this.supabase.rpc('search_books', {
        search_query: options.query || '',
        category_filter: options.category || null,
        tags_filter: options.tags || null,
        price_min: options.priceRange?.[0] || null,
        price_max: options.priceRange?.[1] || null,
        is_free_filter: options.isFree !== undefined ? options.isFree : null,
        limit_count: options.limit || 20,
        offset_count: options.offset || 0,
        sort_by: options.sortBy || 'created_at',
        sort_order: options.sortOrder || 'desc'
      })

      if (!error && data) {
        // Track search query if provided
        if (options.query && options.query.trim()) {
          this.trackSearchQuery(options.query, data.length).catch(() => {
            // Silently fail search tracking to not affect user experience
          })
        }
        return data as SearchResult[]
      }

      // If advanced search fails, fall back to basic search
      console.warn('Advanced search failed, falling back to basic search:', error?.message || 'Unknown error')
      return this.getAllBasic(options)
    } catch (error) {
      console.warn('Advanced search unavailable, using basic search:', error)
      return this.getAllBasic(options)
    }
  }

  /**
   * Fallback basic search method
   */
  private async getAllBasic(options: BookSearchOptions = {}): Promise<Book[]> {
    try {
      let query = this.supabase.from('books').select('*')

      // Apply filters
      if (options.category) {
        query = query.eq('category', options.category)
      }

      if (options.isFree !== undefined) {
        query = query.eq('is_free', options.isFree)
      }

      if (options.priceRange) {
        const [minPrice, maxPrice] = options.priceRange
        query = query.gte('price', minPrice).lte('price', maxPrice)
      }

      if (options.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags)
      }

      // Apply search query
      if (options.query) {
        query = query.or(`title.ilike.%${options.query}%,author.ilike.%${options.query}%,description.ilike.%${options.query}%`)
      }

      // Apply sorting (skip relevance for basic search)
      const sortBy = options.sortBy === 'relevance' ? 'created_at' : (options.sortBy || 'created_at')
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
        console.error('Error fetching books with basic search:', error)
        return []
      }

      return data as Book[]
    } catch (error) {
      console.error('Unexpected error in basic search:', error)
      return []
    }
  }

  /**
   * Search books with full-text search capabilities
   */
  async search(searchTerm: string, options: Omit<BookSearchOptions, 'query'> = {}): Promise<Book[]> {
    return this.getAll({ ...options, query: searchTerm })
  }

  /**
   * Get books by category
   */
  async getByCategory(category: string, options: Omit<BookSearchOptions, 'category'> = {}): Promise<Book[]> {
    return this.getAll({ ...options, category })
  }

  /**
   * Get free books
   */
  async getFreeBooks(options: Omit<BookSearchOptions, 'isFree'> = {}): Promise<Book[]> {
    return this.getAll({ ...options, isFree: true })
  }

  /**
   * Get paid books
   */
  async getPaidBooks(options: Omit<BookSearchOptions, 'isFree'> = {}): Promise<Book[]> {
    return this.getAll({ ...options, isFree: false })
  }

  /**
   * Get books by tags
   */
  async getByTags(tags: string[], options: Omit<BookSearchOptions, 'tags'> = {}): Promise<Book[]> {
    return this.getAll({ ...options, tags })
  }

  /**
   * Get books in price range
   */
  async getByPriceRange(minPrice: number, maxPrice: number, options: Omit<BookSearchOptions, 'priceRange'> = {}): Promise<Book[]> {
    return this.getAll({ ...options, priceRange: [minPrice, maxPrice] })
  }

  /**
   * Get total count of books (for pagination)
   */
  async getCount(filters: Omit<BookSearchOptions, 'limit' | 'offset' | 'sortBy' | 'sortOrder'> = {}): Promise<number> {
    try {
      let query = this.supabase.from('books').select('*', { count: 'exact', head: true })

      // Apply same filters as getAll but without pagination
      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.isFree !== undefined) {
        query = query.eq('is_free', filters.isFree)
      }

      if (filters.priceRange) {
        const [minPrice, maxPrice] = filters.priceRange
        query = query.gte('price', minPrice).lte('price', maxPrice)
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }

      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,author.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
      }

      const { count, error } = await query

      if (error) {
        console.error('Error counting books:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Unexpected error counting books:', error)
      return 0
    }
  }

  /**
   * Get unique categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('books')
        .select('category')
        .not('category', 'is', null)

      if (error) {
        console.error('Error fetching categories:', error)
        return []
      }

      const categories = [...new Set(data.map(item => item.category).filter(Boolean))]
      return categories as string[]
    } catch (error) {
      console.error('Unexpected error fetching categories:', error)
      return []
    }
  }

  /**
   * Get unique tags
   */
  async getTags(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('books')
        .select('tags')
        .not('tags', 'is', null)

      if (error) {
        console.error('Error fetching tags:', error)
        return []
      }

      const allTags = data.flatMap(item => item.tags || [])
      const uniqueTags = [...new Set(allTags)]
      return uniqueTags
    } catch (error) {
      console.error('Unexpected error fetching tags:', error)
      return []
    }
  }

  /**
   * Check if a book exists
   */
  async exists(id: string): Promise<boolean> {
    const book = await this.getById(id)
    return book !== null
  }

  /**
   * Get books by multiple IDs
   */
  async getByIds(ids: string[]): Promise<Book[]> {
    if (ids.length === 0) return []

    try {
      const { data, error } = await this.supabase
        .from('books')
        .select('*')
        .in('id', ids)

      if (error) {
        console.error('Error fetching books by IDs:', error)
        return []
      }

      return data as Book[]
    } catch (error) {
      console.error('Unexpected error fetching books by IDs:', error)
      return []
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSearchSuggestions(partialQuery: string, limit: number = 10): Promise<SearchSuggestion[]> {
    try {
      if (!partialQuery || partialQuery.trim().length < 2) {
        return []
      }

      const { data, error } = await this.supabase.rpc('get_search_suggestions', {
        partial_query: partialQuery.trim(),
        suggestion_limit: limit
      })

      if (!error && data) {
        return data as SearchSuggestion[]
      }

      // Fallback: return basic suggestions from existing book data
      return this.getBasicSuggestions(partialQuery.trim(), limit)
    } catch (error) {
      console.warn('Advanced search suggestions unavailable, using basic suggestions')
      return this.getBasicSuggestions(partialQuery.trim(), limit)
    }
  }

  /**
   * Fallback method for search suggestions using basic queries
   */
  private async getBasicSuggestions(partialQuery: string, limit: number): Promise<SearchSuggestion[]> {
    try {
      const query = partialQuery.toLowerCase()
      
      // Get suggestions from book titles and authors
      const { data, error } = await this.supabase
        .from('books')
        .select('title, author, category, tags')
        .or(`title.ilike.${query}%,author.ilike.${query}%,category.ilike.${query}%`)
        .limit(limit * 2) // Get more to filter and deduplicate

      if (error || !data) {
        return []
      }

      const suggestions = new Set<string>()
      
      data.forEach(book => {
        // Add matching titles
        if (book.title?.toLowerCase().startsWith(query)) {
          suggestions.add(book.title.toLowerCase())
        }
        
        // Add matching authors
        if (book.author?.toLowerCase().startsWith(query)) {
          suggestions.add(book.author.toLowerCase())
        }
        
        // Add matching categories
        if (book.category?.toLowerCase().startsWith(query)) {
          suggestions.add(book.category.toLowerCase())
        }
        
        // Add matching tags
        if (book.tags) {
          book.tags.forEach(tag => {
            if (tag.toLowerCase().startsWith(query)) {
              suggestions.add(tag.toLowerCase())
            }
          })
        }
      })

      return Array.from(suggestions)
        .slice(0, limit)
        .map(suggestion => ({ suggestion, frequency: 1 }))
    } catch {
      console.error('Error in basic suggestions fallback')
      return []
    }
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(timePeriod: string = '30 days', limit: number = 10): Promise<PopularSearch[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_popular_searches', {
        time_period: timePeriod,
        search_limit: limit
      })

      if (!error && data) {
        return data as PopularSearch[]
      }

      // Fallback: return some default popular searches based on categories
      return this.getDefaultPopularSearches(limit)
    } catch (error) {
      console.warn('Advanced popular searches unavailable, using defaults')
      return this.getDefaultPopularSearches(limit)
    }
  }

  /**
   * Fallback method for popular searches
   */
  private async getDefaultPopularSearches(limit: number): Promise<PopularSearch[]> {
    try {
      // Get popular categories as default popular searches
      const categories = await this.getCategories()
      
      return categories
        .slice(0, limit)
        .map(category => ({
          search_query: category.toLowerCase(),
          search_count: Math.floor(Math.random() * 10) + 1, // Mock count
          avg_results: Math.floor(Math.random() * 20) + 5 // Mock average results
        }))
    } catch {
      // Return some hardcoded popular searches as last resort
      return [
        { search_query: 'fiction', search_count: 15, avg_results: 25 },
        { search_query: 'science', search_count: 12, avg_results: 18 },
        { search_query: 'history', search_count: 10, avg_results: 22 },
        { search_query: 'programming', search_count: 8, avg_results: 15 },
        { search_query: 'business', search_count: 7, avg_results: 12 }
      ].slice(0, limit)
    }
  }

  /**
   * Track a search query for analytics
   */
  async trackSearchQuery(query: string, resultCount: number = 0): Promise<void> {
    try {
      if (!query || query.trim().length === 0) {
        return
      }

      const { error } = await this.supabase.rpc('track_search_query', {
        query_text: query.trim(),
        result_count: resultCount,
        user_uuid: null // Will be set by RLS if user is authenticated
      })

      if (error) {
        // Silently fail tracking to not affect user experience
        console.debug('Search tracking unavailable:', error.message)
      }
    } catch {
      // Silently fail tracking to not affect user experience
      console.debug('Search tracking unavailable')
    }
  }

  /**
   * Perform unified search across books and bundles
   */
  async unifiedSearch(options: BookSearchOptions & {
    includeBooks?: boolean
    includeBundles?: boolean
  } = {}): Promise<unknown[]> {
    try {
      const { data, error } = await this.supabase.rpc('unified_search', {
        search_query: options.query || '',
        include_books: options.includeBooks !== false,
        include_bundles: options.includeBundles !== false,
        category_filter: options.category || null,
        tags_filter: options.tags || null,
        price_min: options.priceRange?.[0] || null,
        price_max: options.priceRange?.[1] || null,
        is_free_filter: options.isFree !== undefined ? options.isFree : null,
        limit_count: options.limit || 20,
        offset_count: options.offset || 0
      })

      if (error) {
        console.error('Error performing unified search:', error)
        return []
      }

      // Track search query if provided
      if (options.query && options.query.trim()) {
        this.trackSearchQuery(options.query, data?.length || 0).catch(console.error)
      }

      return data || []
    } catch (error) {
      console.error('Unexpected error in unified search:', error)
      return []
    }
  }
}

// Export singleton instance for convenience
export const clientBookRepository = new ClientBookRepository()