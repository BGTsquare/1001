/**
 * Search Analytics Service
 * Tracks search performance metrics and user behavior
 */

import { clientBookRepository } from '@/lib/repositories/client-book-repository'

interface SearchMetrics {
  query: string
  resultCount: number
  searchTime: number
  timestamp: number
  userId?: string
  filters?: Record<string, any>
  clickedResults?: string[]
}

interface PerformanceMetrics {
  averageSearchTime: number
  totalSearches: number
  popularQueries: Array<{ query: string; count: number }>
  slowQueries: Array<{ query: string; avgTime: number }>
  zeroResultQueries: Array<{ query: string; count: number }>
}

export class SearchAnalyticsService {
  private metrics: SearchMetrics[] = []
  private readonly maxMetricsSize = 1000
  private performanceThreshold = 1000 // 1 second

  /**
   * Track a search query with performance metrics
   */
  async trackSearch(
    query: string,
    resultCount: number,
    searchTime: number,
    userId?: string,
    filters?: Record<string, any>
  ): Promise<void> {
    const metric: SearchMetrics = {
      query: query.trim().toLowerCase(),
      resultCount,
      searchTime,
      timestamp: Date.now(),
      userId,
      filters,
      clickedResults: []
    }

    // Add to local metrics
    this.metrics.push(metric)

    // Keep metrics array size manageable
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics.shift()
    }

    // Track in database for persistent analytics
    try {
      await clientBookRepository.trackSearchQuery(query, resultCount)
    } catch (error) {
      console.error('Failed to track search in database:', error)
    }

    // Log slow queries for optimization
    if (searchTime > this.performanceThreshold) {
      console.warn(`[SearchAnalytics] Slow query detected: "${query}" took ${searchTime}ms`)
    }

    // Log zero result queries for content gap analysis
    if (resultCount === 0) {
      console.info(`[SearchAnalytics] Zero results for: "${query}"`)
    }
  }

  /**
   * Track when a user clicks on a search result
   */
  trackResultClick(query: string, resultId: string): void {
    // Find the most recent search for this query
    const recentSearch = this.metrics
      .slice()
      .reverse()
      .find(m => m.query === query.trim().toLowerCase())

    if (recentSearch) {
      if (!recentSearch.clickedResults) {
        recentSearch.clickedResults = []
      }
      recentSearch.clickedResults.push(resultId)
    }
  }

  /**
   * Get performance metrics for the current session
   */
  getPerformanceMetrics(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      return {
        averageSearchTime: 0,
        totalSearches: 0,
        popularQueries: [],
        slowQueries: [],
        zeroResultQueries: []
      }
    }

    // Calculate average search time
    const totalTime = this.metrics.reduce((sum, m) => sum + m.searchTime, 0)
    const averageSearchTime = totalTime / this.metrics.length

    // Get popular queries
    const queryCount = new Map<string, number>()
    this.metrics.forEach(m => {
      const count = queryCount.get(m.query) || 0
      queryCount.set(m.query, count + 1)
    })

    const popularQueries = Array.from(queryCount.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Get slow queries
    const queryTimes = new Map<string, number[]>()
    this.metrics.forEach(m => {
      const times = queryTimes.get(m.query) || []
      times.push(m.searchTime)
      queryTimes.set(m.query, times)
    })

    const slowQueries = Array.from(queryTimes.entries())
      .map(([query, times]) => ({
        query,
        avgTime: times.reduce((sum, time) => sum + time, 0) / times.length
      }))
      .filter(q => q.avgTime > this.performanceThreshold)
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10)

    // Get zero result queries
    const zeroResultCount = new Map<string, number>()
    this.metrics
      .filter(m => m.resultCount === 0)
      .forEach(m => {
        const count = zeroResultCount.get(m.query) || 0
        zeroResultCount.set(m.query, count + 1)
      })

    const zeroResultQueries = Array.from(zeroResultCount.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      averageSearchTime,
      totalSearches: this.metrics.length,
      popularQueries,
      slowQueries,
      zeroResultQueries
    }
  }

  /**
   * Get search conversion rate (clicks per search)
   */
  getConversionRate(): number {
    if (this.metrics.length === 0) return 0

    const searchesWithClicks = this.metrics.filter(
      m => m.clickedResults && m.clickedResults.length > 0
    ).length

    return searchesWithClicks / this.metrics.length
  }

  /**
   * Get most clicked results
   */
  getMostClickedResults(): Array<{ resultId: string; clicks: number }> {
    const clickCount = new Map<string, number>()

    this.metrics.forEach(m => {
      if (m.clickedResults) {
        m.clickedResults.forEach(resultId => {
          const count = clickCount.get(resultId) || 0
          clickCount.set(resultId, count + 1)
        })
      }
    })

    return Array.from(clickCount.entries())
      .map(([resultId, clicks]) => ({ resultId, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 20)
  }

  /**
   * Get search patterns by time of day
   */
  getSearchPatternsByHour(): Array<{ hour: number; searches: number }> {
    const hourlyCount = new Array(24).fill(0)

    this.metrics.forEach(m => {
      const hour = new Date(m.timestamp).getHours()
      hourlyCount[hour]++
    })

    return hourlyCount.map((searches, hour) => ({ hour, searches }))
  }

  /**
   * Get filter usage statistics
   */
  getFilterUsageStats(): Record<string, number> {
    const filterUsage: Record<string, number> = {}

    this.metrics.forEach(m => {
      if (m.filters) {
        Object.keys(m.filters).forEach(filterKey => {
          if (m.filters![filterKey] !== undefined && m.filters![filterKey] !== null) {
            filterUsage[filterKey] = (filterUsage[filterKey] || 0) + 1
          }
        })
      }
    })

    return filterUsage
  }

  /**
   * Export analytics data for external analysis
   */
  exportData(): SearchMetrics[] {
    return [...this.metrics]
  }

  /**
   * Clear analytics data
   */
  clearData(): void {
    this.metrics = []
  }

  /**
   * Get search suggestions based on analytics
   */
  getSearchSuggestions(partialQuery: string, limit: number = 5): string[] {
    const query = partialQuery.toLowerCase().trim()
    if (query.length < 2) return []

    // Get queries that start with the partial query
    const matchingQueries = this.metrics
      .map(m => m.query)
      .filter(q => q.startsWith(query) && q !== query)
      .reduce((acc, q) => {
        acc[q] = (acc[q] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    return Object.entries(matchingQueries)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([query]) => query)
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): string {
    const metrics = this.getPerformanceMetrics()
    const conversionRate = this.getConversionRate()
    const filterStats = this.getFilterUsageStats()

    return `
Search Performance Report
========================

Total Searches: ${metrics.totalSearches}
Average Search Time: ${metrics.averageSearchTime.toFixed(2)}ms
Conversion Rate: ${(conversionRate * 100).toFixed(2)}%

Top Queries:
${metrics.popularQueries.map(q => `- "${q.query}" (${q.count} searches)`).join('\n')}

Slow Queries:
${metrics.slowQueries.map(q => `- "${q.query}" (${q.avgTime.toFixed(2)}ms avg)`).join('\n')}

Zero Result Queries:
${metrics.zeroResultQueries.map(q => `- "${q.query}" (${q.count} times)`).join('\n')}

Filter Usage:
${Object.entries(filterStats).map(([filter, count]) => `- ${filter}: ${count} uses`).join('\n')}
    `.trim()
  }
}

// Export singleton instance
export const searchAnalyticsService = new SearchAnalyticsService()