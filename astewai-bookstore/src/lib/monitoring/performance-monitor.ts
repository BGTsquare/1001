/**
 * Comprehensive performance monitoring system
 * Tracks Core Web Vitals, user interactions, and custom metrics
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  url: string
  userAgent: string
  connectionType?: string
}

interface WebVitalsMetric extends PerformanceMetric {
  id: string
  delta: number
  rating: 'good' | 'needs-improvement' | 'poor'
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: PerformanceObserver[] = []
  private isEnabled: boolean

  constructor() {
    this.isEnabled = typeof window !== 'undefined' && 
                    process.env.NODE_ENV === 'production' &&
                    'PerformanceObserver' in window
    
    if (this.isEnabled) {
      this.initializeObservers()
      this.trackWebVitals()
    }
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    // Long Task Observer
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric({
              name: 'long-task',
              value: entry.duration,
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent
            })
          })
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.push(longTaskObserver)
      } catch (error) {
        console.warn('Long task observer not supported:', error)
      }
    }

    // Navigation Timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation')
      navigationEntries.forEach((entry: any) => {
        this.recordMetric({
          name: 'page-load-time',
          value: entry.loadEventEnd - entry.fetchStart,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })

        this.recordMetric({
          name: 'dom-content-loaded',
          value: entry.domContentLoadedEventEnd - entry.fetchStart,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      })
    }
  }

  /**
   * Track Core Web Vitals
   */
  private trackWebVitals(): void {
    if (typeof window === 'undefined') return

    // Import web-vitals dynamically
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(this.onWebVital.bind(this))
      getFID(this.onWebVital.bind(this))
      getFCP(this.onWebVital.bind(this))
      getLCP(this.onWebVital.bind(this))
      getTTFB(this.onWebVital.bind(this))
    }).catch(() => {
      console.warn('Web Vitals library not available')
    })
  }

  /**
   * Handle Web Vitals metrics
   */
  private onWebVital(metric: any): void {
    const webVitalMetric: WebVitalsMetric = {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
      rating: metric.rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType()
    }

    this.recordMetric(webVitalMetric)
    this.sendToAnalytics(webVitalMetric)
  }

  /**
   * Record custom performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)
    
    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }
  }

  /**
   * Track custom timing
   */
  trackTiming(name: string, startTime: number): void {
    const duration = performance.now() - startTime
    this.recordMetric({
      name: `custom-${name}`,
      value: duration,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })
  }

  /**
   * Track user interaction timing
   */
  trackInteraction(name: string, callback: () => Promise<void> | void): Promise<void> | void {
    const startTime = performance.now()
    
    const result = callback()
    
    if (result instanceof Promise) {
      return result.finally(() => {
        this.trackTiming(`interaction-${name}`, startTime)
      })
    } else {
      this.trackTiming(`interaction-${name}`, startTime)
    }
  }

  /**
   * Get connection type
   */
  private getConnectionType(): string {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection
    
    return connection ? connection.effectiveType || connection.type : 'unknown'
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(metric: PerformanceMetric): void {
    // Send to your analytics service (Google Analytics, Plausible, etc.)
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.value),
        non_interaction: true,
      })
    }

    // Send to custom analytics endpoint
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
        keepalive: true
      }).catch(() => {
        // Silently fail - don't block user experience
      })
    }
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMetrics: number
    averagePageLoad: number
    webVitals: Record<string, number>
    customMetrics: Record<string, number>
  } {
    const webVitals: Record<string, number> = {}
    const customMetrics: Record<string, number> = {}
    let totalPageLoad = 0
    let pageLoadCount = 0

    this.metrics.forEach(metric => {
      if (['CLS', 'FID', 'FCP', 'LCP', 'TTFB'].includes(metric.name)) {
        webVitals[metric.name] = metric.value
      } else if (metric.name.startsWith('custom-')) {
        customMetrics[metric.name] = metric.value
      } else if (metric.name === 'page-load-time') {
        totalPageLoad += metric.value
        pageLoadCount++
      }
    })

    return {
      totalMetrics: this.metrics.length,
      averagePageLoad: pageLoadCount > 0 ? totalPageLoad / pageLoadCount : 0,
      webVitals,
      customMetrics
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// React hook for performance tracking
export function usePerformanceTracking() {
  const trackTiming = (name: string, startTime: number) => {
    performanceMonitor.trackTiming(name, startTime)
  }

  const trackInteraction = (name: string, callback: () => Promise<void> | void) => {
    return performanceMonitor.trackInteraction(name, callback)
  }

  const getSummary = () => performanceMonitor.getSummary()

  return { trackTiming, trackInteraction, getSummary }
}
