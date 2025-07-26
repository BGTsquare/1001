'use client'

import { useState, useEffect, useCallback } from 'react'
import { BundleCard } from './bundle-card'
import { SearchBar } from '../books/search-bar'
import { Pagination, PaginationInfo } from '../books/pagination'
import { clientBundleService } from '@/lib/services/client-bundle-service'
import type { Bundle } from '@/types'
import type { BundleSearchOptions } from '@/lib/services/client-bundle-service'
import { cn } from '@/lib/utils'

interface BundleGridProps {
  initialBundles?: Bundle[]
  initialTotal?: number
  itemsPerPage?: number
  className?: string
  showSearch?: boolean
  showPagination?: boolean
}

export function BundleGrid({
  initialBundles = [],
  initialTotal = 0,
  itemsPerPage = 12,
  className,
  showSearch = true,
  showPagination = true
}: BundleGridProps) {
  const [bundles, setBundles] = useState<Bundle[]>(initialBundles)
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Load bundles when search or page changes
  const loadBundles = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const searchOptions: BundleSearchOptions = {
        query: searchQuery || undefined,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        sortBy: 'created_at',
        sortOrder: 'desc'
      }

      const result = await clientBundleService.searchBundles(searchOptions, true)

      if (result.success && result.data) {
        setBundles(result.data.bundles)
        setTotal(result.data.total)
      } else {
        setError(result.error || 'Failed to load bundles')
        setBundles([])
        setTotal(0)
      }
    } catch (error) {
      console.error('Error loading bundles:', error)
      setError('An unexpected error occurred')
      setBundles([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, currentPage, itemsPerPage])

  // Load bundles when dependencies change
  useEffect(() => {
    loadBundles()
  }, [loadBundles])

  // Reset to first page when search changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchQuery])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const totalPages = Math.ceil(total / itemsPerPage)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search */}
      {showSearch && (
        <div className="space-y-4">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search bundles..."
            className="max-w-2xl mx-auto"
          />
        </div>
      )}

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse"
            >
              <div className="bg-muted rounded-lg aspect-[4/3] mb-4" />
              <div className="space-y-2">
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
            onClick={loadBundles}
            className="text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && bundles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">
            {searchQuery
              ? 'No bundles found matching your search'
              : 'No bundles available'
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-primary hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Bundles Grid */}
      {!isLoading && !error && bundles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </div>
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