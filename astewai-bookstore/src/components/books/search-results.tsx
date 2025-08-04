'use client'

import { useMemo } from 'react'
import { BookCard } from './book-card'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Star, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SearchResult } from '@/lib/repositories/client-book-repository'

interface SearchResultsProps {
  results: SearchResult[]
  searchQuery?: string
  isLoading?: boolean
  className?: string
  showRanking?: boolean
  emptyMessage?: string
  loadingMessage?: string
}

export function SearchResults({
  results,
  searchQuery,
  isLoading = false,
  className,
  showRanking = true,
  emptyMessage = "No books found matching your search criteria",
  loadingMessage = "Searching books..."
}: SearchResultsProps) {
  // Sort results by search rank if available
  const sortedResults = useMemo(() => {
    if (!searchQuery || !showRanking) return results
    
    return [...results].sort((a, b) => {
      const rankA = a.search_rank || 0
      const rankB = b.search_rank || 0
      return rankB - rankA // Higher rank first
    })
  }, [results, searchQuery, showRanking])

  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text
    
    const words = query.trim().split(/\s+/).filter(word => word.length > 0)
    if (words.length === 0) return text
    
    const regex = new RegExp(`(${words.map(word => 
      word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    ).join('|')})`, 'gi')
    
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
          {part}
        </mark>
      ) : part
    )
  }

  // Get relevance badge color based on search rank
  const getRelevanceBadgeVariant = (rank?: number) => {
    if (!rank) return 'secondary'
    if (rank > 0.5) return 'default'
    if (rank > 0.3) return 'secondary'
    return 'outline'
  }

  // Get relevance text
  const getRelevanceText = (rank?: number) => {
    if (!rank) return 'Low'
    if (rank > 0.7) return 'Excellent'
    if (rank > 0.5) return 'High'
    if (rank > 0.3) return 'Good'
    return 'Fair'
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{loadingMessage}</p>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid-responsive-books">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <div className="aspect-[3/4] bg-muted rounded-t-lg"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium mb-2">No Results Found</h3>
          <p className="text-muted-foreground mb-4">{emptyMessage}</p>
          {searchQuery && (
            <div className="text-sm text-muted-foreground">
              Try adjusting your search terms or filters
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search summary */}
      {searchQuery && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Found {results.length} result{results.length !== 1 ? 's' : ''} for{' '}
            <span className="font-medium text-foreground">&ldquo;{searchQuery}&rdquo;</span>
          </div>
          {showRanking && results.some(r => r.search_rank) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Sorted by relevance
            </div>
          )}
        </div>
      )}

      {/* Results grid */}
      <div className="grid-responsive-books">
        {sortedResults.map((book) => (
          <div key={book.id} className="relative">
            {/* Relevance badge for search results */}
            {searchQuery && showRanking && book.search_rank && (
              <Badge
                variant={getRelevanceBadgeVariant(book.search_rank)}
                className="absolute top-2 right-2 z-10 text-xs"
              >
                <Star className="h-3 w-3 mr-1" />
                {getRelevanceText(book.search_rank)}
              </Badge>
            )}
            
            {/* Enhanced book card with highlighting */}
            <BookCard
              book={book}
              titleHighlight={searchQuery ? highlightText(book.title, searchQuery) : undefined}
              authorHighlight={searchQuery ? highlightText(book.author, searchQuery) : undefined}
              descriptionHighlight={searchQuery ? highlightText(book.description || '', searchQuery) : undefined}
              showRank={showRanking && !!book.search_rank}
              rank={book.search_rank}
            />
          </div>
        ))}
      </div>

      {/* Results footer */}
      {results.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {results.length} result{results.length !== 1 ? 's' : ''}
          {searchQuery && ` for "${searchQuery}"`}
        </div>
      )}
    </div>
  )
}