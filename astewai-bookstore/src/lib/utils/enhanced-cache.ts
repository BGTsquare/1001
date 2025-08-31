/**
 * Enhanced caching system with multiple storage layers and intelligent invalidation
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
  tags: string[]
}

interface CacheOptions {
  ttl?: number
  tags?: string[]
  priority?: 'low' | 'medium' | 'high'
}

export class EnhancedCache {
  private memoryCache = new Map<string, CacheEntry<any>>()
  private maxMemorySize: number
  private compressionEnabled: boolean
  private persistentStorage: boolean

  constructor(options: {
    maxMemorySize?: number
    compressionEnabled?: boolean
    persistentStorage?: boolean
  } = {}) {
    this.maxMemorySize = options.maxMemorySize || 100
    this.compressionEnabled = options.compressionEnabled || false
    this.persistentStorage = options.persistentStorage || false

    // Cleanup expired entries every 5 minutes
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 5 * 60 * 1000)
    }
  }

  /**
   * Set cache entry with enhanced options
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const {
      ttl = 5 * 60 * 1000, // 5 minutes default
      tags = [],
      priority = 'medium'
    } = options

    const entry: CacheEntry<T> = {
      data: this.compressionEnabled ? this.compress(data) : data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags
    }

    // Evict if memory is full
    if (this.memoryCache.size >= this.maxMemorySize) {
      this.evictLeastUsed()
    }

    this.memoryCache.set(key, entry)

    // Persist to localStorage if enabled
    if (this.persistentStorage && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(entry))
      } catch (error) {
        console.warn('Failed to persist cache entry:', error)
      }
    }
  }

  /**
   * Get cache entry with access tracking
   */
  get<T>(key: string): T | null {
    let entry = this.memoryCache.get(key)

    // Try persistent storage if not in memory
    if (!entry && this.persistentStorage && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`cache_${key}`)
        if (stored) {
          entry = JSON.parse(stored)
          if (entry && !this.isExpired(entry)) {
            this.memoryCache.set(key, entry)
          }
        }
      } catch (error) {
        console.warn('Failed to retrieve from persistent storage:', error)
      }
    }

    if (!entry || this.isExpired(entry)) {
      this.delete(key)
      return null
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = Date.now()

    return this.compressionEnabled ? this.decompress(entry.data) : entry.data
  }

  /**
   * Delete cache entry
   */
  delete(key: string): void {
    this.memoryCache.delete(key)
    
    if (this.persistentStorage && typeof window !== 'undefined') {
      localStorage.removeItem(`cache_${key}`)
    }
  }

  /**
   * Clear cache by tags
   */
  clearByTags(tags: string[]): void {
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    hitRate: number
    memoryUsage: number
    topKeys: Array<{ key: string; accessCount: number }>
  } {
    const entries = Array.from(this.memoryCache.entries())
    const totalAccess = entries.reduce((sum, [, entry]) => sum + entry.accessCount, 0)
    
    return {
      size: this.memoryCache.size,
      hitRate: totalAccess > 0 ? entries.length / totalAccess : 0,
      memoryUsage: this.memoryCache.size / this.maxMemorySize,
      topKeys: entries
        .map(([key, entry]) => ({ key, accessCount: entry.accessCount }))
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 10)
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.delete(key)
      }
    }
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastUsed(): void {
    const entries = Array.from(this.memoryCache.entries())
    entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
    
    // Remove oldest 20% of entries
    const toRemove = Math.ceil(entries.length * 0.2)
    for (let i = 0; i < toRemove; i++) {
      this.delete(entries[i][0])
    }
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  /**
   * Compress data (placeholder for actual compression)
   */
  private compress<T>(data: T): T {
    // In a real implementation, you might use LZ-string or similar
    return data
  }

  /**
   * Decompress data (placeholder for actual decompression)
   */
  private decompress<T>(data: T): T {
    return data
  }
}

// Enhanced cache wrapper function
export async function withEnhancedCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const cached = enhancedCache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  const data = await fetcher()
  enhancedCache.set(key, data, options)
  return data
}

// Singleton instance
export const enhancedCache = new EnhancedCache({
  maxMemorySize: 200,
  compressionEnabled: true,
  persistentStorage: true
})

// Cache invalidation helpers
export const cacheInvalidation = {
  invalidateBooks: () => enhancedCache.clearByTags(['books']),
  invalidateBundles: () => enhancedCache.clearByTags(['bundles']),
  invalidateUser: (userId: string) => enhancedCache.clearByTags([`user:${userId}`]),
  invalidateAll: () => enhancedCache.memoryCache.clear()
}
