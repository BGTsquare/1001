'use client'

import { useState, useEffect, useCallback } from 'react'
import { BookCard } from './book-card'
import { SearchBar } from './search-bar'
import { BookFiltersComponent } from './book-filters'
import { AdvancedSearchFilters } from './advanced-search-filters'
import { SearchResults } from './search-results'
import { Pagination, PaginationInfo } from './pagination'
import { clientBookService } from '@/lib/services/client-book-service'
import { getFallbackBooks } from '@/lib/fallback-data'
import type { Book, BookFilters } from '@/types'
import type { BookSearchOptions, SearchResult } from '@/lib/repositories/client-book-repository'
import { cn } from '@/lib/utils'

interface BookGridProps {
  initialBooks?: Book[]
  initialTotal?: number
  itemsPerPage?: number
  className?: string
  showFilters?: boolean
  showSearch?: boolean
  showPagination?: boolean
  showAdvancedFilters?: boolean
  showSearchResults?: boolean
  enableUnifiedSearch?: boolean
}

export function BookGrid({
  initialBooks = [],
  initialTotal = 0,
  itemsPerPage = 12,
  className,
  showFilters = true,
  showSearch = true,
  showPagination = true,
  showAdvancedFilters = false,
  showSearchResults = false,
  enableUnifiedSearch = false
}: BookGridProps) {
  const [books, setBooks] = useState<SearchResult[]>(initialBooks)
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<BookFilters>({})
  const [categories, setCategories] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])

  // Load categories and tags on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [categoriesResult, tagsResult] = await Promise.all([
          clientBookService.getCategories(),
          clientBookService.getTags()
        ])

        if (categoriesResult.success && categoriesResult.data) {
          setCategories(categoriesResult.data)
        } else {
          // Use fallback categories
          setCategories(['Technology', 'Fiction', 'Non-Fiction', 'Business', 'Education'])
        }

        if (tagsResult.success && tagsResult.data) {
          setTags(tagsResult.data)
        } else {
          // Use fallback tags
          setTags(['programming', 'web', 'javascript', 'react', 'python', 'database', 'devops'])
        }
      } catch (error) {
        console.error('Error loading filter options, using fallback:', error)
        // Use fallback data when API is completely inaccessible
        setCategories(['Technology', 'Fiction', 'Non-Fiction', 'Business', 'Education'])
        setTags(['programming', 'web', 'javascript', 'react', 'python', 'database', 'devops'])
      }
    }

    loadFilterOptions()
  }, [])

  // Load books when search, filters, or page changes
  const loadBooks = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const searchOptions: BookSearchOptions = {
        query: searchQuery || undefined,
        category: filters.category,
        tags: filters.tags,
        priceRange: filters.priceRange,
        isFree: filters.isFree,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        sortBy: searchQuery ? 'relevance' : 'created_at',
        sortOrder: searchQuery ? 'desc' : 'desc'
      }

      const result = enableUnifiedSearch && searchQuery
        ? await clientBookService.unifiedSearch(searchOptions)
        : await clientBookService.searchBooks(searchOptions)

      if (result.success && result.data) {
        if (enableUnifiedSearch && searchQuery) {
          setBooks(result.data)
          setTotal(result.data.length)
        } else {
          setBooks(result.data.books)
          setTotal(result.data.total)
        }
      } else {
        // API failed, use fallback data
        console.warn('API failed, using fallback data:', result.error)
        const fallbackData = getFallbackBooks({
          limit: itemsPerPage,
          category: filters.category,
          isFree: filters.isFree
        })
        setBooks(fallbackData.books)
        setTotal(fallbackData.total)
        setError(null) // Don't show error when fallback works
      }
    } catch (error) {
      console.error('Error loading books, using fallback data:', error)
      // Use fallback data when API is completely inaccessible
      const fallbackData = getFallbackBooks({
        limit: itemsPerPage,
        category: filters.category,
        isFree: filters.isFree
      })
      setBooks(fallbackData.books)
      setTotal(fallbackData.total)
      setError(null) // Don't show error when fallback works
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, filters, currentPage, itemsPerPage])

  // Load books when dependencies change
  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  // Reset to first page when search or filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchQuery, filters])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleFiltersChange = useCallback((newFilters: BookFilters) => {
    setFilters(newFilters)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const totalPages = Math.ceil(total / itemsPerPage)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search and Filters */}
      <div className="space-y-4">
        {showSearch && (
          <SearchBar
            onSearch={handleSearch}
            className="max-w-2xl mx-auto"
          />
        )}

        {showFilters && !showAdvancedFilters && (
          <BookFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            categories={categories}
            tags={tags}
          />
        )}

        {showAdvancedFilters && (
          <AdvancedSearchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            categories={categories}
            tags={tags}
            showCompact={true}
          />
        )}
      </div>

      {/* Results Info */}
      {showPagination && total > 0 && (
        <div className="flex items-center justify-between">
          <PaginationInfo
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={itemsPerPage}
          />
          <div className="text-sm text-muted-foreground">
            {searchQuery && `Results for "${searchQuery}"`}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid-responsive-books">
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse"
            >
              <div className="bg-muted rounded-lg aspect-[3/4] mb-4" />
              <div className="space-mobile-tight">
                <div className="bg-muted h-4 rounded w-3/4" />
                <div className="bg-muted h-3 rounded w-1/2" />
                <div className="bg-muted h-3 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={loadBooks}
            className="text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && books.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">
            {searchQuery || Object.keys(filters).length > 0
              ? 'No books found matching your criteria'
              : 'No books available'
            }
          </p>
          {(searchQuery || Object.keys(filters).length > 0) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setFilters({})
              }}
              className="text-primary hover:underline"
            >
              Clear search and filters
            </button>
          )}
        </div>
      )}

      {/* Books Grid or Search Results */}
      {!isLoading && !error && books.length > 0 && (
        <>
          {showSearchResults && searchQuery ? (
            <SearchResults
              results={books}
              searchQuery={searchQuery}
              isLoading={isLoading}
              showRanking={true}
            />
          ) : (
            <div className="grid-responsive-books">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {showPagination && totalPages > 1 && !isLoading && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
}