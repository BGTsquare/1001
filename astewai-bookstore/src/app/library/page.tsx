'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { LibraryTabs, LibraryGrid, LibraryFilters } from '@/components/library'
import { clientLibraryService } from '@/lib/services/client-library-service'
import type { UserLibrary } from '@/types'
import type { LibrarySearchOptions } from '@/lib/types/library'

export const dynamic = 'force-dynamic';

type LibraryTab = 'all' | 'in-progress' | 'completed'
type SortOption = 'added_at' | 'progress' | 'title' | 'updated_at'
type SortOrder = 'asc' | 'desc'

export default function LibraryPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<LibraryTab>('all')
  const [books, setBooks] = useState<UserLibrary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('added_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0
  })

  // Load library data
  const loadLibrary = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const searchOptions: LibrarySearchOptions = {
        sortBy,
        sortOrder
      }

      // Add status filter based on active tab
      if (activeTab === 'in-progress') {
        // For in-progress, we need books that are owned with progress > 0 and < 100
        // This will be handled by getting all books and filtering client-side
        // since the repository doesn't have a direct "in-progress" status
      } else if (activeTab === 'completed') {
        searchOptions.status = 'completed'
      }

      const result = await clientLibraryService.getUserLibrary(user.id, searchOptions)

      if (result.success && result.data) {
        let filteredBooks = result.data

        // Client-side filtering for in-progress books
        if (activeTab === 'in-progress') {
          filteredBooks = result.data.filter(
            book => book.status === 'owned' && book.progress > 0 && book.progress < 100
          )
        }

        setBooks(filteredBooks)

        // Update stats
        if (result.stats) {
          setStats({
            total: result.stats.total,
            inProgress: result.stats.inProgress,
            completed: result.stats.completed
          })
        }
      } else {
        setError(result.error || 'Failed to load library')
        setBooks([])
      }
    } catch (error) {
      console.error('Error loading library:', error)
      setError('An unexpected error occurred')
      setBooks([])
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, activeTab, sortBy, sortOrder])

  // Load library when dependencies change
  useEffect(() => {
    loadLibrary()
  }, [loadLibrary])

  // Handle tab change
  const handleTabChange = useCallback((tab: LibraryTab) => {
    setActiveTab(tab)
  }, [])

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: SortOption, newSortOrder: SortOrder) => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }, [])

  // Handle progress update
  const handleProgressUpdate = useCallback(async (bookId: string, progress: number) => {
    if (!user?.id) return

    try {
      const result = await clientLibraryService.updateReadingProgress(
        user.id,
        bookId,
        progress
      )

      if (result.success) {
        // Reload library to get updated data
        loadLibrary()
      } else {
        console.error('Failed to update progress:', result.error)
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }, [user?.id, loadLibrary])

  // Handle status update
  const handleStatusUpdate = useCallback(async (bookId: string, status: 'owned' | 'pending' | 'completed') => {
    if (!user?.id) return

    try {
      let result
      if (status === 'completed') {
        result = await clientLibraryService.markBookAsCompleted(user.id, bookId)
      } else {
        // For other status updates, we'd need to add this to the service
        console.warn('Status update not implemented for:', status)
        return
      }

      if (result.success) {
        // Reload library to get updated data
        loadLibrary()
      } else {
        console.error('Failed to update status:', result.error)
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }, [user?.id, loadLibrary])

  // Handle book removal
  const handleRemoveBook = useCallback(async (bookId: string) => {
    if (!user?.id) return

    try {
      const result = await clientLibraryService.removeBookFromLibrary(user.id, bookId)

      if (result.success) {
        // Reload library to get updated data
        loadLibrary()
      } else {
        console.error('Failed to remove book:', result.error)
      }
    } catch (error) {
      console.error('Error removing book:', error)
    }
  }, [user?.id, loadLibrary])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Please log in to view your library</h1>
          <p className="text-muted-foreground">
            You need to be logged in to access your personal book collection.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">My Library</h1>
          <p className="text-muted-foreground">
            Manage your personal book collection and reading progress
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive">{error}</p>
            <button
              onClick={loadLibrary}
              className="mt-2 text-sm text-destructive hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Filters */}
        <LibraryFilters
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />

        {/* Library Tabs and Content */}
        <LibraryTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          stats={stats}
        >
          <LibraryGrid
            books={books}
            isLoading={isLoading}
            onProgressUpdate={handleProgressUpdate}
            onStatusUpdate={handleStatusUpdate}
            onRemoveBook={handleRemoveBook}
          />
        </LibraryTabs>
      </div>
    </div>
  )
}
