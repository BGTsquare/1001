import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SearchCacheService } from '../search-cache-service'
import type { BookSearchOptions, SearchResult } from '@/lib/repositories/client-book-repository'

describe('SearchCacheService', () => {
  let cacheService: SearchCacheService

  beforeEach(() => {
    cacheService = new SearchCacheService({
      defaultTTL: 1000, // 1 second for testing
      maxCacheSize: 3,
      enableLogging: false
    })
  })

  describe('cache operations', () => {
    const mockOptions: BookSearchOptions = {
      query: 'test',
      category: 'Fiction',
      limit: 10
    }

    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test Description',
        cover_image_url: '',
        content_url: '',
        price: 10,
        is_free: false,
        category: 'Fiction',
        tags: ['test'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        search_rank: 0.8
      }
    ]

    it('should cache and retrieve search results', () => {
      cacheService.set(mockOptions, mockResults, 1)
      const cached = cacheService.get(mockOptions)

      expect(cached).toEqual({
        results: mockResults,
        total: 1
      })
    })

    it('should return null for cache miss', () => {
      const cached = cacheService.get(mockOptions)
      expect(cached).toBeNull()
    })

    it('should expire entries after TTL', (done) => {
      cacheService.set(mockOptions, mockResults, 1)
      
      // Should be cached immediately
      expect(cacheService.get(mockOptions)).not.toBeNull()

      // Should expire after TTL
      setTimeout(() => {
        expect(cacheService.get(mockOptions)).toBeNull()
        done()
      }, 1100)
    })

    it('should enforce maximum cache size', () => {
      const options1: BookSearchOptions = { query: 'test1' }
      const options2: BookSearchOptions = { query: 'test2' }
      const options3: BookSearchOptions = { query: 'test3' }
      const options4: BookSearchOptions = { query: 'test4' }

      cacheService.set(options1, mockResults, 1)
      cacheService.set(options2, mockResults, 1)
      cacheService.set(options3, mockResults, 1)
      cacheService.set(options4, mockResults, 1) // Should evict oldest

      expect(cacheService.get(options1)).toBeNull() // Evicted
      expect(cacheService.get(options2)).not.toBeNull()
      expect(cacheService.get(options3)).not.toBeNull()
      expect(cacheService.get(options4)).not.toBeNull()
    })

    it('should not cache empty results', () => {
      cacheService.set(mockOptions, [], 0)
      expect(cacheService.get(mockOptions)).toBeNull()
    })

    it('should not cache very short queries', () => {
      const shortQueryOptions: BookSearchOptions = { query: 'a' }
      cacheService.set(shortQueryOptions, mockResults, 1)
      expect(cacheService.get(shortQueryOptions)).toBeNull()
    })
  })

  describe('cache management', () => {
    it('should clear all entries', () => {
      const options: BookSearchOptions = { query: 'test' }
      const mockResults: SearchResult[] = []
      
      cacheService.set(options, mockResults, 1)
      expect(cacheService.get(options)).not.toBeNull()

      cacheService.clear()
      expect(cacheService.get(options)).toBeNull()
    })

    it('should clear entries matching pattern', () => {
      const options1: BookSearchOptions = { query: 'fiction' }
      const options2: BookSearchOptions = { query: 'science' }
      const mockResults: SearchResult[] = []

      cacheService.set(options1, mockResults, 1)
      cacheService.set(options2, mockResults, 1)

      cacheService.clearPattern(/fiction/)

      expect(cacheService.get(options1)).toBeNull()
      expect(cacheService.get(options2)).not.toBeNull()
    })

    it('should provide cache statistics', () => {
      const stats = cacheService.getStats()
      
      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('maxSize')
      expect(stats).toHaveProperty('hitRate')
      expect(stats).toHaveProperty('memoryUsage')
      expect(typeof stats.size).toBe('number')
      expect(typeof stats.maxSize).toBe('number')
    })
  })

  describe('prefetching', () => {
    it('should prefetch popular searches', async () => {
      const mockSearchFunction = vi.fn().mockResolvedValue({
        results: [],
        total: 0
      })

      const popularQueries = ['fiction', 'science', 'history']
      
      await cacheService.prefetchPopularSearches(popularQueries, mockSearchFunction)

      expect(mockSearchFunction).toHaveBeenCalledTimes(3)
      expect(mockSearchFunction).toHaveBeenCalledWith({
        query: 'fiction',
        limit: 20,
        offset: 0,
        sortBy: 'relevance',
        sortOrder: 'desc'
      })
    })

    it('should skip already cached queries during prefetch', async () => {
      const mockSearchFunction = vi.fn().mockResolvedValue({
        results: [],
        total: 0
      })

      // Pre-cache one query
      const options: BookSearchOptions = {
        query: 'fiction',
        limit: 20,
        offset: 0,
        sortBy: 'relevance',
        sortOrder: 'desc'
      }
      cacheService.set(options, [], 0)

      await cacheService.prefetchPopularSearches(['fiction', 'science'], mockSearchFunction)

      // Should only call for 'science', not 'fiction'
      expect(mockSearchFunction).toHaveBeenCalledTimes(1)
      expect(mockSearchFunction).toHaveBeenCalledWith({
        query: 'science',
        limit: 20,
        offset: 0,
        sortBy: 'relevance',
        sortOrder: 'desc'
      })
    })
  })

  describe('cache key generation', () => {
    it('should generate consistent cache keys for same options', () => {
      const options1: BookSearchOptions = {
        query: 'test',
        category: 'Fiction',
        tags: ['tag1', 'tag2'],
        limit: 10
      }

      const options2: BookSearchOptions = {
        query: 'test',
        category: 'Fiction',
        tags: ['tag1', 'tag2'],
        limit: 10
      }

      const mockResults: SearchResult[] = []
      
      cacheService.set(options1, mockResults, 1)
      const cached = cacheService.get(options2)

      expect(cached).not.toBeNull()
    })

    it('should generate different cache keys for different options', () => {
      const options1: BookSearchOptions = { query: 'test1' }
      const options2: BookSearchOptions = { query: 'test2' }
      const mockResults: SearchResult[] = []

      cacheService.set(options1, mockResults, 1)
      const cached = cacheService.get(options2)

      expect(cached).toBeNull()
    })
  })
})