'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  DollarSign,
  TrendingUp,
  BookOpen
} from 'lucide-react'
import { BundleCreateDialog } from './bundle-create-dialog'
import { BundleEditDialog } from './bundle-edit-dialog'
import { BundleAnalyticsDialog } from './bundle-analytics-dialog'
import { BundleDeleteDialog } from './bundle-delete-dialog'
import type { Bundle } from '@/types'

interface BundleWithBooks extends Bundle {
  books: Array<{
    id: string
    title: string
    author: string
    price: number
  }>
}

interface BundleSearchResult {
  bundles: BundleWithBooks[]
  total: number
}

export function BundleManager() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBundle, setSelectedBundle] = useState<BundleWithBooks | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'price'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const queryClient = useQueryClient()
  const limit = 10

  // Fetch bundles
  const { data: bundleData, isLoading, error } = useQuery<BundleSearchResult>({
    queryKey: ['admin-bundles', searchQuery, currentPage, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (currentPage * limit).toString(),
        sortBy,
        sortOrder
      })

      if (searchQuery.trim()) {
        params.append('query', searchQuery.trim())
      }

      const response = await fetch(`/api/admin/bundles?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch bundles')
      }
      return response.json()
    }
  })

  const bundles = bundleData?.bundles || []
  const totalBundles = bundleData?.total || 0
  const totalPages = Math.ceil(totalBundles / limit)

  // Handle search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(0) // Reset to first page when searching
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-bundles'] })
    setShowCreateDialog(false)
  }

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-bundles'] })
    setShowEditDialog(false)
    setSelectedBundle(null)
  }

  const handleDeleteSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-bundles'] })
    setShowDeleteDialog(false)
    setSelectedBundle(null)
  }

  const handleEdit = (bundle: BundleWithBooks) => {
    setSelectedBundle(bundle)
    setShowEditDialog(true)
  }

  const handleDelete = (bundle: BundleWithBooks) => {
    setSelectedBundle(bundle)
    setShowDeleteDialog(true)
  }

  const handleViewAnalytics = (bundle: BundleWithBooks) => {
    setSelectedBundle(bundle)
    setShowAnalyticsDialog(true)
  }

  const calculateSavings = (bundle: BundleWithBooks) => {
    const totalBookPrice = bundle.books?.reduce((sum, book) => sum + book.price, 0) || 0
    const savings = totalBookPrice - bundle.price
    const discountPercentage = totalBookPrice > 0 ? (savings / totalBookPrice) * 100 : 0
    return { savings, discountPercentage }
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Failed to load bundles. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bundle Management</h1>
          <p className="text-muted-foreground">
            Create and manage book bundles
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Bundle
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search bundles by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'created_at' | 'title' | 'price')}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="created_at">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="price">Sort by Price</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bundle List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="flex space-x-4">
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bundles.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No bundles found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Try adjusting your search terms' : 'Create your first bundle to get started'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Bundle
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          bundles.map((bundle) => {
            const { savings, discountPercentage } = calculateSavings(bundle)
            
            return (
              <Card key={bundle.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{bundle.title}</CardTitle>
                      {bundle.description && (
                        <CardDescription className="mt-2">
                          {bundle.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAnalytics(bundle)}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Analytics
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(bundle)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(bundle)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Pricing Info */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-medium">${bundle.price.toFixed(2)}</span>
                      </div>
                      {savings > 0 && (
                        <div className="text-sm text-muted-foreground">
                          <div>Save ${savings.toFixed(2)} ({discountPercentage.toFixed(1)}% off)</div>
                        </div>
                      )}
                    </div>

                    {/* Book Count */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">
                          {bundle.books?.length || 0} books
                        </span>
                      </div>
                      {bundle.books && bundle.books.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {bundle.books.slice(0, 2).map(book => book.title).join(', ')}
                          {bundle.books.length > 2 && ` +${bundle.books.length - 2} more`}
                        </div>
                      )}
                    </div>

                    {/* Created Date */}
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(bundle.created_at).toLocaleDateString()}
                      </div>
                      {bundle.updated_at !== bundle.created_at && (
                        <div className="text-sm text-muted-foreground">
                          Updated: {new Date(bundle.updated_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {currentPage * limit + 1} to {Math.min((currentPage + 1) * limit, totalBundles)} of {totalBundles} bundles
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <BundleCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />

      {selectedBundle && (
        <>
          <BundleEditDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            bundle={selectedBundle}
            onSuccess={handleEditSuccess}
          />

          <BundleAnalyticsDialog
            open={showAnalyticsDialog}
            onOpenChange={setShowAnalyticsDialog}
            bundle={selectedBundle}
          />

          <BundleDeleteDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            bundle={selectedBundle}
            onSuccess={handleDeleteSuccess}
          />
        </>
      )}
    </div>
  )
}