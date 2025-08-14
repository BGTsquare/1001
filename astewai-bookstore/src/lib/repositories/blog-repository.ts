import { createClient as createClientClient } from '@/lib/supabase/client'
import type { BlogPost } from '@/types'
import type { Database } from '@/types/database'

type BlogPostInsert = Database['public']['Tables']['blog_posts']['Insert']
type BlogPostUpdate = Database['public']['Tables']['blog_posts']['Update']

export interface BlogSearchOptions {
  category?: string
  published?: boolean
  query?: string
  limit?: number
  offset?: number
  sortBy?: 'created_at' | 'updated_at' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export class BlogRepository {
  private supabase: any
  private isClient: boolean

  constructor(isClient = false) {
    this.isClient = isClient
    if (isClient) {
      this.supabase = createClientClient()
    } else {
      this.supabase = null
    }
  }

  /**
   * Get all blog posts with optional filtering
   */
  async getAll(options: BlogSearchOptions = {}): Promise<BlogPost[]> {
    try {
      const supabase = await this.getSupabaseClient()
      let query = supabase.from('blog_posts').select('*')

      // Apply filters
      if (options.category) {
        query = query.eq('category', options.category)
      }

      if (options.published !== undefined) {
        query = query.eq('published', options.published)
      }

      if (options.query) {
        query = query.or(`title.ilike.%${options.query}%,content.ilike.%${options.query}%,excerpt.ilike.%${options.query}%`)
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
        console.error('Error fetching blog posts:', error)
        return []
      }

      return data as BlogPost[]
    } catch (error) {
      console.error('Unexpected error fetching blog posts:', error)
      return []
    }
  }

  /**
   * Get blog post by ID
   */
  async getById(id: string): Promise<BlogPost | null> {
    try {
      const supabase = await this.getSupabaseClient()
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('Error fetching blog post:', error)
        return null
      }

      return data as BlogPost
    } catch (error) {
      console.error('Unexpected error fetching blog post:', error)
      return null
    }
  }

  /**
   * Get blog post by slug
   */
  async getBySlug(slug: string): Promise<BlogPost | null> {
    try {
      const supabase = await this.getSupabaseClient()
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('Error fetching blog post by slug:', error)
        return null
      }

      return data as BlogPost
    } catch (error) {
      console.error('Unexpected error fetching blog post by slug:', error)
      return null
    }
  }

  /**
   * Create a new blog post
   */
  async create(postData: BlogPostInsert): Promise<BlogPost | null> {
    try {
      const supabase = await this.getSupabaseClient()
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(postData)
        .select()
        .single()

      if (error) {
        console.error('Error creating blog post:', error)
        return null
      }

      return data as BlogPost
    } catch (error) {
      console.error('Unexpected error creating blog post:', error)
      return null
    }
  }

  /**
   * Update a blog post
   */
  async update(id: string, updates: BlogPostUpdate): Promise<BlogPost | null> {
    try {
      const supabase = await this.getSupabaseClient()
      const { data, error } = await supabase
        .from('blog_posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating blog post:', error)
        return null
      }

      return data as BlogPost
    } catch (error) {
      console.error('Unexpected error updating blog post:', error)
      return null
    }
  }

  /**
   * Delete a blog post
   */
  async delete(id: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabaseClient()
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting blog post:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Unexpected error deleting blog post:', error)
      return false
    }
  }

  /**
   * Get published blog posts
   */
  async getPublished(options: Omit<BlogSearchOptions, 'published'> = {}): Promise<BlogPost[]> {
    return this.getAll({ ...options, published: true })
  }

  /**
   * Search blog posts
   */
  async search(searchTerm: string, options: Omit<BlogSearchOptions, 'query'> = {}): Promise<BlogPost[]> {
    return this.getAll({ ...options, query: searchTerm })
  }

  /**
   * Get blog posts by category
   */
  async getByCategory(category: string, options: Omit<BlogSearchOptions, 'category'> = {}): Promise<BlogPost[]> {
    return this.getAll({ ...options, category })
  }

  /**
   * Get total count of blog posts
   */
  async getCount(filters: Omit<BlogSearchOptions, 'limit' | 'offset' | 'sortBy' | 'sortOrder'> = {}): Promise<number> {
    try {
      const supabase = await this.getSupabaseClient()
      let query = supabase.from('blog_posts').select('*', { count: 'exact', head: true })

      // Apply same filters as getAll
      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.published !== undefined) {
        query = query.eq('published', filters.published)
      }

      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,content.ilike.%${filters.query}%,excerpt.ilike.%${filters.query}%`)
      }

      const { count, error } = await query

      if (error) {
        console.error('Error counting blog posts:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Unexpected error counting blog posts:', error)
      return 0
    }
  }

  private async getSupabaseClient() {
    if (this.isClient) {
      return this.supabase
    } else {
      if (!this.supabase) {
        const { createClient } = await import('@/lib/supabase/server')
        this.supabase = await createClient()
      }
      return this.supabase
    }
  }
}

// Export singleton instances
export const blogRepository = new BlogRepository()
export const clientBlogRepository = new BlogRepository(true)