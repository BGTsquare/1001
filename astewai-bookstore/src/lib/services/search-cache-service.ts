/**
 * Search Cache Service
 * Implements client-side caching for search results to improve performance
 */

import type { SearchResult, BookSearchOptions } from '@/lib/repositories/client-book-repository'

interface CacheEntry {
  results: SearchResult[]
  total: number
  timestamp: number
  ttl: number
}

interface SearchCacheOptions {
  defaultTTL?: number // Time to live in milliseconds
  maxCacheSize?: number // Maximum number of cached entries
  enableLogging?: boolean
}

export class SearchCacheService {
  private cache = new Map<string, CacheEntry>()
  private readonly defaultTTL: number
  private readonly maxCacheSize: number
  private readonly enableLogging: boolean

  constructor(options: SearchCacheOptions = {}) {
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000 // 5 minutes
    this.maxCacheSize = options.maxCacheSize || 100
    this.enableLogging = options.enableLogging || false
  }

  /**
   * Generate a cache key from search options
   */
  private generateCacheKey(options: BookSearchOptions): string {
    const keyParts = [
      options.query || '',
      options.category || '',
      (options.tags || []).sort().join(','),
      options.priceRange ? `${options.priceRange[0]}-${options.priceRange[1]}` : '',
      options.isFree?.toString() || '',
      options.limit?.toString() || '',
      options.offset?.toString() || '',
      options.sortBy || '',
      options.sortOrder || ''
    ]
    
    return keyParts.join('|')
  }

  /**
   * Check if a cache entry is still valid
   */
  private isValidEntry(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key)
        if (this.enableLogging) {
          console.log(`[SearchCache] Expired entry removed: ${key}`)
        }
      }
    }
  }

  /**
   * Ensure cache doesn't exceed maximum size
   */
  private enforceMaxSize(): void {
    if (this.cache.size <= this.maxCacheSize) return

    // Remove oldest entries first
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    
    const entriesToRemove = entries.slice(0, this.cache.size - this.maxCacheSize)
    for (const [key] of entriesToRemove) {
      this.cache.delete(key)
      if (this.enableLogging) {
        console.log(`[SearchCache] LRU entry removed: ${key}`)
      }
    }
  }

  /**
   * Get cached search results
   */
  get(options: BookSearchOptions): { results: SearchResult[]; total: number } | null {
    const key = this.generateCacheKey(options)
    const entry = this.cache.get(key)

    if (!entry) {
      if (this.enableLogging) {
        console.log(`[SearchCache] Cache miss: ${key}`)
      }
      return null
    }

    if (!this.isValidEntry(entry)) {
      this.cache.delete(key)
      if (this.enableLogging) {
        console.log(`[SearchCache] Expired entry removed: ${key}`)
      }
      return null
    }

    if (this.enableLogging) {
      console.log(`[SearchCache] Cache hit: ${key}`)
    }

    return {
      results: entry.results,
      total: entry.total
    }
  }

  /**
   * Cache search results
   */
  set(
    options: BookSearchOptions, 
    results: SearchResult[], 
    total: number, 
    customTTL?: number
  ): void {
    const key = this.generateCacheKey(options)
    const ttl = customTTL || this.defaultTTL

    // Don't cache empty results or very large result sets
    if (results.length === 0 || results.length > 100) {
      return
    }

    // Don't cache if query is too short (likely to change frequently)
    if (options.query && options.query.length < 2) {
      return
    }

    this.cache.set(key, {
      results: [...results], // Create a copy to avoid mutations
      total,
      timestamp: Date.now(),
      ttl
    })

    if (this.enableLogging) {
      console.log(`[SearchCache] Entry cached: ${key} (${results.length} results)`)
    }

    // Cleanup and enforce limits
    this.cleanupExpiredEntries()
    this.enforceMaxSize()
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear()
    if (this.enableLogging) {
      console.log('[SearchCache] Cache cleared')
    }
  }

  /**
   * Clear entries matching a pattern
   */
  clearPattern(pattern: RegExp): void {
    let removedCount = 0
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
        removedCount++
      }
    }
    
    if (this.enableLogging) {
      console.log(`[SearchCache] Removed ${removedCount} entries matching pattern`)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    memoryUsage: number
  } {
    // Simple hit rate calculation (would need more sophisticated tracking in production)
    const size = this.cache.size
    
    // Estimate memory usage (rough calculation)
    let memoryUsage = 0
    for (const entry of this.cache.values()) {
      memoryUsage += JSON.stringify(entry).length * 2 // Rough estimate in bytes
    }

    return {
      size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Would need hit/miss tracking for accurate calculation
      memoryUsage
    }
  }

  /**
   * Prefetch popular searches
   */
  async prefetchPopularSearches(
    popularQueries: string[],
    searchFunction: (options: BookSearchOptions) => Promise<{ results: SearchResult[]; total: number }>
  ): Promise<void> {
    const prefetchPromises = popularQueries.map(async (query) => {
      const options: BookSearchOptions = {
        query,
        limit: 20,
        offset: 0,
        sortBy: 'relevance',
        sortOrder: 'desc'
      }

      // Check if already cached
      if (this.get(options)) {
        return
      }

      try {
        const result = await searchFunction(options)
        this.set(options, result.results, result.total, this.defaultTTL * 2) // Longer TTL for prefetched
        
        if (this.enableLogging) {
          console.log(`[SearchCache] Prefetched: ${query}`)
        }
      } catch (error) {
        if (this.enableLogging) {
          console.error(`[SearchCache] Prefetch failed for: ${query}`, error)
        }
      }
    })

    await Promise.allSettled(prefetchPromises)
  }

  /**
   * Warm up cache with common search patterns
   */
  async warmupCache(
    searchFunction: (options: BookSearchOptions) => Promise<{ results: SearchResult[]; total: number }>
  ): Promise<void> {
    const commonSearches: BookSearchOptions[] = [
      // Popular categories
      { category: 'Fiction', limit: 20 },
      { category: 'Non-Fiction', limit: 20 },
      { category: 'Science Fiction', limit: 20 },
      
      // Free books
      { isFree: true, limit: 20 },
      
      // Recent books
      { sortBy: 'created_at', sortOrder: 'desc', limit: 20 },
      
      // Popular price ranges
      { priceRange: [0, 10], limit: 20 },
      { priceRange: [10, 25], limit: 20 }
    ]

    const warmupPromises = commonSearches.map(async (options) => {
      if (this.get(options)) {
        return // Already cached
      }

      try {
        const result = await searchFunction(options)
        this.set(options, result.results, result.total, this.defaultTTL * 3) // Longer TTL for warmup
      } catch (error) {
        if (this.enableLogging) {
          console.error('[SearchCache] Warmup failed for options:', options, error)
        }
      }
    })

    await Promise.allSettled(warmupPromises)
    
    if (this.enableLogging) {
      console.log('[SearchCache] Cache warmup completed')
    }
  }
}

// Export singleton instance
export const searchCacheService = new SearchCacheService({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 100,
  enableLogging: process.env.NODE_ENV === 'development'
})