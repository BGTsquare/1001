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
  sortBy?: 'created_at' | 'title' | 'author' | 'price'
  sortOrder?: 'asc' | 'desc'
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
  async getAll(options: BookSearchOptions = {}): Promise<Book[]> {
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
        console.error('Error fetching books:', error)
        return []
      }

      return data as Book[]
    } catch (error) {
      console.error('Unexpected error fetching books:', error)
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
}

// Export singleton instance for convenience
export const clientBookRepository = new ClientBookRepository()