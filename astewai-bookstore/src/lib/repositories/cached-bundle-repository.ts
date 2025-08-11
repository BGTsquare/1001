import { BundleRepository, type BundleSearchOptions, type RepositoryResult } from './improved-bundle-repository'
import type { Bundle } from '@/types'

// Simple in-memory cache implementation
class MemoryCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>()

  set(key: string, data: T, ttlMs = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

export class CachedBundleRepository extends BundleRepository {
  private cache = new MemoryCache<any>()
  private readonly CACHE_TTL = {
    BUNDLE_BY_ID: 300000,      // 5 minutes
    BUNDLE_LIST: 60000,        // 1 minute
    BUNDLE_COUNT: 120000,      // 2 minutes
    BUNDLE_BOOKS: 300000       // 5 minutes
  }

  constructor(isClient = false) {
    super(isClient)
    
    // Cleanup expired cache entries every 5 minutes
    if (typeof window !== 'undefined' || isClient) {
      setInterval(() => this.cache.cleanup(), 300000)
    }
  }

  private getCacheKey(operation: string, params: any): string {
    return `${operation}:${JSON.stringify(params)}`
  }

  async getById(id: string, includeBooks = true): Promise<RepositoryResult<Bundle>> {
    const cacheKey = this.getCacheKey('getById', { id, includeBooks })
    const cached = this.cache.get(cacheKey)
    
    if (cached) {
      return { success: true, data: cached }
    }

    const result = await super.getById(id, includeBooks)
    
    if (result.success) {
      this.cache.set(cacheKey, result.data, this.CACHE_TTL.BUNDLE_BY_ID)
    }

    return result
  }

  async getAll(options: BundleSearchOptions = {}, includeBooks = true): Promise<RepositoryResult<Bundle[]>> {
    // Only cache simple queries without search terms
    const shouldCache = !options.query && !options.priceRange
    const cacheKey = shouldCache ? this.getCacheKey('getAll', { options, includeBooks }) : null
    
    if (cacheKey) {
      const cached = this.cache.get(cacheKey)
      if (cached) {
        return { success: true, data: cached }
      }
    }

    const result = await super.getAll(options, includeBooks)
    
    if (result.success && cacheKey) {
      this.cache.set(cacheKey, result.data, this.CACHE_TTL.BUNDLE_LIST)
    }

    return result
  }

  async getCount(filters = {}): Promise<RepositoryResult<number>> {
    const cacheKey = this.getCacheKey('getCount', filters)
    const cached = this.cache.get(cacheKey)
    
    if (cached !== null) {
      return { success: true, data: cached }
    }

    const result = await super.getCount(filters)
    
    if (result.success) {
      this.cache.set(cacheKey, result.data, this.CACHE_TTL.BUNDLE_COUNT)
    }

    return result
  }

  // Invalidate cache when data changes
  async create(bundleData: any): Promise<RepositoryResult<Bundle>> {
    const result = await super.create(bundleData)
    
    if (result.success) {
      this.invalidateListCaches()
    }

    return result
  }

  async update(id: string, updates: any): Promise<RepositoryResult<Bundle>> {
    const result = await super.update(id, updates)
    
    if (result.success) {
      this.invalidateBundleCache(id)
      this.invalidateListCaches()
    }

    return result
  }

  async delete(id: string): Promise<RepositoryResult<void>> {
    const result = await super.delete(id)
    
    if (result.success) {
      this.invalidateBundleCache(id)
      this.invalidateListCaches()
    }

    return result
  }

  async setBundleBooks(bundleId: string, bookIds: string[]): Promise<RepositoryResult<void>> {
    const result = await super.setBundleBooks(bundleId, bookIds)
    
    if (result.success) {
      this.invalidateBundleCache(bundleId)
    }

    return result
  }

  private invalidateBundleCache(bundleId: string): void {
    // Remove all cached entries for this bundle
    for (const key of Array.from(this.cache['cache'].keys())) {
      if (key.includes(`"id":"${bundleId}"`)) {
        this.cache.delete(key)
      }
    }
  }

  private invalidateListCaches(): void {
    // Remove all list and count caches
    for (const key of Array.from(this.cache['cache'].keys())) {
      if (key.startsWith('getAll:') || key.startsWith('getCount:')) {
        this.cache.delete(key)
      }
    }
  }

  // Manual cache management
  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): { size: number; keys: string[] } {
    const keys = Array.from(this.cache['cache'].keys())
    return {
      size: keys.length,
      keys
    }
  }
}

// Export cached instances
export const cachedBundleRepository = new CachedBundleRepository()
export const cachedClientBundleRepository = new CachedBundleRepository(true)