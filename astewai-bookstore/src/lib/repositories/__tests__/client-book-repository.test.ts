import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ClientBookRepository } from '../client-book-repository'
import type { BookSearchOptions } from '../client-book-repository'

// Mock Supabase client
const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      })),
      not: vi.fn(() => ({})),
      in: vi.fn(() => ({}))
    }))
  }))
}

// Mock the Supabase client module
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}))

describe('ClientBookRepository', () => {
  let repository: ClientBookRepository

  beforeEach(() => {
    repository = new ClientBookRepository()
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('should call search_books RPC function with correct parameters', async () => {
      const mockResults = [
        {
          id: '1',
          title: 'Test Book',
          author: 'Test Author',
          description: 'Test Description',
          search_rank: 0.8
        }
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: mockResults,
        error: null
      })

      const options: BookSearchOptions = {
        query: 'test',
        category: 'Fiction',
        limit: 10,
        offset: 0,
        sortBy: 'relevance',
        sortOrder: 'desc'
      }

      const result = await repository.getAll(options)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('search_books', {
        search_query: 'test',
        category_filter: 'Fiction',
        tags_filter: null,
        price_min: null,
        price_max: null,
        is_free_filter: null,
        limit_count: 10,
        offset_count: 0,
        sort_by: 'relevance',
        sort_order: 'desc'
      })

      expect(result).toEqual(mockResults)
    })

    it('should handle RPC function errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      // Mock the fallback basic search
      const mockBasicResults = [{ id: '1', title: 'Fallback Book' }]
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            or: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => ({
                  range: jest.fn(() => ({
                    data: mockBasicResults,
                    error: null
                  }))
                }))
              }))
            }))
          }))
        }))
      })

      const result = await repository.getAll({ query: 'test' })

      expect(result).toEqual(mockBasicResults)
    })

    it('should track search queries when provided', async () => {
      const mockResults = [{ id: '1', title: 'Test Book' }]
      mockSupabase.rpc.mockResolvedValue({
        data: mockResults,
        error: null
      })

      const trackSpy = vi.spyOn(repository, 'trackSearchQuery').mockResolvedValue()

      await repository.getAll({ query: 'test query' })

      expect(trackSpy).toHaveBeenCalledWith('test query', 1)
    })
  })

  describe('getSearchSuggestions', () => {
    it('should call get_search_suggestions RPC function', async () => {
      const mockSuggestions = [
        { suggestion: 'test book', frequency: 5 },
        { suggestion: 'test author', frequency: 3 }
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: mockSuggestions,
        error: null
      })

      const result = await repository.getSearchSuggestions('test', 10)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_search_suggestions', {
        partial_query: 'test',
        suggestion_limit: 10
      })

      expect(result).toEqual(mockSuggestions)
    })

    it('should return empty array for short queries', async () => {
      const result = await repository.getSearchSuggestions('t')
      expect(result).toEqual([])
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('should handle RPC errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const result = await repository.getSearchSuggestions('test')
      expect(result).toEqual([])
    })
  })

  describe('getPopularSearches', () => {
    it('should call get_popular_searches RPC function', async () => {
      const mockPopular = [
        { search_query: 'fiction', search_count: 10, avg_results: 25.5 },
        { search_query: 'science', search_count: 8, avg_results: 15.2 }
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: mockPopular,
        error: null
      })

      const result = await repository.getPopularSearches('7 days', 5)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_popular_searches', {
        time_period: '7 days',
        search_limit: 5
      })

      expect(result).toEqual(mockPopular)
    })
  })

  describe('trackSearchQuery', () => {
    it('should call track_search_query RPC function', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null
      })

      await repository.trackSearchQuery('test query', 5)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('track_search_query', {
        query_text: 'test query',
        result_count: 5,
        user_uuid: null
      })
    })

    it('should not track empty queries', async () => {
      await repository.trackSearchQuery('', 0)
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })
  })

  describe('unifiedSearch', () => {
    it('should call unified_search RPC function', async () => {
      const mockResults = [
        { id: '1', title: 'Book', item_type: 'book' },
        { id: '2', title: 'Bundle', item_type: 'bundle' }
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: mockResults,
        error: null
      })

      const options = {
        query: 'test',
        includeBooks: true,
        includeBundles: true,
        limit: 20
      }

      const result = await repository.unifiedSearch(options)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('unified_search', {
        search_query: 'test',
        include_books: true,
        include_bundles: true,
        category_filter: null,
        tags_filter: null,
        price_min: null,
        price_max: null,
        is_free_filter: null,
        limit_count: 20,
        offset_count: 0
      })

      expect(result).toEqual(mockResults)
    })
  })
})