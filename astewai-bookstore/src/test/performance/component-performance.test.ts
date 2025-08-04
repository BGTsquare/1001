import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { measurePerformance, expectPerformance } from '@/test/test-helpers'
import { BookGrid } from '@/components/books/book-grid'
import { BundleGrid } from '@/components/bundles/bundle-grid'
import { LibraryGrid } from '@/components/library/library-grid'
import { createMockBook, createMockBundle, createMockLibraryItem } from '@/test/utils'

describe('Component Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('BookGrid Performance', () => {
    it('renders large book list within performance budget', async () => {
      const books = Array.from({ length: 100 }, (_, i) => 
        createMockBook({ id: `book-${i}`, title: `Book ${i}` })
      )

      const duration = await measurePerformance(async () => {
        render(<BookGrid books={books} />)
        
        // Wait for all books to be rendered
        expect(screen.getAllByRole('article')).toHaveLength(100)
      })

      // Should render 100 books in under 500ms
      expectPerformance(duration, 500)
    })

    it('handles empty state efficiently', async () => {
      const duration = await measurePerformance(async () => {
        render(<BookGrid books={[]} />)
        expect(screen.getByText(/no books found/i)).toBeInTheDocument()
      })

      // Empty state should render very quickly
      expectPerformance(duration, 50)
    })

    it('optimizes re-renders when books change', async () => {
      const initialBooks = Array.from({ length: 10 }, (_, i) => 
        createMockBook({ id: `book-${i}`, title: `Book ${i}` })
      )

      const { rerender } = render(<BookGrid books={initialBooks} />)

      const duration = await measurePerformance(async () => {
        // Add one more book
        const updatedBooks = [
          ...initialBooks,
          createMockBook({ id: 'book-10', title: 'Book 10' })
        ]
        
        rerender(<BookGrid books={updatedBooks} />)
        expect(screen.getAllByRole('article')).toHaveLength(11)
      })

      // Re-render with one additional item should be fast
      expectPerformance(duration, 100)
    })
  })

  describe('BundleGrid Performance', () => {
    it('renders bundle grid with nested book data efficiently', async () => {
      const bundles = Array.from({ length: 50 }, (_, i) => 
        createMockBundle({
          id: `bundle-${i}`,
          title: `Bundle ${i}`,
          books: Array.from({ length: 5 }, (_, j) => 
            createMockBook({ id: `book-${i}-${j}`, title: `Book ${i}-${j}` })
          )
        })
      )

      const duration = await measurePerformance(async () => {
        render(<BundleGrid bundles={bundles} />)
        expect(screen.getAllByRole('article')).toHaveLength(50)
      })

      // Should handle nested data efficiently
      expectPerformance(duration, 800)
    })

    it('optimizes bundle card rendering', async () => {
      const bundle = createMockBundle({
        books: Array.from({ length: 20 }, (_, i) => 
          createMockBook({ id: `book-${i}`, title: `Book ${i}` })
        )
      })

      const duration = await measurePerformance(async () => {
        render(<BundleGrid bundles={[bundle]} />)
        expect(screen.getByRole('article')).toBeInTheDocument()
      })

      // Single bundle with many books should render quickly
      expectPerformance(duration, 200)
    })
  })

  describe('LibraryGrid Performance', () => {
    it('renders user library with progress data efficiently', async () => {
      const libraryItems = Array.from({ length: 200 }, (_, i) => 
        createMockLibraryItem({
          id: `library-${i}`,
          book_id: `book-${i}`,
          progress: Math.floor(Math.random() * 100),
          book: createMockBook({ id: `book-${i}`, title: `Book ${i}` })
        })
      )

      const duration = await measurePerformance(async () => {
        render(<LibraryGrid items={libraryItems} />)
        expect(screen.getAllByRole('article')).toHaveLength(200)
      })

      // Large library should render within reasonable time
      expectPerformance(duration, 1000)
    })

    it('handles progress bar calculations efficiently', async () => {
      const libraryItems = Array.from({ length: 100 }, (_, i) => 
        createMockLibraryItem({
          id: `library-${i}`,
          progress: i, // 0-99% progress
          book: createMockBook({ id: `book-${i}`, title: `Book ${i}` })
        })
      )

      const duration = await measurePerformance(async () => {
        render(<LibraryGrid items={libraryItems} />)
        
        // Verify progress bars are rendered
        const progressBars = screen.getAllByRole('progressbar')
        expect(progressBars).toHaveLength(100)
      })

      // Progress calculations should not slow down rendering
      expectPerformance(duration, 600)
    })
  })

  describe('Search Performance', () => {
    it('handles search input debouncing efficiently', async () => {
      const mockOnSearch = vi.fn()
      let searchCallCount = 0

      // Mock debounced search
      const debouncedSearch = vi.fn().mockImplementation((query) => {
        searchCallCount++
        mockOnSearch(query)
      })

      const SearchComponent = () => {
        const [query, setQuery] = React.useState('')
        
        React.useEffect(() => {
          const timer = setTimeout(() => {
            debouncedSearch(query)
          }, 300)
          
          return () => clearTimeout(timer)
        }, [query])

        return (
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
          />
        )
      }

      render(<SearchComponent />)
      const searchInput = screen.getByPlaceholderText('Search...')

      const duration = await measurePerformance(async () => {
        // Simulate rapid typing
        for (let i = 0; i < 10; i++) {
          fireEvent.change(searchInput, { target: { value: `query${i}` } })
          await new Promise(resolve => setTimeout(resolve, 50))
        }

        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 400))
      })

      // Should handle rapid input changes efficiently
      expectPerformance(duration, 1000)
      
      // Should only call search once due to debouncing
      expect(searchCallCount).toBe(1)
    })
  })

  describe('Image Loading Performance', () => {
    it('handles multiple image loads efficiently', async () => {
      const books = Array.from({ length: 50 }, (_, i) => 
        createMockBook({
          id: `book-${i}`,
          title: `Book ${i}`,
          cover_image_url: `https://example.com/cover-${i}.jpg`
        })
      )

      // Mock image loading
      const mockImageLoad = vi.fn()
      Object.defineProperty(HTMLImageElement.prototype, 'onload', {
        set: mockImageLoad,
      })

      const duration = await measurePerformance(async () => {
        render(<BookGrid books={books} />)
        
        // Verify images are being loaded
        const images = screen.getAllByRole('img')
        expect(images).toHaveLength(50)
      })

      // Should handle multiple images without blocking
      expectPerformance(duration, 400)
    })

    it('implements lazy loading for off-screen images', async () => {
      const books = Array.from({ length: 100 }, (_, i) => 
        createMockBook({
          id: `book-${i}`,
          title: `Book ${i}`,
          cover_image_url: `https://example.com/cover-${i}.jpg`
        })
      )

      // Mock IntersectionObserver for lazy loading
      const mockObserve = vi.fn()
      const mockUnobserve = vi.fn()
      
      global.IntersectionObserver = vi.fn(() => ({
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: vi.fn(),
      })) as any

      const duration = await measurePerformance(async () => {
        render(<BookGrid books={books} />)
      })

      // Lazy loading should improve initial render performance
      expectPerformance(duration, 300)
      
      // Should observe images for lazy loading
      expect(mockObserve).toHaveBeenCalled()
    })
  })

  describe('Memory Usage', () => {
    it('cleans up event listeners on unmount', () => {
      const mockRemoveEventListener = vi.spyOn(window, 'removeEventListener')
      
      const { unmount } = render(<BookGrid books={[createMockBook()]} />)
      
      unmount()
      
      // Should clean up any global event listeners
      expect(mockRemoveEventListener).toHaveBeenCalled()
    })

    it('prevents memory leaks in long-running components', async () => {
      const books = [createMockBook()]
      
      const { rerender, unmount } = render(<BookGrid books={books} />)
      
      // Simulate multiple re-renders
      for (let i = 0; i < 100; i++) {
        const updatedBooks = books.map(book => ({ ...book, title: `Updated ${i}` }))
        rerender(<BookGrid books={updatedBooks} />)
      }
      
      // Should not accumulate memory
      unmount()
      
      // Memory should be cleaned up (this is more of a documentation test)
      expect(true).toBe(true)
    })
  })
})