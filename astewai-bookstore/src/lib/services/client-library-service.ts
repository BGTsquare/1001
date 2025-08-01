import { clientLibraryRepository } from '@/lib/repositories/client-library-repository'
import { clientBookRepository } from '@/lib/repositories/client-book-repository'
import type { UserLibrary, Book } from '@/types'
import type { LibrarySearchOptions, ReadingProgressUpdate, LibraryStats } from '@/lib/types/library'

type LibraryStatus = 'owned' | 'pending' | 'completed'

export class ClientLibraryService {
  private repository = clientLibraryRepository
  private bookRepo = clientBookRepository

  /**
   * Add a book to user's library with validation
   */
  async addBookToLibrary(userId: string, bookId: string, status: LibraryStatus = 'owned'): Promise<{
    success: boolean
    data?: UserLibrary
    error?: string
  }> {
    try {
      // Validate that the book exists
      const book = await this.bookRepo.getById(bookId)
      if (!book) {
        return {
          success: false,
          error: 'Book not found'
        }
      }

      // Check if book is already in library
      const existingItem = await this.repository.getLibraryItem(userId, bookId)
      if (existingItem) {
        return {
          success: false,
          error: 'Book is already in your library'
        }
      }

      const libraryItem = await this.repository.addToLibrary(userId, bookId, status)
      
      if (!libraryItem) {
        return {
          success: false,
          error: 'Failed to add book to library'
        }
      }

      return {
        success: true,
        data: libraryItem
      }
    } catch (error) {
      console.error('Error in addBookToLibrary:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }

  /**
   * Remove a book from library with validation
   */
  async removeBookFromLibrary(userId: string, bookId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // Check if book exists in library
      const existingItem = await this.repository.getLibraryItem(userId, bookId)
      if (!existingItem) {
        return {
          success: false,
          error: 'Book is not in your library'
        }
      }

      const success = await this.repository.removeFromLibrary(userId, bookId)
      
      if (!success) {
        return {
          success: false,
          error: 'Failed to remove book from library'
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in removeBookFromLibrary:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }

  /**
   * Update reading progress with business logic
   */
  async updateReadingProgress(
    userId: string, 
    bookId: string, 
    progress: number, 
    lastReadPosition?: string
  ): Promise<{
    success: boolean
    data?: UserLibrary
    error?: string
    statusChanged?: boolean
  }> {
    try {
      // Validate progress range
      if (progress < 0 || progress > 100) {
        return {
          success: false,
          error: 'Progress must be between 0 and 100'
        }
      }

      // Check if book exists in library
      const existingItem = await this.repository.getLibraryItem(userId, bookId)
      if (!existingItem) {
        return {
          success: false,
          error: 'Book is not in your library'
        }
      }

      const previousStatus = existingItem.status
      
      const progressUpdate: ReadingProgressUpdate = {
        progress,
        lastReadPosition
      }

      // Auto-complete if progress reaches 100
      if (progress >= 100 && existingItem.status !== 'completed') {
        progressUpdate.status = 'completed'
      }

      const updatedItem = await this.repository.updateReadingProgress(userId, bookId, progressUpdate)
      
      if (!updatedItem) {
        return {
          success: false,
          error: 'Failed to update reading progress'
        }
      }

      return {
        success: true,
        data: updatedItem,
        statusChanged: previousStatus !== updatedItem.status
      }
    } catch (error) {
      console.error('Error in updateReadingProgress:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }

  /**
   * Mark a book as completed
   */
  async markBookAsCompleted(userId: string, bookId: string): Promise<{
    success: boolean
    data?: UserLibrary
    error?: string
  }> {
    try {
      const existingItem = await this.repository.getLibraryItem(userId, bookId)
      if (!existingItem) {
        return {
          success: false,
          error: 'Book is not in your library'
        }
      }

      const updatedItem = await this.repository.updateBookStatus(userId, bookId, 'completed')
      
      if (!updatedItem) {
        return {
          success: false,
          error: 'Failed to mark book as completed'
        }
      }

      return {
        success: true,
        data: updatedItem
      }
    } catch (error) {
      console.error('Error in markBookAsCompleted:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }

  /**
   * Get user's library with enhanced statistics
   */
  async getUserLibrary(userId: string, options: LibrarySearchOptions = {}): Promise<{
    success: boolean
    data?: UserLibrary[]
    stats?: LibraryStats
    error?: string
    pagination?: {
      total: number
      page: number
      limit: number
      hasMore: boolean
    }
  }> {
    try {
      const [libraryItems, stats, totalCount] = await Promise.all([
        this.repository.getUserLibrary(userId, options),
        this.getLibraryStats(userId),
        options.limit ? this.repository.getLibraryCount(userId, options.status) : Promise.resolve(0)
      ])

      let pagination
      if (options.limit) {
        const page = Math.floor((options.offset || 0) / options.limit) + 1
        const hasMore = (options.offset || 0) + options.limit < totalCount
        
        pagination = {
          total: totalCount,
          page,
          limit: options.limit,
          hasMore
        }
      }

      return {
        success: true,
        data: libraryItems,
        stats: stats.success ? stats.data : undefined,
        pagination
      }
    } catch (error) {
      console.error('Error in getUserLibrary:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }

  /**
   * Get enhanced library statistics
   */
  async getLibraryStats(userId: string): Promise<{
    success: boolean
    data?: LibraryStats
    error?: string
  }> {
    try {
      const [basicStats, allItems] = await Promise.all([
        this.repository.getLibraryStats(userId),
        this.repository.getUserLibrary(userId)
      ])

      // Calculate average progress
      const itemsWithProgress = allItems.filter(item => item.progress > 0)
      const averageProgress = itemsWithProgress.length > 0
        ? itemsWithProgress.reduce((sum, item) => sum + item.progress, 0) / itemsWithProgress.length
        : 0

      const enhancedStats: LibraryStats = {
        ...basicStats,
        averageProgress: Math.round(averageProgress * 100) / 100 // Round to 2 decimal places
      }

      return {
        success: true,
        data: enhancedStats
      }
    } catch (error) {
      console.error('Error in getLibraryStats:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }

  /**
   * Get books by status with validation
   */
  async getBooksByStatus(userId: string, status: LibraryStatus): Promise<{
    success: boolean
    data?: UserLibrary[]
    error?: string
  }> {
    try {
      const validStatuses: LibraryStatus[] = ['owned', 'pending', 'completed']
      if (!validStatuses.includes(status)) {
        return {
          success: false,
          error: 'Invalid status. Must be one of: owned, pending, completed'
        }
      }

      const books = await this.repository.getBooksByStatus(userId, status)
      
      return {
        success: true,
        data: books
      }
    } catch (error) {
      console.error('Error in getBooksByStatus:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }

  /**
   * Get books currently in progress
   */
  async getBooksInProgress(userId: string): Promise<{
    success: boolean
    data?: UserLibrary[]
    error?: string
  }> {
    try {
      const books = await this.repository.getBooksInProgress(userId)
      
      return {
        success: true,
        data: books
      }
    } catch (error) {
      console.error('Error in getBooksInProgress:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }

  /**
   * Check if user owns a book
   */
  async checkBookOwnership(userId: string, bookId: string): Promise<{
    success: boolean
    data?: {
      owned: boolean
      status?: LibraryStatus
      progress?: number
    }
    error?: string
  }> {
    try {
      const libraryItem = await this.repository.getLibraryItem(userId, bookId)
      
      return {
        success: true,
        data: {
          owned: libraryItem !== null,
          status: libraryItem?.status,
          progress: libraryItem?.progress
        }
      }
    } catch (error) {
      console.error('Error in checkBookOwnership:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }

  /**
   * Get library item with book details
   */
  async getLibraryItem(userId: string, bookId: string): Promise<{
    success: boolean
    data?: UserLibrary
    error?: string
  }> {
    try {
      const libraryItem = await this.repository.getLibraryItem(userId, bookId)
      
      if (!libraryItem) {
        return {
          success: false,
          error: 'Book not found in library'
        }
      }

      return {
        success: true,
        data: libraryItem
      }
    } catch (error) {
      console.error('Error in getLibraryItem:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }
}

// Export singleton instance for convenience
export const clientLibraryService = new ClientLibraryService()