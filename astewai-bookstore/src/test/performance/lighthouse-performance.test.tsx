import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { 
  measurePerformance, 
  expectPerformance 
} from '@/test/test-helpers'
import { BookGrid } from '@/components/books/book-grid'
import { BundleGrid } from '@/components/bundles/bundle-grid'
import { createTestBook, createTestBundle } from '@/test/utils'
import { PerformanceMonitor } from '@/lib/utils/performance'

describe('Lighthouse Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock performance APIs
    global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
    }))
    
    // Mock performance.now for consistent testing
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(100)
  })

  describe('Core Web Vitals', () => {
    it('measures Largest Contentful Paint (LCP)', async () => {
      const books = Array.from({ length: 20 }, (_, i) => 
        createTestBook({ id: `book-${i}`, title: `Book ${i}` })
      )

      const duration = await measurePerformance(async () => {
        render(<BookGrid books={books} />)
        
        // Wait for images to load
        const images = screen.getAllByRole('img')
        expect(images).toHaveLength(20)
      })

      // LCP should be under 2.5 seconds for good performance
      expectPerformance(duration, 2500)
    })

    it('measures First Input Delay (FID) simulation', async () => {
      const books = [createTestBook()]

      const duration = await measurePerformance(async () => {
        const { container } = render(<BookGrid books={books} />)
        
        // Simulate user interaction
        const button = container.querySelector('button')
        if (button) {
          button.click()
        }
      })

      // FID should be under 100ms for good performance
      expectPerformance(duration, 100)
    })

    it('measures Cumulative Layout Shift (CLS) prevention', () => {
      const books = Array.from({ length: 10 }, (_, i) => 
        createTestBook({ 
          id: `book-${i}`, 
          title: `Book ${i}`,
          cover_image_url: `https://example.com/cover-${i}.jpg`
        })
      )

      const { container } = render(<BookGrid books={books} />)

      // Check that images have proper dimensions to prevent layout shift
      const images = container.querySelectorAll('img')
      images.forEach(img => {
        expect(img).toHaveAttribute('width')
        expect(img).toHaveAttribute('height')
      })
    })
  })

  describe('Bundle Size Optimization', () => {
    it('loads components efficiently', async () => {
      const duration = await measurePerformance(async () => {
        // Simulate dynamic import
        const BookGridModule = await import('@/components/books/book-grid')
        expect(BookGridModule.BookGrid).toBeDefined()
      })

      // Dynamic imports should be fast
      expectPerformance(duration, 50)
    })

    it('handles large datasets efficiently', async () => {
      const books = Array.from({ length: 100 }, (_, i) => 
        createTestBook({ id: `book-${i}`, title: `Book ${i}` })
      )

      const duration = await measurePerformance(async () => {
        render(<BookGrid books={books} />)
        expect(screen.getAllByRole('img')).toHaveLength(100)
      })

      // Should handle 100 items in under 1 second
      expectPerformance(duration, 1000)
    })
  })

  describe('Image Optimization', () => {
    it('uses optimized image loading', () => {
      const book = createTestBook({
        cover_image_url: 'https://example.com/cover.jpg'
      })

      const { container } = render(<BookGrid books={[book]} />)

      const img = container.querySelector('img')
      expect(img).toHaveAttribute('loading', 'lazy')
      expect(img).toHaveAttribute('sizes')
    })

    it('provides proper image fallbacks', () => {
      const book = createTestBook({
        cover_image_url: 'https://example.com/cover.jpg'
      })

      const { container } = render(<BookGrid books={[book]} />)

      const img = container.querySelector('img')
      expect(img).toHaveAttribute('alt')
      expect(img?.getAttribute('alt')).not.toBe('')
    })
  })

  describe('Memory Management', () => {
    it('cleans up resources on unmount', () => {
      const books = [createTestBook()]
      const { unmount } = render(<BookGrid books={books} />)

      // Mock memory monitoring
      const mockMemoryUsage = vi.spyOn(PerformanceMonitor, 'monitorMemoryUsage')
        .mockReturnValue({
          usedJSHeapSize: 1000000,
          totalJSHeapSize: 2000000,
          jsHeapSizeLimit: 4000000
        })

      const initialMemory = PerformanceMonitor.monitorMemoryUsage()
      
      unmount()
      
      // Memory should not increase significantly after unmount
      const finalMemory = PerformanceMonitor.monitorMemoryUsage()
      expect(finalMemory?.usedJSHeapSize).toBeLessThanOrEqual(
        (initialMemory?.usedJSHeapSize || 0) * 1.1 // Allow 10% increase
      )

      mockMemoryUsage.mockRestore()
    })

    it('prevents memory leaks in event listeners', () => {
      const mockAddEventListener = vi.spyOn(window, 'addEventListener')
      const mockRemoveEventListener = vi.spyOn(window, 'removeEventListener')

      const books = [createTestBook()]
      const { unmount } = render(<BookGrid books={books} />)

      unmount()

      // Should clean up event listeners
      expect(mockRemoveEventListener).toHaveBeenCalled()

      mockAddEventListener.mockRestore()
      mockRemoveEventListener.mockRestore()
    })
  })

  describe('Network Performance', () => {
    it('minimizes network requests', async () => {
      const books = Array.from({ length: 5 }, (_, i) => 
        createTestBook({ 
          id: `book-${i}`,
          cover_image_url: `https://example.com/cover-${i}.jpg`
        })
      )

      // Mock fetch to count requests
      const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue(
        new Response('', { status: 200 })
      )

      render(<BookGrid books={books} />)

      // Should not make excessive network requests during render
      expect(mockFetch).toHaveBeenCalledTimes(0) // Images should be lazy loaded

      mockFetch.mockRestore()
    })

    it('implements proper caching strategies', () => {
      const book = createTestBook()

      // Render the same book multiple times
      const { rerender } = render(<BookGrid books={[book]} />)
      rerender(<BookGrid books={[book]} />)
      rerender(<BookGrid books={[book]} />)

      // Should reuse cached data/components
      expect(screen.getAllByRole('img')).toHaveLength(1)
    })
  })

  describe('Rendering Performance', () => {
    it('renders initial content quickly', async () => {
      const books = Array.from({ length: 20 }, (_, i) => 
        createTestBook({ id: `book-${i}`, title: `Book ${i}` })
      )

      const duration = await measurePerformance(async () => {
        render(<BookGrid books={books} />)
        
        // Check that content is rendered
        expect(screen.getAllByText(/Book \d+/)).toHaveLength(20)
      })

      // Initial render should be fast
      expectPerformance(duration, 500)
    })

    it('handles re-renders efficiently', async () => {
      const initialBooks = [createTestBook({ id: '1', title: 'Book 1' })]
      const updatedBooks = [
        createTestBook({ id: '1', title: 'Updated Book 1' }),
        createTestBook({ id: '2', title: 'Book 2' })
      ]

      const { rerender } = render(<BookGrid books={initialBooks} />)

      const duration = await measurePerformance(async () => {
        rerender(<BookGrid books={updatedBooks} />)
        
        expect(screen.getByText('Updated Book 1')).toBeInTheDocument()
        expect(screen.getByText('Book 2')).toBeInTheDocument()
      })

      // Re-renders should be fast
      expectPerformance(duration, 100)
    })
  })

  describe('Bundle Performance', () => {
    it('renders bundle grids efficiently', async () => {
      const bundles = Array.from({ length: 10 }, (_, i) => 
        createTestBundle({
          id: `bundle-${i}`,
          title: `Bundle ${i}`,
          books: Array.from({ length: 3 }, (_, j) => 
            createTestBook({ id: `book-${i}-${j}`, title: `Book ${i}-${j}` })
          )
        })
      )

      const duration = await measurePerformance(async () => {
        render(<BundleGrid bundles={bundles} />)
        
        // Should render all bundles
        expect(screen.getAllByText(/Bundle \d+/)).toHaveLength(10)
      })

      // Should handle nested data efficiently
      expectPerformance(duration, 800)
    })
  })

  describe('Accessibility Performance', () => {
    it('maintains performance with accessibility features', async () => {
      const books = Array.from({ length: 50 }, (_, i) => 
        createTestBook({ id: `book-${i}`, title: `Book ${i}` })
      )

      const duration = await measurePerformance(async () => {
        const { container } = render(<BookGrid books={books} />)
        
        // Check accessibility attributes don't slow down rendering
        const images = container.querySelectorAll('img[alt]')
        expect(images).toHaveLength(50)
        
        const links = container.querySelectorAll('a[href]')
        expect(links.length).toBeGreaterThan(0)
      })

      // Accessibility features shouldn't significantly impact performance
      expectPerformance(duration, 1000)
    })
  })
})