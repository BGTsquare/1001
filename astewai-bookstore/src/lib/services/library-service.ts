import { libraryRepository, clientLibraryRepository } from '@/lib/repositories/library-repository'
import { bookRepository } from '@/lib/repositories/book-repository'
import type { UserLibrary, Book } from '@/types'
import type { LibrarySearchOptions, ReadingProgressUpdate } from '@/lib/repositories/library-repository'

type LibraryStatus = 'owned' | 'pending' | 'completed'

export interface LibraryStats {
  total: number
  owned: number
  pending: number
  completed: number
  inProgress: number
  averageProgress: number
}

export interface LibraryServiceOptions {
  isClient?: boolean
}

export class LibraryService {
  private repository: typeof libraryRepository

  constructor(options: LibraryServiceOptions = {}) {
    this.repository = options.isClient ? clientLibraryRepository : libraryRepository
  }

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
      const book = await bookRepository.getById(bookId)
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
   * Add multiple books to library (for bundle purchases)
   */
  async addBooksToLibrary(userId: string, bookIds: string[], status: LibraryStatus = 'owned'): Promise<{
    success: boolean
    data?: UserLibrary[]
    error?: string
    skipped?: string[]
  }> {
    try {
      // Validate all books exist
      const books = await Promise.all(
        bookIds.map(id => bookRepository.getById(id))
      )
      
      const invalidBooks = bookIds.filter((_, index) => !books[index])
      if (invalidBooks.length > 0) {
        return {
          success: false,
          error: `Some books were not found: ${invalidBooks.join(', ')}`
        }
      }

      // Check for existing books
      const existingChecks = await Promise.all(
        bookIds.map(bookId => this.repository.isBookInLibrary(userId, bookId))
      )
      
      const newBookIds = bookIds.filter((_, index) => !existingChecks[index])
      const skippedBookIds = bookIds.filter((_, index) => existingChecks[index])

      if (newBookIds.length === 0) {
        return {
          success: true,
          data: [],
          skipped: skippedBookIds,
          error: 'All books are already in your library'
        }
      }

      const libraryItems = await this.repository.addBooksToLibrary(userId, newBookIds, status)
      
      return {
        success: true,
        data: libraryItems,
        skipped: skippedBookIds
      }
    } catch (error) {
      console.error('Error in addBooksToLibrary:', error)
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
   * Get reading recommendations based on library
   */
  async getReadingRecommendations(userId: string, limit: number = 5): Promise<{
    success: boolean
    data?: {
      continueReading: UserLibrary[]
      recentlyAdded: UserLibrary[]
      suggestions: Book[]
    }
    error?: string
  }> {
    try {
      const [inProgress, recentlyAdded, userLibrary] = await Promise.all([
        this.repository.getBooksInProgress(userId),
        this.repository.getRecentlyAdded(userId, limit),
        this.repository.getUserLibrary(userId)
      ])

      // Get categories and tags from user's library for suggestions
      const userCategories = [...new Set(
        userLibrary
          .map(item => item.book?.category)
          .filter(Boolean)
      )] as string[]

      const userTags = [...new Set(
        userLibrary
          .flatMap(item => item.book?.tags || [])
          .filter(Boolean)
      )] as string[]

      // Get book suggestions based on user's preferences
      let suggestions: Book[] = []
      if (userCategories.length > 0 || userTags.length > 0) {
        const ownedBookIds = userLibrary.map(item => item.book_id)
        
        // Get books from similar categories/tags that user doesn't own
        const potentialSuggestions = await bookRepository.getAll({
          limit: limit * 2 // Get more to filter out owned books
        })
        
        suggestions = potentialSuggestions
          .filter(book => !ownedBookIds.includes(book.id))
          .filter(book => 
            (book.category && userCategories.includes(book.category)) ||
            (book.tags && book.tags.some(tag => userTags.includes(tag)))
          )
          .slice(0, limit)
      }

      return {
        success: true,
        data: {
          continueReading: inProgress.slice(0, limit),
          recentlyAdded: recentlyAdded.slice(0, limit),
          suggestions
        }
      }
    } catch (error) {
      console.error('Error in getReadingRecommendations:', error)
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

// Export singleton instances for convenience
export const libraryService = new LibraryService()
export const clientLibraryService = new LibraryService({ isClient: true })