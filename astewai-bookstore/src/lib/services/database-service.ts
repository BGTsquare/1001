import type { Bundle, BlogPost, UserLibrary, Purchase, Book } from '@/types'
import { bookRepository } from '@/lib/books'
import { libraryRepository } from '@/lib/library'
import { purchaseRepository } from '@/lib/repositories/purchase-repository'
import { bundleRepository } from '@/lib/repositories/bundle-repository'
import { blogRepository } from '@/lib/repositories/blog-repository'

/**
 * Unified database service providing a clean interface to all data operations.
 * 
 * This service acts as a facade over the repository layer, providing:
 * - Consistent error handling across all operations
 * - Simplified API for common database operations
 * - Type-safe interfaces for all data access
 * - Centralized business logic for complex operations
 * 
 * @example
 * ```typescript
 * import { databaseService } from '@/lib/services/database-service'
 * 
 * // Get books with filters
 * const books = await databaseService.getBooks({ 
 *   category: 'fiction', 
 *   limit: 10 
 * })
 * 
 * // Create a purchase
 * const purchase = await databaseService.createPurchase(
 *   userId, 
 *   'book', 
 *   bookId, 
 *   29.99
 * )
 * ```
 */
export class DatabaseService {
  // Book operations
  async getBooks(filters?: {
    category?: string
    search?: string
    isFree?: boolean
    limit?: number
    offset?: number
  }): Promise<Book[]> {
    const result = await bookRepository.getAll({
      category: filters?.category,
      query: filters?.search,
      isFree: filters?.isFree,
      limit: filters?.limit,
      offset: filters?.offset
    })
    return result.success ? result.data : []
  }

  async getBookById(id: string): Promise<Book | null> {
    const result = await bookRepository.getById(id)
    return result.success ? result.data : null
  }

  // Bundle operations
  async getBundles(): Promise<Bundle[]> {
    return await bundleRepository.getAll({}, true)
  }

  async getBundleById(id: string): Promise<Bundle | null> {
    return await bundleRepository.getById(id, true)
  }

  // Blog operations
  async getBlogPosts(filters?: {
    category?: string
    published?: boolean
    limit?: number
    offset?: number
  }): Promise<BlogPost[]> {
    return await blogRepository.getAll({
      category: filters?.category,
      published: filters?.published,
      limit: filters?.limit,
      offset: filters?.offset
    })
  }

  async getBlogPostById(id: string): Promise<BlogPost | null> {
    return await blogRepository.getById(id)
  }

  // User library operations
  async getUserLibrary(userId: string, status?: 'owned' | 'pending' | 'completed'): Promise<UserLibrary[]> {
    const result = await libraryRepository.getUserLibrary(userId, { status })
    return result.success ? result.data : []
  }

  async addToLibrary(userId: string, bookId: string, status: 'owned' | 'pending' = 'owned'): Promise<boolean> {
    const result = await libraryRepository.addToLibrary(userId, bookId, status)
    return result.success
  }

  async updateReadingProgress(userId: string, bookId: string, progress: number, position?: string): Promise<boolean> {
    const result = await libraryRepository.updateReadingProgress(userId, bookId, {
      progress,
      lastReadPosition: position
    })
    return result.success
  }

  // Purchase operations
  async createPurchase(userId: string, itemType: 'book' | 'bundle', itemId: string, amount: number): Promise<Purchase | null> {
    return await purchaseRepository.create({
      userId,
      itemType,
      itemId,
      amount,
      status: 'pending'
    })
  }

  async getUserPurchases(userId: string): Promise<Purchase[]> {
    return await purchaseRepository.getUserPurchases(userId)
  }

  async getPurchaseById(id: string): Promise<Purchase | null> {
    return await purchaseRepository.getById(id)
  }

  async updatePurchase(id: string, updates: {
    status?: string
    telegramChatId?: number
    telegramUserId?: number
    transactionReference?: string
  }): Promise<Purchase | null> {
    return await purchaseRepository.update(id, updates)
  }

  // Advanced operations
  async searchBooks(query: string, filters?: {
    category?: string
    isFree?: boolean
    limit?: number
  }): Promise<Book[]> {
    const result = await bookRepository.getAll({
      query,
      category: filters?.category,
      isFree: filters?.isFree,
      limit: filters?.limit
    })
    return result.success ? result.data : []
  }

  async searchBundles(query: string, limit?: number): Promise<Bundle[]> {
    return await bundleRepository.search(query, { limit })
  }

  async searchBlogPosts(query: string, limit?: number): Promise<BlogPost[]> {
    return await blogRepository.search(query, { limit })
  }

  // Utility methods
  async hasUserPurchased(userId: string, itemType: 'book' | 'bundle', itemId: string): Promise<boolean> {
    return await purchaseRepository.hasUserPurchased(userId, itemType, itemId)
  }

  async getBundleValue(bundleId: string) {
    return await bundleRepository.calculateBundleValue(bundleId)
  }
}

// Export singleton instance
export const databaseService = new DatabaseService()