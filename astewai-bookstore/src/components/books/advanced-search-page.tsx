'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SearchBar } from './search-bar'
import { AdvancedSearchFilters } from './advanced-search-filters'
import { SearchResults } from './search-results'
import { Pagination, PaginationInfo } from './pagination'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, BookOpen, Package } from 'lucide-react'
import { clientBookService } from '@/lib/services/client-book-service'
import type { BookFilters } from '@/types'
import type { SearchResult, PopularSearch } from '@/lib/repositories/client-book-repository'

export function AdvancedSearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [filters, setFilters] = useState<BookFilters>({})
  const [searchType, setSearchType] = useState<'books' | 'bundles' | 'all'>('all')
  
  // Results state
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filter options
  const [categories, setCategories] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([])
  
  const itemsPerPage = 12

  // Load filter options and popular searches on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [categoriesResult, tagsResult, popularResult] = await Promise.all([
          clientBookService.getCategories(),
          clientBookService.getTags(),
          clientBookService.getPopularSearches('7 days', 10)
        ])

        if (categoriesResult.success && categoriesResult.data) {
          setCategories(categoriesResult.data)
        }

        if (tagsResult.success && tagsResult.data) {
          setTags(tagsResult.data)
        }

        if (popularResult.success && popularResult.data) {
          setPopularSearches(popularResult.data)
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
      }
    }

    loadInitialData()
  }, [])

  // Perform search
  const performSearch = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const searchOptions = {
        query: searchQuery || undefined,
        category: filters.category,
        tags: filters.tags,
        priceRange: filters.priceRange,
        isFree: filters.isFree,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        sortBy: searchQuery ? 'relevance' as const : 'created_at' as const,
        sortOrder: 'desc' as const
      }

      let result
      if (searchType === 'all') {
        result = await clientBookService.unifiedSearch({
          ...searchOptions,
          includeBooks: true,
          includeBundles: true
        })
        if (result.success && result.data) {
          setResults(result.data)
          setTotal(result.data.length)
        }
      } else {
        result = await clientBookService.searchBooks(searchOptions)
        if (result.success && result.data) {
          setResults(result.data.books)
          setTotal(result.data.total)
        }
      }

      if (!result.success) {
        setError(result.error || 'Search failed')
        setResults([])
        setTotal(0)
      }
    } catch (error) {
      console.error('Search error:', error)
      setError('An unexpected error occurred')
      setResults([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, filters, currentPage, searchType])

  // Trigger search when dependencies change
  useEffect(() => {
    performSearch()
  }, [performSearch])

  // Reset to first page when search or filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchQuery, filters, searchType])

  // Update URL with search parameters
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (filters.category) params.set('category', filters.category)
    if (filters.tags?.length) params.set('tags', filters.tags.join(','))
    if (filters.isFree !== undefined) params.set('free', filters.isFree.toString())
    if (searchType !== 'all') params.set('type', searchType)
    
    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search'
    router.replace(newUrl, { scroll: false })
  }, [searchQuery, filters, searchType, router])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleFiltersChange = useCallback((newFilters: BookFilters) => {
    setFilters(newFilters)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handlePopularSearchClick = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const totalPages = Math.ceil(total / itemsPerPage)

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="max-w-4xl mx-auto">
        <SearchBar
          onSearch={handleSearch}
          initialValue={searchQuery}
          showSuggestions={true}
          showPopularSearches={true}
          placeholder="Search books, bundles, authors, or keywords..."
          className="w-full"
        />
      </div>

      {/* Search Type Tabs */}
      <div className="flex justify-center">
        <Tabs value={searchType} onValueChange={(value) => setSearchType(value as any)}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="books" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Books
            </TabsTrigger>
            <TabsTrigger value="bundles" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Bundles
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with filters and popular searches */}
        <div className="lg:col-span-1 space-y-6">
          {/* Advanced Filters */}
          <AdvancedSearchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            categories={categories}
            tags={tags}
            showCompact={false}
          />

          {/* Popular Searches */}
          {popularSearches.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4" />
                <h3 className="font-medium">Popular This Week</h3>
              </div>
              <div className="space-y-2">
                {popularSearches.slice(0, 8).map((popular, index) => (
                  <button
                    key={index}
                    onClick={() => handlePopularSearchClick(popular.search_query)}
                    className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm group-hover:text-primary transition-colors">
                        {popular.search_query}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {popular.search_count}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Main content area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Results info */}
          {total > 0 && !isLoading && (
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

          {/* Search Results */}
          <SearchResults
            results={results}
            searchQuery={searchQuery}
            isLoading={isLoading}
            showRanking={true}
            emptyMessage={
              searchQuery 
                ? "No results found. Try adjusting your search terms or filters."
                : "Enter a search term to find books and bundles."
            }
          />

          {/* Error state */}
          {error && !isLoading && (
            <Card className="p-8 text-center">
              <div className="text-destructive mb-4">
                <h3 className="font-medium mb-2">Search Error</h3>
                <p className="text-sm">{error}</p>
              </div>
              <Button onClick={performSearch} variant="outline">
                Try Again
              </Button>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && !isLoading && (
            <div className="flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}