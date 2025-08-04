import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SearchAnalyticsService } from '../search-analytics-service'

// Mock the client book repository
vi.mock('@/lib/repositories/client-book-repository', () => ({
  clientBookRepository: {
    trackSearchQuery: vi.fn().mockResolvedValue(undefined)
  }
}))

describe('SearchAnalyticsService', () => {
  let analyticsService: SearchAnalyticsService

  beforeEach(() => {
    analyticsService = new SearchAnalyticsService()
    analyticsService.clearData() // Start with clean state
  })

  describe('trackSearch', () => {
    it('should track search metrics', async () => {
      await analyticsService.trackSearch('test query', 5, 250)

      const metrics = analyticsService.getPerformanceMetrics()
      expect(metrics.totalSearches).toBe(1)
      expect(metrics.averageSearchTime).toBe(250)
    })

    it('should normalize query to lowercase', async () => {
      await analyticsService.trackSearch('TEST Query', 5, 250)

      const metrics = analyticsService.getPerformanceMetrics()
      expect(metrics.popularQueries[0].query).toBe('test query')
    })

    it('should track multiple searches', async () => {
      await analyticsService.trackSearch('query1', 5, 200)
      await analyticsService.trackSearch('query2', 3, 300)
      await analyticsService.trackSearch('query1', 7, 150)

      const metrics = analyticsService.getPerformanceMetrics()
      expect(metrics.totalSearches).toBe(3)
      expect(metrics.averageSearchTime).toBe((200 + 300 + 150) / 3)
      
      const popularQueries = metrics.popularQueries
      expect(popularQueries[0].query).toBe('query1')
      expect(popularQueries[0].count).toBe(2)
      expect(popularQueries[1].query).toBe('query2')
      expect(popularQueries[1].count).toBe(1)
    })
  })

  describe('trackResultClick', () => {
    it('should track clicks on search results', async () => {
      await analyticsService.trackSearch('test query', 5, 250)
      analyticsService.trackResultClick('test query', 'book-123')

      const clickedResults = analyticsService.getMostClickedResults()
      expect(clickedResults[0].resultId).toBe('book-123')
      expect(clickedResults[0].clicks).toBe(1)
    })

    it('should track multiple clicks', async () => {
      await analyticsService.trackSearch('test query', 5, 250)
      analyticsService.trackResultClick('test query', 'book-123')
      analyticsService.trackResultClick('test query', 'book-456')
      analyticsService.trackResultClick('test query', 'book-123')

      const clickedResults = analyticsService.getMostClickedResults()
      expect(clickedResults[0].resultId).toBe('book-123')
      expect(clickedResults[0].clicks).toBe(2)
      expect(clickedResults[1].resultId).toBe('book-456')
      expect(clickedResults[1].clicks).toBe(1)
    })
  })

  describe('getPerformanceMetrics', () => {
    it('should return empty metrics for no searches', () => {
      const metrics = analyticsService.getPerformanceMetrics()
      
      expect(metrics.totalSearches).toBe(0)
      expect(metrics.averageSearchTime).toBe(0)
      expect(metrics.popularQueries).toEqual([])
      expect(metrics.slowQueries).toEqual([])
      expect(metrics.zeroResultQueries).toEqual([])
    })

    it('should identify slow queries', async () => {
      await analyticsService.trackSearch('slow query', 5, 1500) // Above threshold
      await analyticsService.trackSearch('fast query', 5, 200)

      const metrics = analyticsService.getPerformanceMetrics()
      expect(metrics.slowQueries).toHaveLength(1)
      expect(metrics.slowQueries[0].query).toBe('slow query')
      expect(metrics.slowQueries[0].avgTime).toBe(1500)
    })

    it('should identify zero result queries', async () => {
      await analyticsService.trackSearch('no results', 0, 250)
      await analyticsService.trackSearch('has results', 5, 250)

      const metrics = analyticsService.getPerformanceMetrics()
      expect(metrics.zeroResultQueries).toHaveLength(1)
      expect(metrics.zeroResultQueries[0].query).toBe('no results')
      expect(metrics.zeroResultQueries[0].count).toBe(1)
    })
  })

  describe('getConversionRate', () => {
    it('should calculate conversion rate correctly', async () => {
      await analyticsService.trackSearch('query1', 5, 250)
      await analyticsService.trackSearch('query2', 3, 250)
      
      analyticsService.trackResultClick('query1', 'book-123')
      // query2 has no clicks

      const conversionRate = analyticsService.getConversionRate()
      expect(conversionRate).toBe(0.5) // 1 out of 2 searches had clicks
    })

    it('should return 0 for no searches', () => {
      const conversionRate = analyticsService.getConversionRate()
      expect(conversionRate).toBe(0)
    })
  })

  describe('getSearchPatternsByHour', () => {
    it('should track searches by hour', async () => {
      // Mock Date to control timestamp
      const mockDate = new Date('2024-01-01T14:30:00Z') // 2 PM
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any)

      await analyticsService.trackSearch('test', 5, 250)

      const patterns = analyticsService.getSearchPatternsByHour()
      expect(patterns).toHaveLength(24)
      expect(patterns[14].searches).toBe(1) // 2 PM hour
      expect(patterns[13].searches).toBe(0) // Other hours should be 0

      vi.restoreAllMocks()
    })
  })

  describe('getFilterUsageStats', () => {
    it('should track filter usage', async () => {
      await analyticsService.trackSearch('test1', 5, 250, undefined, {
        category: 'Fiction',
        isFree: true
      })
      
      await analyticsService.trackSearch('test2', 3, 250, undefined, {
        category: 'Science',
        tags: ['tag1']
      })

      const filterStats = analyticsService.getFilterUsageStats()
      expect(filterStats.category).toBe(2)
      expect(filterStats.isFree).toBe(1)
      expect(filterStats.tags).toBe(1)
    })
  })

  describe('getSearchSuggestions', () => {
    it('should provide search suggestions based on history', async () => {
      await analyticsService.trackSearch('fiction books', 5, 250)
      await analyticsService.trackSearch('fiction novels', 3, 250)
      await analyticsService.trackSearch('science fiction', 7, 250)

      const suggestions = analyticsService.getSearchSuggestions('fic', 5)
      expect(suggestions).toContain('fiction books')
      expect(suggestions).toContain('fiction novels')
    })

    it('should return empty array for short queries', () => {
      const suggestions = analyticsService.getSearchSuggestions('f')
      expect(suggestions).toEqual([])
    })
  })

  describe('generatePerformanceReport', () => {
    it('should generate a comprehensive report', async () => {
      await analyticsService.trackSearch('popular query', 5, 250)
      await analyticsService.trackSearch('slow query', 3, 1500)
      await analyticsService.trackSearch('no results', 0, 200)

      const report = analyticsService.generatePerformanceReport()
      
      expect(report).toContain('Total Searches: 3')
      expect(report).toContain('popular query')
      expect(report).toContain('slow query')
      expect(report).toContain('no results')
    })
  })

  describe('data management', () => {
    it('should export analytics data', async () => {
      await analyticsService.trackSearch('test', 5, 250)
      
      const exportedData = analyticsService.exportData()
      expect(exportedData).toHaveLength(1)
      expect(exportedData[0].query).toBe('test')
    })

    it('should clear analytics data', async () => {
      await analyticsService.trackSearch('test', 5, 250)
      expect(analyticsService.getPerformanceMetrics().totalSearches).toBe(1)

      analyticsService.clearData()
      expect(analyticsService.getPerformanceMetrics().totalSearches).toBe(0)
    })
  })
})