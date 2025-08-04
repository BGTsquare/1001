import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchBar } from '../search-bar'
import { AdvancedSearchFilters } from '../advanced-search-filters'
import { SearchResults } from '../search-results'
import type { SearchResult } from '@/lib/repositories/client-book-repository'

// Mock the client book service
vi.mock('@/lib/services/client-book-service', () => ({
  clientBookService: {
    getSearchSuggestions: vi.fn().mockResolvedValue({
      success: true,
      data: [
        { suggestion: 'fiction', frequency: 10 },
        { suggestion: 'science fiction', frequency: 8 }
      ]
    }),
    getPopularSearches: vi.fn().mockResolvedValue({
      success: true,
      data: [
        { search_query: 'popular book', search_count: 15, avg_results: 25 }
      ]
    })
  }
}))

describe('Search Integration', () => {
  const mockOnSearch = vi.fn()
  const mockOnFiltersChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('SearchBar', () => {
    it('should render and handle search input', async () => {
      render(
        <SearchBar
          onSearch={mockOnSearch}
          showSuggestions={true}
          showPopularSearches={true}
        />
      )

      const searchInput = screen.getByRole('combobox')
      expect(searchInput).toBeInTheDocument()

      // Type in search input
      fireEvent.change(searchInput, { target: { value: 'fiction' } })
      
      // Wait for debounced search
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('fiction')
      }, { timeout: 1000 })
    })

    it('should show suggestions when typing', async () => {
      render(
        <SearchBar
          onSearch={mockOnSearch}
          showSuggestions={true}
        />
      )

      const searchInput = screen.getByRole('combobox')
      
      // Focus and type to trigger suggestions
      fireEvent.focus(searchInput)
      fireEvent.change(searchInput, { target: { value: 'fic' } })

      // Wait for suggestions to load
      await waitFor(() => {
        expect(screen.getByText('Suggestions')).toBeInTheDocument()
      })
    })
  })

  describe('AdvancedSearchFilters', () => {
    const mockFilters = {}
    const mockCategories = ['Fiction', 'Non-Fiction', 'Science Fiction']
    const mockTags = ['adventure', 'romance', 'mystery']

    it('should render filter options', () => {
      render(
        <AdvancedSearchFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          categories={mockCategories}
          tags={mockTags}
        />
      )

      expect(screen.getByText('Advanced Filters')).toBeInTheDocument()
      expect(screen.getByText('Price Type')).toBeInTheDocument()
      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.getByText('Tags')).toBeInTheDocument()
    })

    it('should handle category selection', async () => {
      render(
        <AdvancedSearchFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          categories={mockCategories}
          tags={mockTags}
        />
      )

      const fictionCheckbox = screen.getByLabelText('Fiction')
      fireEvent.click(fictionCheckbox)

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        category: 'Fiction'
      })
    })

    it('should handle price type selection', () => {
      render(
        <AdvancedSearchFilters
          filters={mockFilters}
          onFiltersChange={mockOnFiltersChange}
          categories={mockCategories}
          tags={mockTags}
        />
      )

      const freeOnlyButton = screen.getByText('Free Only')
      fireEvent.click(freeOnlyButton)

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        isFree: true
      })
    })
  })

  describe('SearchResults', () => {
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: 'Test Book',
        author: 'Test Author',
        description: 'A test book description',
        cover_image_url: '/test-cover.jpg',
        content_url: '/test-content.pdf',
        price: 9.99,
        is_free: false,
        category: 'Fiction',
        tags: ['test'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        search_rank: 0.85
      }
    ]

    it('should render search results', () => {
      render(
        <SearchResults
          results={mockResults}
          searchQuery="test"
          showRanking={true}
        />
      )

      expect(screen.getByText('Found 1 result for "test"')).toBeInTheDocument()
      expect(screen.getByText('Test Book')).toBeInTheDocument()
      expect(screen.getByText('Test Author')).toBeInTheDocument()
    })

    it('should show loading state', () => {
      render(
        <SearchResults
          results={[]}
          searchQuery="test"
          isLoading={true}
        />
      )

      expect(screen.getByText('Searching books...')).toBeInTheDocument()
    })

    it('should show empty state', () => {
      render(
        <SearchResults
          results={[]}
          searchQuery="nonexistent"
          isLoading={false}
        />
      )

      expect(screen.getByText('No Results Found')).toBeInTheDocument()
      expect(screen.getByText('No books found matching your search criteria')).toBeInTheDocument()
    })

    it('should highlight search terms', () => {
      render(
        <SearchResults
          results={mockResults}
          searchQuery="test"
          showRanking={true}
        />
      )

      // Check if search terms are highlighted (marked elements)
      const highlightedElements = screen.getAllByText('test', { selector: 'mark' })
      expect(highlightedElements.length).toBeGreaterThan(0)
    })

    it('should show relevance badges when ranking is enabled', () => {
      render(
        <SearchResults
          results={mockResults}
          searchQuery="test"
          showRanking={true}
        />
      )

      expect(screen.getByText('Excellent')).toBeInTheDocument() // High search rank
    })
  })

  describe('Search Performance', () => {
    it('should debounce search input', async () => {
      render(
        <SearchBar
          onSearch={mockOnSearch}
          debounceMs={300}
        />
      )

      const searchInput = screen.getByRole('combobox')
      
      // Type multiple characters quickly
      fireEvent.change(searchInput, { target: { value: 'f' } })
      fireEvent.change(searchInput, { target: { value: 'fi' } })
      fireEvent.change(searchInput, { target: { value: 'fic' } })
      fireEvent.change(searchInput, { target: { value: 'fict' } })
      fireEvent.change(searchInput, { target: { value: 'fiction' } })

      // Should only call onSearch once after debounce period
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledTimes(1)
        expect(mockOnSearch).toHaveBeenCalledWith('fiction')
      }, { timeout: 500 })
    })
  })
})