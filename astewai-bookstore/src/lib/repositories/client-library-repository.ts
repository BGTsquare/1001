import { createClient } from '@/lib/supabase/client'
import type { UserLibrary, Book } from '@/types'
import type { Database } from '@/types/database'
import type { LibrarySearchOptions, ReadingProgressUpdate } from '@/lib/types/library'

type UserLibraryInsert = Database['public']['Tables']['user_library']['Insert']
type UserLibraryUpdate = Database['public']['Tables']['user_library']['Update']
type LibraryStatus = 'owned' | 'pending' | 'completed'

export class ClientLibraryRepository {
  private supabase = createClient()

  /**
   * Add a book to user's library
   */
  async addToLibrary(userId: string, bookId: string, status: LibraryStatus = 'owned'): Promise<UserLibrary | null> {
    try {
      // Check if book already exists in library
      const existing = await this.getLibraryItem(userId, bookId)
      if (existing) {
        console.warn('Book already exists in user library')
        return existing
      }

      const { data, error } = await this.supabase
        .from('user_library')
        .insert({
          user_id: userId,
          book_id: bookId,
          status,
          progress: 0,
          last_read_position: null
        })
        .select(`
          *,
          books (*)
        `)
        .single()

      if (error) {
        console.error('Error adding book to library:', error)
        return null
      }

      return {
        ...data,
        book: data.books
      } as UserLibrary
    } catch (error) {
      console.error('Unexpected error adding book to library:', error)
      return null
    }
  }

  /**
   * Remove a book from user's library
   */
  async removeFromLibrary(userId: string, bookId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_library')
        .delete()
        .eq('user_id', userId)
        .eq('book_id', bookId)

      if (error) {
        console.error('Error removing book from library:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Unexpected error removing book from library:', error)
      return false
    }
  }

  /**
   * Get user's complete library with optional filtering
   */
  async getUserLibrary(userId: string, options: LibrarySearchOptions = {}): Promise<UserLibrary[]> {
    try {
      let query = this.supabase
        .from('user_library')
        .select(`
          *,
          books (*)
        `)
        .eq('user_id', userId)

      // Apply status filter
      if (options.status) {
        query = query.eq('status', options.status)
      }

      // Apply sorting
      const sortBy = options.sortBy || 'added_at'
      const sortOrder = options.sortOrder || 'desc'
      
      if (sortBy === 'title') {
        // Sort by book title requires joining
        query = query.order('books.title', { ascending: sortOrder === 'asc' })
      } else {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' })
      }

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
        console.error('Error fetching user library:', error)
        return []
      }

      return data.map(item => ({
        ...item,
        book: item.books
      })) as UserLibrary[]
    } catch (error) {
      console.error('Unexpected error fetching user library:', error)
      return []
    }
  }

  /**
   * Get a specific library item
   */
  async getLibraryItem(userId: string, bookId: string): Promise<UserLibrary | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_library')
        .select(`
          *,
          books (*)
        `)
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null
        }
        console.error('Error fetching library item:', error)
        return null
      }

      return {
        ...data,
        book: data.books
      } as UserLibrary
    } catch (error) {
      console.error('Unexpected error fetching library item:', error)
      return null
    }
  }

  /**
   * Update reading progress for a book
   */
  async updateReadingProgress(
    userId: string, 
    bookId: string, 
    progressUpdate: ReadingProgressUpdate
  ): Promise<UserLibrary | null> {
    try {
      const updateData: any = {
        progress: Math.max(0, Math.min(100, progressUpdate.progress)), // Clamp between 0-100
        updated_at: new Date().toISOString()
      }

      if (progressUpdate.lastReadPosition !== undefined) {
        updateData.last_read_position = progressUpdate.lastReadPosition
      }

      // Auto-update status based on progress
      if (progressUpdate.progress >= 100) {
        updateData.status = 'completed'
      } else if (progressUpdate.progress > 0 && progressUpdate.status !== 'completed') {
        // Don't override completed status unless explicitly set
        updateData.status = progressUpdate.status || 'owned'
      }

      const { data, error } = await this.supabase
        .from('user_library')
        .update(updateData)
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .select(`
          *,
          books (*)
        `)
        .single()

      if (error) {
        console.error('Error updating reading progress:', error)
        return null
      }

      return {
        ...data,
        book: data.books
      } as UserLibrary
    } catch (error) {
      console.error('Unexpected error updating reading progress:', error)
      return null
    }
  }

  /**
   * Update book status in library
   */
  async updateBookStatus(userId: string, bookId: string, status: LibraryStatus): Promise<UserLibrary | null> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      // If marking as completed, set progress to 100
      if (status === 'completed') {
        updateData.progress = 100
      }

      const { data, error } = await this.supabase
        .from('user_library')
        .update(updateData)
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .select(`
          *,
          books (*)
        `)
        .single()

      if (error) {
        console.error('Error updating book status:', error)
        return null
      }

      return {
        ...data,
        book: data.books
      } as UserLibrary
    } catch (error) {
      console.error('Unexpected error updating book status:', error)
      return null
    }
  }

  /**
   * Get library statistics for a user
   */
  async getLibraryStats(userId: string): Promise<{
    total: number
    owned: number
    pending: number
    completed: number
    inProgress: number
  }> {
    try {
      // Get all library items for the user
      const { data, error } = await this.supabase
        .from('user_library')
        .select('status, progress')
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching library stats:', error)
        return { total: 0, owned: 0, pending: 0, completed: 0, inProgress: 0 }
      }

      const stats = {
        total: data.length,
        owned: 0,
        pending: 0,
        completed: 0,
        inProgress: 0
      }

      data.forEach(item => {
        stats[item.status as keyof typeof stats]++
        if (item.status === 'owned' && item.progress > 0 && item.progress < 100) {
          stats.inProgress++
        }
      })

      return stats
    } catch (error) {
      console.error('Unexpected error fetching library stats:', error)
      return { total: 0, owned: 0, pending: 0, completed: 0, inProgress: 0 }
    }
  }

  /**
   * Check if a book is in user's library
   */
  async isBookInLibrary(userId: string, bookId: string): Promise<boolean> {
    const item = await this.getLibraryItem(userId, bookId)
    return item !== null
  }

  /**
   * Get books by status
   */
  async getBooksByStatus(userId: string, status: LibraryStatus): Promise<UserLibrary[]> {
    return this.getUserLibrary(userId, { status })
  }

  /**
   * Get books currently in progress (owned with progress > 0 and < 100)
   */
  async getBooksInProgress(userId: string): Promise<UserLibrary[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_library')
        .select(`
          *,
          books (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'owned')
        .gt('progress', 0)
        .lt('progress', 100)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching books in progress:', error)
        return []
      }

      return data.map(item => ({
        ...item,
        book: item.books
      })) as UserLibrary[]
    } catch (error) {
      console.error('Unexpected error fetching books in progress:', error)
      return []
    }
  }

  /**
   * Get library count for pagination
   */
  async getLibraryCount(userId: string, status?: LibraryStatus): Promise<number> {
    try {
      let query = this.supabase
        .from('user_library')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (status) {
        query = query.eq('status', status)
      }

      const { count, error } = await query

      if (error) {
        console.error('Error counting library items:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Unexpected error counting library items:', error)
      return 0
    }
  }
}

// Export singleton instance for convenience
export const clientLibraryRepository = new ClientLibraryRepository()